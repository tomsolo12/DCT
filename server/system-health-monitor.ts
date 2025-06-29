import { db } from "./db";
import { dataSources, dataTables, dataFields, dataQualityRules, dataQualityResults, activityLogs } from "@shared/schema";
import { sql } from "drizzle-orm";

export interface SystemHealthMetrics {
  timestamp: Date;
  database: {
    status: 'healthy' | 'degraded' | 'critical';
    connectionPool: {
      active: number;
      idle: number;
      total: number;
    };
    queryPerformance: {
      avgResponseTime: number;
      slowQueries: number;
      failedQueries: number;
    };
  };
  dataSources: {
    total: number;
    active: number;
    inactive: number;
    lastScanStatus: Record<number, {
      status: 'success' | 'failed' | 'pending';
      lastScanAt: Date | null;
      errorCount: number;
    }>;
  };
  dataQuality: {
    totalRules: number;
    activeRules: number;
    overallScore: number;
    failingTables: number;
    lastExecutionStatus: 'success' | 'partial' | 'failed';
  };
  performance: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    apiLatency: {
      avg: number;
      p95: number;
      p99: number;
    };
  };
  alerts: SystemAlert[];
}

export interface SystemAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'database' | 'data_quality' | 'performance' | 'security';
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export class SystemHealthMonitor {
  private alerts: Map<string, SystemAlert> = new Map();
  private performanceMetrics: Array<{ timestamp: Date; responseTime: number; endpoint: string }> = [];
  private readonly maxMetricsHistory = 1000;

  async getSystemHealth(): Promise<SystemHealthMetrics> {
    const timestamp = new Date();
    
    const [
      databaseHealth,
      dataSourcesHealth,
      dataQualityHealth,
      performanceHealth
    ] = await Promise.all([
      this.getDatabaseHealth(),
      this.getDataSourcesHealth(),
      this.getDataQualityHealth(),
      this.getPerformanceHealth()
    ]);

    // Update alerts based on health metrics
    this.updateAlerts({
      database: databaseHealth,
      dataSources: dataSourcesHealth,
      dataQuality: dataQualityHealth,
      performance: performanceHealth
    });

    return {
      timestamp,
      database: databaseHealth,
      dataSources: dataSourcesHealth,
      dataQuality: dataQualityHealth,
      performance: performanceHealth,
      alerts: Array.from(this.alerts.values()).filter(alert => !alert.resolved)
    };
  }

  private async getDatabaseHealth() {
    try {
      const startTime = Date.now();
      
      // Test database connectivity and get basic stats
      const [connectionTest, tableStats] = await Promise.all([
        db.execute(sql`SELECT 1 as test`),
        this.getDatabaseStats()
      ]);

      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 100 ? 'healthy' as const : 
               responseTime < 500 ? 'degraded' as const : 'critical' as const,
        connectionPool: {
          active: 5, // Mock values - would integrate with actual pool metrics
          idle: 10,
          total: 15
        },
        queryPerformance: {
          avgResponseTime: responseTime,
          slowQueries: await this.getSlowQueriesCount(),
          failedQueries: await this.getFailedQueriesCount()
        }
      };
    } catch (error) {
      return {
        status: 'critical' as const,
        connectionPool: { active: 0, idle: 0, total: 0 },
        queryPerformance: { avgResponseTime: 0, slowQueries: 0, failedQueries: 1 }
      };
    }
  }

  private async getDatabaseStats() {
    try {
      const stats = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM ${dataSources}) as sources_count,
          (SELECT COUNT(*) FROM ${dataTables}) as tables_count,
          (SELECT COUNT(*) FROM ${dataFields}) as fields_count,
          (SELECT COUNT(*) FROM ${dataQualityRules}) as rules_count
      `);
      return stats.rows[0];
    } catch {
      return { sources_count: 0, tables_count: 0, fields_count: 0, rules_count: 0 };
    }
  }

  private async getSlowQueriesCount(): Promise<number> {
    // In production, this would query actual slow query logs
    return this.performanceMetrics.filter(m => m.responseTime > 1000).length;
  }

  private async getFailedQueriesCount(): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*) as failed_count 
        FROM ${activityLogs} 
        WHERE type = 'query_executed' 
        AND description LIKE '%failed%'
        AND "createdAt" > NOW() - INTERVAL '1 hour'
      `);
      return parseInt(result.rows[0]?.failed_count as string) || 0;
    } catch {
      return 0;
    }
  }

  private async getDataSourcesHealth() {
    try {
      const sources = await db.select().from(dataSources);
      const total = sources.length;
      const active = sources.filter(s => s.isActive).length;
      const inactive = total - active;

      const lastScanStatus: Record<number, any> = {};
      for (const source of sources) {
        lastScanStatus[source.id] = {
          status: source.lastScanAt ? 'success' : 'pending',
          lastScanAt: source.lastScanAt,
          errorCount: 0 // Would track actual errors in production
        };
      }

      return {
        total,
        active,
        inactive,
        lastScanStatus
      };
    } catch {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        lastScanStatus: {}
      };
    }
  }

  private async getDataQualityHealth() {
    try {
      const [rules, results] = await Promise.all([
        db.select().from(dataQualityRules),
        db.select().from(dataQualityResults)
      ]);

      const totalRules = rules.length;
      const activeRules = rules.filter(r => r.isActive).length;
      
      // Calculate overall quality score
      const scores = results.map(r => r.score || 0);
      const overallScore = scores.length > 0 ? 
        scores.reduce((a, b) => a + b, 0) / scores.length : 100;
      
      const failingTables = results.filter(r => (r.score || 0) < 70).length;
      
      return {
        totalRules,
        activeRules,
        overallScore: Math.round(overallScore),
        failingTables,
        lastExecutionStatus: overallScore >= 90 ? 'success' as const :
                           overallScore >= 70 ? 'partial' as const : 'failed' as const
      };
    } catch {
      return {
        totalRules: 0,
        activeRules: 0,
        overallScore: 0,
        failingTables: 0,
        lastExecutionStatus: 'failed' as const
      };
    }
  }

  private async getPerformanceHealth() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Calculate API latency metrics from recent performance data
    const recentMetrics = this.performanceMetrics
      .filter(m => Date.now() - m.timestamp.getTime() < 300000) // Last 5 minutes
      .map(m => m.responseTime)
      .sort((a, b) => a - b);

    const avg = recentMetrics.length > 0 ? 
      recentMetrics.reduce((a, b) => a + b, 0) / recentMetrics.length : 0;
    
    const p95Index = Math.floor(recentMetrics.length * 0.95);
    const p99Index = Math.floor(recentMetrics.length * 0.99);
    
    return {
      memoryUsage,
      uptime,
      apiLatency: {
        avg: Math.round(avg),
        p95: recentMetrics[p95Index] || 0,
        p99: recentMetrics[p99Index] || 0
      }
    };
  }

  private updateAlerts(healthData: any) {
    // Database alerts
    if (healthData.database.status === 'critical') {
      this.addAlert({
        id: 'db-critical',
        severity: 'critical',
        category: 'database',
        message: 'Database connection is critical',
        timestamp: new Date(),
        resolved: false
      });
    } else {
      this.resolveAlert('db-critical');
    }

    // Performance alerts
    if (healthData.performance.apiLatency.avg > 1000) {
      this.addAlert({
        id: 'api-slow',
        severity: 'warning',
        category: 'performance',
        message: `API response time is high: ${healthData.performance.apiLatency.avg}ms`,
        timestamp: new Date(),
        resolved: false
      });
    } else {
      this.resolveAlert('api-slow');
    }

    // Data Quality alerts
    if (healthData.dataQuality.overallScore < 70) {
      this.addAlert({
        id: 'dq-failing',
        severity: 'warning',
        category: 'data_quality',
        message: `Data quality score is low: ${healthData.dataQuality.overallScore}%`,
        timestamp: new Date(),
        resolved: false,
        metadata: { score: healthData.dataQuality.overallScore }
      });
    } else {
      this.resolveAlert('dq-failing');
    }

    // Memory usage alerts
    const memoryUsagePercent = (healthData.performance.memoryUsage.heapUsed / healthData.performance.memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > 90) {
      this.addAlert({
        id: 'memory-high',
        severity: 'critical',
        category: 'performance',
        message: `Memory usage is critical: ${memoryUsagePercent.toFixed(1)}%`,
        timestamp: new Date(),
        resolved: false,
        metadata: { memoryUsagePercent }
      });
    } else if (memoryUsagePercent > 80) {
      this.addAlert({
        id: 'memory-warning',
        severity: 'warning',
        category: 'performance',
        message: `Memory usage is high: ${memoryUsagePercent.toFixed(1)}%`,
        timestamp: new Date(),
        resolved: false,
        metadata: { memoryUsagePercent }
      });
    } else {
      this.resolveAlert('memory-high');
      this.resolveAlert('memory-warning');
    }
  }

  private addAlert(alert: SystemAlert) {
    this.alerts.set(alert.id, alert);
  }

  private resolveAlert(alertId: string) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.timestamp = new Date();
    }
  }

  recordApiCall(endpoint: string, responseTime: number) {
    this.performanceMetrics.push({
      timestamp: new Date(),
      responseTime,
      endpoint
    });

    // Keep only recent metrics
    if (this.performanceMetrics.length > this.maxMetricsHistory) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetricsHistory);
    }
  }

  async generateHealthReport(): Promise<string> {
    const health = await this.getSystemHealth();
    
    return `
System Health Report - ${health.timestamp.toISOString()}

Database Status: ${health.database.status.toUpperCase()}
- Connection Pool: ${health.database.connectionPool.active}/${health.database.connectionPool.total} active
- Avg Query Time: ${health.database.queryPerformance.avgResponseTime}ms
- Slow Queries: ${health.database.queryPerformance.slowQueries}
- Failed Queries: ${health.database.queryPerformance.failedQueries}

Data Sources: ${health.dataSources.active}/${health.dataSources.total} active

Data Quality:
- Overall Score: ${health.dataQuality.overallScore}%
- Active Rules: ${health.dataQuality.activeRules}/${health.dataQuality.totalRules}
- Failing Tables: ${health.dataQuality.failingTables}

Performance:
- Memory Usage: ${(health.performance.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)}MB
- Uptime: ${Math.floor(health.performance.uptime / 3600)}h ${Math.floor((health.performance.uptime % 3600) / 60)}m
- API Latency: ${health.performance.apiLatency.avg}ms (avg), ${health.performance.apiLatency.p95}ms (p95)

Active Alerts: ${health.alerts.length}
${health.alerts.map(alert => `- [${alert.severity.toUpperCase()}] ${alert.message}`).join('\n')}
    `.trim();
  }

  getAlerts(): SystemAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  clearResolvedAlerts() {
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.resolved && Date.now() - alert.timestamp.getTime() > 3600000) { // 1 hour
        this.alerts.delete(id);
      }
    }
  }
}

export const systemHealthMonitor = new SystemHealthMonitor();