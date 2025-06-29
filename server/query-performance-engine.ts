import { db } from "./db";
import { storage } from "./storage";
import { Pool } from "@neondatabase/serverless";

export interface QueryMetrics {
  queryId: string;
  executionTime: number;
  rowsReturned: number;
  rowsScanned: number;
  memoryUsage: number;
  cpuTime: number;
  ioOperations: number;
  cacheHits: number;
  indexesUsed: string[];
  warnings: string[];
  suggestions: string[];
}

export interface QueryPlan {
  nodeType: string;
  operation: string;
  cost: number;
  rows: number;
  width: number;
  actualTime: number;
  actualRows: number;
  actualLoops: number;
  children?: QueryPlan[];
  indexName?: string;
  filter?: string;
  joinType?: string;
}

export interface QueryExecutionResult {
  success: boolean;
  data?: any[];
  error?: string;
  metrics: QueryMetrics;
  executionPlan?: QueryPlan;
  optimizationSuggestions: string[];
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export class QueryPerformanceEngine {
  private executionHistory: Map<string, QueryMetrics[]> = new Map();

  async executeQueryWithAnalysis(
    sql: string, 
    sourceId: number, 
    options: { analyze?: boolean; explain?: boolean } = {}
  ): Promise<QueryExecutionResult> {
    const queryId = this.generateQueryId(sql);
    const startTime = Date.now();
    
    try {
      // Get data source connection
      const dataSource = await storage.getDataSource(sourceId);
      if (!dataSource) {
        throw new Error(`Data source ${sourceId} not found`);
      }

      const connectionString = dataSource.connectionString;
      const pool = new Pool({ connectionString });

      let executionPlan: QueryPlan | undefined;
      let actualResult: any;
      let rowsReturned = 0;

      // Get execution plan if requested
      if (options.explain) {
        executionPlan = await this.getExecutionPlan(pool, sql);
      }

      // Execute the actual query
      const result = await pool.query(sql);
      actualResult = result.rows;
      rowsReturned = result.rowCount || 0;

      const executionTime = Date.now() - startTime;

      // Generate performance metrics
      const metrics = await this.generateMetrics(
        queryId,
        sql,
        executionTime,
        rowsReturned,
        executionPlan
      );

      // Store execution history
      this.updateExecutionHistory(queryId, metrics);

      // Generate optimization suggestions
      const optimizationSuggestions = this.generateOptimizationSuggestions(
        sql,
        metrics,
        executionPlan
      );

      // Calculate performance grade
      const performanceGrade = this.calculatePerformanceGrade(metrics);

      // Log activity
      await storage.createActivityLog({
        type: 'query_executed',
        description: `Query executed in ${executionTime}ms - ${rowsReturned} rows returned`,
        metadata: {
          sourceId,
          executionTime,
          rowsReturned,
          performanceGrade,
          queryHash: queryId
        }
      });

      return {
        success: true,
        data: actualResult,
        metrics,
        executionPlan,
        optimizationSuggestions,
        performanceGrade
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMetrics: QueryMetrics = {
        queryId,
        executionTime,
        rowsReturned: 0,
        rowsScanned: 0,
        memoryUsage: 0,
        cpuTime: 0,
        ioOperations: 0,
        cacheHits: 0,
        indexesUsed: [],
        warnings: [error instanceof Error ? error.message : 'Unknown error'],
        suggestions: ['Check query syntax and table/column names']
      };

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: errorMetrics,
        optimizationSuggestions: [],
        performanceGrade: 'F'
      };
    }
  }

  private async getExecutionPlan(pool: Pool, sql: string): Promise<QueryPlan> {
    try {
      const planResult = await pool.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`);
      const planData = planResult.rows[0]['QUERY PLAN'][0];
      return this.parseExecutionPlan(planData.Plan);
    } catch (error) {
      // Return a basic plan if explain fails
      return {
        nodeType: 'Unknown',
        operation: 'Query execution',
        cost: 0,
        rows: 0,
        width: 0,
        actualTime: 0,
        actualRows: 0,
        actualLoops: 1
      };
    }
  }

  private parseExecutionPlan(plan: any): QueryPlan {
    return {
      nodeType: plan['Node Type'] || 'Unknown',
      operation: plan['Operation'] || 'Unknown',
      cost: plan['Total Cost'] || 0,
      rows: plan['Plan Rows'] || 0,
      width: plan['Plan Width'] || 0,
      actualTime: plan['Actual Total Time'] || 0,
      actualRows: plan['Actual Rows'] || 0,
      actualLoops: plan['Actual Loops'] || 1,
      indexName: plan['Index Name'],
      filter: plan['Filter'],
      joinType: plan['Join Type'],
      children: plan['Plans']?.map((child: any) => this.parseExecutionPlan(child))
    };
  }

  private async generateMetrics(
    queryId: string,
    sql: string,
    executionTime: number,
    rowsReturned: number,
    executionPlan?: QueryPlan
  ): Promise<QueryMetrics> {
    // Analyze SQL to estimate complexity
    const sqlUpper = sql.toUpperCase();
    const hasJoins = sqlUpper.includes('JOIN');
    const hasSubqueries = sqlUpper.includes('(SELECT');
    const hasAggregates = /GROUP BY|COUNT|SUM|AVG|MAX|MIN/.test(sqlUpper);
    const hasWildcard = sqlUpper.includes('SELECT *');

    // Estimate metrics based on query characteristics
    const baseComplexity = 1 + 
      (hasJoins ? 2 : 0) + 
      (hasSubqueries ? 3 : 0) + 
      (hasAggregates ? 1 : 0);

    const estimatedRowsScanned = Math.max(rowsReturned * baseComplexity, rowsReturned);
    const estimatedMemoryUsage = rowsReturned * 0.001; // MB
    const estimatedCpuTime = executionTime * 0.8; // 80% of execution time
    const estimatedIoOps = Math.ceil(estimatedRowsScanned / 1000);

    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Generate warnings and suggestions
    if (executionTime > 5000) {
      warnings.push('Query execution time exceeds 5 seconds');
      suggestions.push('Consider adding indexes or optimizing WHERE clauses');
    }

    if (hasWildcard) {
      warnings.push('Using SELECT * can impact performance');
      suggestions.push('Specify only the columns you need');
    }

    if (rowsReturned > 10000) {
      warnings.push('Large result set returned');
      suggestions.push('Consider using LIMIT clause or adding filters');
    }

    if (hasJoins && !executionPlan?.indexesUsed?.length) {
      suggestions.push('Consider adding indexes on join columns');
    }

    return {
      queryId,
      executionTime,
      rowsReturned,
      rowsScanned: estimatedRowsScanned,
      memoryUsage: estimatedMemoryUsage,
      cpuTime: estimatedCpuTime,
      ioOperations: estimatedIoOps,
      cacheHits: Math.max(0, estimatedIoOps - Math.ceil(estimatedIoOps * 0.3)),
      indexesUsed: executionPlan?.indexName ? [executionPlan.indexName] : [],
      warnings,
      suggestions
    };
  }

  private generateOptimizationSuggestions(
    sql: string,
    metrics: QueryMetrics,
    executionPlan?: QueryPlan
  ): string[] {
    const suggestions: string[] = [...metrics.suggestions];

    // Performance-based suggestions
    if (metrics.executionTime > 1000) {
      suggestions.push('Query is slow - consider query optimization');
    }

    if (metrics.rowsScanned > metrics.rowsReturned * 10) {
      suggestions.push('High scan-to-return ratio - check if proper indexes exist');
    }

    if (metrics.memoryUsage > 100) {
      suggestions.push('High memory usage - consider reducing result set size');
    }

    // Execution plan analysis
    if (executionPlan) {
      if (executionPlan.nodeType === 'Seq Scan') {
        suggestions.push('Sequential scan detected - consider adding an index');
      }

      if (executionPlan.nodeType === 'Nested Loop' && executionPlan.actualRows > 1000) {
        suggestions.push('Large nested loop join - consider using hash join instead');
      }
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  private calculatePerformanceGrade(metrics: QueryMetrics): 'A' | 'B' | 'C' | 'D' | 'F' {
    let score = 100;

    // Execution time penalties
    if (metrics.executionTime > 10000) score -= 40;
    else if (metrics.executionTime > 5000) score -= 30;
    else if (metrics.executionTime > 1000) score -= 20;
    else if (metrics.executionTime > 500) score -= 10;

    // Efficiency penalties
    const scanRatio = metrics.rowsScanned / Math.max(metrics.rowsReturned, 1);
    if (scanRatio > 100) score -= 30;
    else if (scanRatio > 50) score -= 20;
    else if (scanRatio > 10) score -= 10;

    // Memory usage penalties
    if (metrics.memoryUsage > 500) score -= 20;
    else if (metrics.memoryUsage > 100) score -= 10;

    // Index usage bonus
    if (metrics.indexesUsed.length > 0) score += 5;

    // Warning penalties
    score -= metrics.warnings.length * 5;

    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private generateQueryId(sql: string): string {
    // Create a hash of the SQL query for tracking
    const normalized = sql.trim().toLowerCase().replace(/\s+/g, ' ');
    return btoa(normalized).substring(0, 16);
  }

  private updateExecutionHistory(queryId: string, metrics: QueryMetrics): void {
    if (!this.executionHistory.has(queryId)) {
      this.executionHistory.set(queryId, []);
    }
    
    const history = this.executionHistory.get(queryId)!;
    history.push(metrics);
    
    // Keep only last 10 executions
    if (history.length > 10) {
      history.shift();
    }
  }

  async getQueryHistory(queryId: string): Promise<QueryMetrics[]> {
    return this.executionHistory.get(queryId) || [];
  }

  async getPerformanceStats(): Promise<{
    totalQueries: number;
    averageExecutionTime: number;
    slowestQueries: Array<{ queryId: string; executionTime: number }>;
    mostFrequentSuggestions: Array<{ suggestion: string; count: number }>;
  }> {
    const allMetrics: QueryMetrics[] = [];
    this.executionHistory.forEach(history => allMetrics.push(...history));

    if (allMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageExecutionTime: 0,
        slowestQueries: [],
        mostFrequentSuggestions: []
      };
    }

    const averageExecutionTime = allMetrics.reduce((sum, m) => sum + m.executionTime, 0) / allMetrics.length;
    
    const slowestQueries = allMetrics
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 5)
      .map(m => ({ queryId: m.queryId, executionTime: m.executionTime }));

    // Count suggestion frequencies
    const suggestionCounts = new Map<string, number>();
    allMetrics.forEach(m => {
      m.suggestions.forEach(s => {
        suggestionCounts.set(s, (suggestionCounts.get(s) || 0) + 1);
      });
    });

    const mostFrequentSuggestions = Array.from(suggestionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([suggestion, count]) => ({ suggestion, count }));

    return {
      totalQueries: allMetrics.length,
      averageExecutionTime: Math.round(averageExecutionTime),
      slowestQueries,
      mostFrequentSuggestions
    };
  }
}

export const queryPerformanceEngine = new QueryPerformanceEngine();