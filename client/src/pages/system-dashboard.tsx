import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity, AlertTriangle, CheckCircle, Clock, Database, 
  HardDrive, Cpu, Wifi, Zap, Shield, RefreshCw, AlertCircle, Server
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemHealth {
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
  };
  dataQuality: {
    totalRules: number;
    activeRules: number;
    overallScore: number;
    failingTables: number;
    lastExecutionStatus: 'success' | 'partial' | 'failed';
  };
  performance: {
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    uptime: number;
    apiLatency: {
      avg: number;
      p95: number;
      p99: number;
    };
  };
  alerts: Array<{
    id: string;
    severity: 'info' | 'warning' | 'critical';
    category: 'database' | 'data_quality' | 'performance' | 'security';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;
}

interface PerformanceStats {
  cache: {
    totalEntries: number;
    memoryUsage: number;
    hitRate: number;
  };
  rateLimit: {
    activeClients: number;
    totalRequests: number;
    blockedRequests: number;
  };
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  uptime: number;
}

export default function SystemDashboard() {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const { data: systemHealth, isLoading: healthLoading, refetch: refetchHealth } = useQuery<SystemHealth>({
    queryKey: ['/api/system/health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: performanceStats, isLoading: perfLoading, refetch: refetchPerf } = useQuery<PerformanceStats>({
    queryKey: ['/api/system/performance'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchHealth(), refetchPerf()]);
      toast({
        title: "Refreshed",
        description: "System metrics updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh system metrics",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearCache = async (pattern?: string) => {
    try {
      const response = await fetch('/api/system/cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern }),
      });
      
      if (!response.ok) throw new Error('Failed to clear cache');
      
      const result = await response.json();
      toast({
        title: "Cache Cleared",
        description: result.message,
      });
      
      await refetchPerf();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (healthLoading || perfLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading system dashboard...</div>
      </div>
    );
  }

  const memoryUsagePercent = systemHealth ? 
    Math.round((systemHealth.performance.memoryUsage.heapUsed / systemHealth.performance.memoryUsage.heapTotal) * 100) : 0;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-300 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">System Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Real-time monitoring and performance metrics
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Database className="w-4 h-4 mr-2 text-blue-600" />
                Database Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {systemHealth && getStatusIcon(systemHealth.database.status)}
                <span className={`font-semibold ${systemHealth && getStatusColor(systemHealth.database.status)}`}>
                  {systemHealth?.database.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {systemHealth?.database.queryPerformance.avgResponseTime}ms avg response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="w-4 h-4 mr-2 text-green-600" />
                Data Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-green-600">
                  {systemHealth?.dataQuality.overallScore}%
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {systemHealth?.dataQuality.activeRules} active rules
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <HardDrive className="w-4 h-4 mr-2 text-purple-600" />
                Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{memoryUsagePercent}%</span>
                  <span className="text-gray-500">
                    {systemHealth && formatBytes(systemHealth.performance.memoryUsage.heapUsed)}
                  </span>
                </div>
                <Progress value={memoryUsagePercent} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="w-4 h-4 mr-2 text-orange-600" />
                System Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {systemHealth && formatUptime(systemHealth.performance.uptime)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Since last restart
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="cache">Cache & Optimization</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Database Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    Database Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Connection Pool</div>
                      <div className="font-medium">
                        {systemHealth?.database.connectionPool.active}/{systemHealth?.database.connectionPool.total} active
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Avg Response Time</div>
                      <div className="font-medium">{systemHealth?.database.queryPerformance.avgResponseTime}ms</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Slow Queries</div>
                      <div className="font-medium">{systemHealth?.database.queryPerformance.slowQueries}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Failed Queries</div>
                      <div className="font-medium">{systemHealth?.database.queryPerformance.failedQueries}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Server className="w-5 h-5 mr-2" />
                    Data Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Total Sources</div>
                      <div className="font-medium">{systemHealth?.dataSources.total}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Active Sources</div>
                      <div className="font-medium text-green-600">{systemHealth?.dataSources.active}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Inactive Sources</div>
                      <div className="font-medium text-red-600">{systemHealth?.dataSources.inactive}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Active Percentage</div>
                      <div className="font-medium">
                        {systemHealth && systemHealth.dataSources.total > 0 
                          ? Math.round((systemHealth.dataSources.active / systemHealth.dataSources.total) * 100)
                          : 0}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* API Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    API Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Average</div>
                      <div className="font-medium">{systemHealth?.performance.apiLatency.avg}ms</div>
                    </div>
                    <div>
                      <div className="text-gray-600">95th Percentile</div>
                      <div className="font-medium">{systemHealth?.performance.apiLatency.p95}ms</div>
                    </div>
                    <div>
                      <div className="text-gray-600">99th Percentile</div>
                      <div className="font-medium">{systemHealth?.performance.apiLatency.p99}ms</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Memory Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HardDrive className="w-5 h-5 mr-2" />
                    Memory Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Heap Used</span>
                      <span>{systemHealth && formatBytes(systemHealth.performance.memoryUsage.heapUsed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Heap Total</span>
                      <span>{systemHealth && formatBytes(systemHealth.performance.memoryUsage.heapTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>RSS</span>
                      <span>{systemHealth && formatBytes(systemHealth.performance.memoryUsage.rss)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>External</span>
                      <span>{systemHealth && formatBytes(systemHealth.performance.memoryUsage.external)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  System Alerts
                </CardTitle>
                <CardDescription>
                  Active alerts and system notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {systemHealth?.alerts && systemHealth.alerts.length > 0 ? (
                    <div className="space-y-2">
                      {systemHealth.alerts.map((alert) => (
                        <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle className="capitalize">{alert.severity} - {alert.category}</AlertTitle>
                          <AlertDescription>
                            {alert.message}
                            <div className="text-xs mt-1 opacity-70">
                              {new Date(alert.timestamp).toLocaleString()}
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                      <p>No active alerts</p>
                      <p className="text-sm">All systems are operating normally</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cache" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cache Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HardDrive className="w-5 h-5 mr-2" />
                    Cache Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Total Entries</div>
                      <div className="font-medium">{performanceStats?.cache.totalEntries || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Memory Usage</div>
                      <div className="font-medium">
                        {performanceStats && formatBytes(performanceStats.cache.memoryUsage)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Hit Rate</div>
                      <div className="font-medium">{performanceStats?.cache.hitRate || 0}%</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => handleClearCache()} 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                    >
                      Clear All Cache
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Rate Limiting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Rate Limiting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Active Clients</div>
                      <div className="font-medium">{performanceStats?.rateLimit.activeClients || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Total Requests</div>
                      <div className="font-medium">{performanceStats?.rateLimit.totalRequests || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Blocked Requests</div>
                      <div className="font-medium text-red-600">
                        {performanceStats?.rateLimit.blockedRequests || 0}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}