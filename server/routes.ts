import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { schemaDiscoveryService } from "./schema-discovery";
import { ruleExecutionEngine } from "./rule-execution-engine";
import { queryPerformanceEngine } from "./query-performance-engine";
import { advancedSearchEngine } from "./advanced-search-engine";
import { systemHealthMonitor } from "./system-health-monitor";
import { optimizer } from "./production-optimizer";
import { 
  insertDataSourceSchema, insertDataTableSchema, insertDataFieldSchema,
  insertDataQualityRuleSchema, insertSavedQuerySchema, insertActivityLogSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Data sources
  app.get("/api/data-sources", async (req, res) => {
    try {
      const sources = await storage.getDataSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data sources" });
    }
  });

  app.get("/api/data-sources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const source = await storage.getDataSource(id);
      if (!source) {
        return res.status(404).json({ error: "Data source not found" });
      }
      res.json(source);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data source" });
    }
  });

  app.post("/api/data-sources", async (req, res) => {
    try {
      const sourceData = insertDataSourceSchema.parse(req.body);
      const source = await storage.createDataSource(sourceData);
      res.status(201).json(source);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data source data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create data source" });
    }
  });

  // Schema discovery endpoints
  app.post("/api/data-sources/:id/scan", async (req, res) => {
    try {
      const sourceId = parseInt(req.params.id);
      const result = await schemaDiscoveryService.discoverSchema(sourceId);
      
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      
      res.json({ 
        message: `Schema discovery completed for source ${sourceId}`,
        tablesFound: result.tables.length,
        tables: result.tables
      });
    } catch (error) {
      console.error('Schema discovery failed:', error);
      res.status(500).json({ error: 'Schema discovery failed' });
    }
  });

  app.post("/api/schema/scan-all", async (req, res) => {
    try {
      const result = await schemaDiscoveryService.scanAllSources();
      res.json(result);
    } catch (error) {
      console.error('Bulk schema scan failed:', error);
      res.status(500).json({ error: 'Bulk schema scan failed' });
    }
  });

  // Rule execution endpoints
  app.post("/api/data-quality-rules/:id/execute", async (req, res) => {
    try {
      const ruleId = parseInt(req.params.id);
      const result = await ruleExecutionEngine.executeRule(ruleId);
      res.json(result);
    } catch (error) {
      console.error('Rule execution failed:', error);
      res.status(500).json({ error: 'Rule execution failed' });
    }
  });

  app.post("/api/data-tables/:id/execute-rules", async (req, res) => {
    try {
      const tableId = parseInt(req.params.id);
      const results = await ruleExecutionEngine.executeAllRulesForTable(tableId);
      res.json({ results, executedCount: results.length });
    } catch (error) {
      console.error('Table rules execution failed:', error);
      res.status(500).json({ error: 'Table rules execution failed' });
    }
  });

  app.post("/api/data-quality/execute-all", async (req, res) => {
    try {
      const result = await ruleExecutionEngine.executeAllActiveRules();
      res.json(result);
    } catch (error) {
      console.error('Bulk rule execution failed:', error);
      res.status(500).json({ error: 'Bulk rule execution failed' });
    }
  });

  app.get("/api/data-quality/score-cards", async (req, res) => {
    try {
      const scoreCards = await ruleExecutionEngine.getQualityScoreCards();
      res.json(scoreCards);
    } catch (error) {
      console.error('Failed to get quality score cards:', error);
      res.status(500).json({ error: 'Failed to get quality score cards' });
    }
  });

  // Data tables
  app.get("/api/data-tables", async (req, res) => {
    try {
      const sourceId = req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined;
      const tables = await storage.getDataTables(sourceId);
      res.json(tables);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data tables" });
    }
  });

  app.get("/api/data-tables/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const table = await storage.getDataTable(id);
      if (!table) {
        return res.status(404).json({ error: "Data table not found" });
      }
      res.json(table);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data table" });
    }
  });

  app.post("/api/data-tables", async (req, res) => {
    try {
      const tableData = insertDataTableSchema.parse(req.body);
      const table = await storage.createDataTable(tableData);
      res.status(201).json(table);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data table data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create data table" });
    }
  });

  // Data fields
  app.get("/api/data-tables/:tableId/fields", async (req, res) => {
    try {
      const tableId = parseInt(req.params.tableId);
      const fields = await storage.getDataFields(tableId);
      res.json(fields);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data fields" });
    }
  });

  app.post("/api/data-fields", async (req, res) => {
    try {
      const fieldData = insertDataFieldSchema.parse(req.body);
      const field = await storage.createDataField(fieldData);
      res.status(201).json(field);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data field data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create data field" });
    }
  });

  // Data quality rules
  app.get("/api/data-quality-rules", async (req, res) => {
    try {
      const tableId = req.query.tableId ? parseInt(req.query.tableId as string) : undefined;
      const rules = await storage.getDataQualityRules(tableId);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data quality rules" });
    }
  });

  app.get("/api/data-quality-rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rule = await storage.getDataQualityRule(id);
      if (!rule) {
        return res.status(404).json({ error: "Data quality rule not found" });
      }
      res.json(rule);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data quality rule" });
    }
  });

  app.post("/api/data-quality-rules", async (req, res) => {
    try {
      const ruleData = insertDataQualityRuleSchema.parse(req.body);
      const rule = await storage.createDataQualityRule(ruleData);
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data quality rule data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create data quality rule" });
    }
  });

  // Data quality results
  app.get("/api/data-quality-results", async (req, res) => {
    try {
      const ruleId = req.query.ruleId ? parseInt(req.query.ruleId as string) : undefined;
      const results = await storage.getDataQualityResults(ruleId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data quality results" });
    }
  });

  // Saved queries
  app.get("/api/saved-queries", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const queries = await storage.getSavedQueries(userId);
      res.json(queries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch saved queries" });
    }
  });

  app.get("/api/saved-queries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const query = await storage.getSavedQuery(id);
      if (!query) {
        return res.status(404).json({ error: "Saved query not found" });
      }
      res.json(query);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch saved query" });
    }
  });

  app.post("/api/saved-queries", async (req, res) => {
    try {
      const queryData = insertSavedQuerySchema.parse(req.body);
      const query = await storage.createSavedQuery(queryData);
      res.status(201).json(query);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid saved query data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create saved query" });
    }
  });

  app.put("/api/saved-queries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertSavedQuerySchema.partial().parse(req.body);
      const query = await storage.updateSavedQuery(id, updateData);
      res.json(query);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid saved query data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update saved query" });
    }
  });

  app.delete("/api/saved-queries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSavedQuery(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete saved query" });
    }
  });

  // Activity logs
  app.get("/api/activity-logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const logs = await storage.getActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  app.post("/api/activity-logs", async (req, res) => {
    try {
      const logData = insertActivityLogSchema.parse(req.body);
      const log = await storage.createActivityLog(logData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid activity log data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create activity log" });
    }
  });

  // Query execution with timeout and error handling
  app.post("/api/query/execute", async (req, res) => {
    const startTime = Date.now();
    const QUERY_TIMEOUT = 30000; // 30 seconds
    
    try {
      const { sql, sourceId } = req.body;
      
      if (!sql || !sourceId) {
        return res.status(400).json({ 
          error: "Missing required parameters",
          message: "SQL query and source ID are required" 
        });
      }

      // Validate SQL to prevent dangerous operations
      const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'UPDATE'];
      const sqlUpper = sql.toUpperCase();
      const containsDangerousKeyword = dangerousKeywords.some(keyword => 
        sqlUpper.includes(keyword)
      );

      if (containsDangerousKeyword) {
        return res.status(403).json({
          error: "Query not allowed",
          message: "Only SELECT queries are permitted for security reasons"
        });
      }

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Query execution timed out after ${QUERY_TIMEOUT / 1000} seconds`));
        }, QUERY_TIMEOUT);
      });

      // Execute query with timeout
      const queryPromise = executeQuerySafely(sql, sourceId);
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      const executionTime = Date.now() - startTime;

      // Log successful query execution (make userId optional for now)
      try {
        await storage.createActivityLog({
          type: 'query_executed',
          description: `Query executed successfully in ${executionTime}ms`,
          entityType: 'query',
          entityId: sourceId
        });
      } catch (logError) {
        console.warn('Failed to log query success:', logError);
      }

      res.json({
        ...result,
        executionTime
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Query execution error:', error);

      // Log failed query execution
      try {
        await storage.createActivityLog({
          type: 'query_failed',
          description: `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          entityType: 'query',
          entityId: req.body.sourceId
        });
      } catch (logError) {
        console.error('Failed to log query error:', logError);
      }

      if (error instanceof Error && error.message.includes('timeout')) {
        return res.status(408).json({
          error: "Query timeout",
          message: error.message,
          code: "QUERY_TIMEOUT"
        });
      }

      res.status(500).json({
        error: "Query execution failed",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        details: error
      });
    }
  });

  // Mock query execution function (replace with real database connection)
  async function executeQuerySafely(sql: string, sourceId: number) {
    // Simulate database connection and query execution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));

    // Mock result structure
    return {
      columns: ["id", "name", "type", "created_at", "status"],
      rows: [
        [1, "Sample Record 1", "Type A", "2025-01-01", "Active"],
        [2, "Sample Record 2", "Type B", "2025-01-02", "Active"],
        [3, "Sample Record 3", "Type A", "2025-01-03", "Inactive"],
        [4, "Sample Record 4", "Type C", "2025-01-04", "Active"],
        [5, "Sample Record 5", "Type B", "2025-01-05", "Active"],
      ],
      rowCount: 5
    };
  }

  // Schema scanning endpoint (simulate database schema scanning)
  app.post("/api/data-sources/:id/scan", async (req, res) => {
    try {
      const sourceId = parseInt(req.params.id);
      const source = await storage.getDataSource(sourceId);
      
      if (!source) {
        return res.status(404).json({ error: "Data source not found" });
      }

      // Update last scan time
      await storage.updateDataSource(sourceId, { 
        lastScanAt: new Date() 
      });

      // Log activity
      await storage.createActivityLog({
        type: "scan",
        description: `Schema scan completed for ${source.name}`,
        entityType: "source",
        entityId: sourceId,
        userId: null,
      });

      res.json({ message: "Schema scan completed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to scan schema" });
    }
  });

  // Test data source connection endpoint
  app.post("/api/data-sources/:id/test", async (req, res) => {
    try {
      const sourceId = parseInt(req.params.id);
      const source = await storage.getDataSource(sourceId);
      
      if (!source) {
        return res.status(404).json({ error: "Data source not found" });
      }

      // Simulate connection test - in real implementation, this would attempt actual connection
      const connectionTest = {
        success: Math.random() > 0.2, // 80% success rate for demo
        latency: Math.floor(Math.random() * 100) + 50, // 50-150ms
        timestamp: new Date(),
        message: Math.random() > 0.2 ? "Connection successful" : "Connection failed - check credentials"
      };

      // Log test result
      await storage.createActivityLog({
        type: "test_connection",
        description: `Connection test for ${source.name}: ${connectionTest.success ? 'Success' : 'Failed'}`,
        entityType: "source",
        entityId: sourceId,
        userId: null,
      });

      res.json(connectionTest);
    } catch (error) {
      res.status(500).json({ error: "Failed to test connection" });
    }
  });

  // Enhanced query execution with performance analysis
  app.post("/api/query/execute", async (req, res) => {
    try {
      const { sql: sqlQuery, sourceId, options = {} } = req.body;
      
      if (!sqlQuery || !sourceId) {
        return res.status(400).json({ error: "SQL query and source ID are required" });
      }

      // Execute query with performance analysis
      const result = await queryPerformanceEngine.executeQueryWithAnalysis(
        sqlQuery, 
        parseInt(sourceId), 
        { analyze: true, explain: options.explain || false }
      );

      if (result.success) {
        res.json({
          columns: result.data?.[0] ? Object.keys(result.data[0]) : [],
          rows: result.data?.map(row => Object.values(row)) || [],
          rowCount: result.data?.length || 0,
          executionTime: result.metrics.executionTime,
          performance: {
            grade: result.performanceGrade,
            metrics: result.metrics,
            suggestions: result.optimizationSuggestions,
            executionPlan: result.executionPlan
          }
        });
      } else {
        res.status(400).json({ 
          error: result.error,
          performance: {
            grade: result.performanceGrade,
            metrics: result.metrics,
            suggestions: result.optimizationSuggestions
          }
        });
      }
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to execute query",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Query performance analytics
  app.get("/api/query/performance-stats", async (req, res) => {
    try {
      const stats = await queryPerformanceEngine.getPerformanceStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch performance stats" });
    }
  });

  // Query execution history
  app.get("/api/query/history/:queryId", async (req, res) => {
    try {
      const queryId = req.params.queryId;
      const history = await queryPerformanceEngine.getQueryHistory(queryId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch query history" });
    }
  });

  // BI Connections endpoints
  app.get("/api/bi-connections", async (_req, res) => {
    try {
      const connections = await storage.getBiConnections();
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch BI connections" });
    }
  });

  app.post("/api/bi-connections", async (req, res) => {
    try {
      const connection = await storage.createBiConnection(req.body);
      res.status(201).json(connection);
    } catch (error) {
      res.status(500).json({ error: "Failed to create BI connection" });
    }
  });

  app.put("/api/bi-connections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const connection = await storage.updateBiConnection(id, req.body);
      res.json(connection);
    } catch (error) {
      res.status(500).json({ error: "Failed to update BI connection" });
    }
  });

  app.delete("/api/bi-connections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBiConnection(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete BI connection" });
    }
  });

  app.post("/api/bi-connections/:id/test", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.testBiConnection(id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to test BI connection" });
    }
  });

  // BI Assets endpoints
  app.get("/api/bi-assets", async (req, res) => {
    try {
      const connectionId = req.query.connectionId ? parseInt(req.query.connectionId as string) : undefined;
      const assets = await storage.getBiAssets(connectionId);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch BI assets" });
    }
  });

  app.post("/api/bi-assets", async (req, res) => {
    try {
      const asset = await storage.createBiAsset(req.body);
      res.status(201).json(asset);
    } catch (error) {
      res.status(500).json({ error: "Failed to create BI asset" });
    }
  });

  app.post("/api/bi-connections/:id/sync", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.syncBiAssets(id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to sync BI assets" });
    }
  });

  // Data Lineage endpoints
  app.get("/api/lineage", async (_req, res) => {
    try {
      const lineages = await storage.getDataLineages();
      res.json(lineages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lineages" });
    }
  });

  app.post("/api/lineage", async (req, res) => {
    try {
      const lineage = await storage.createDataLineage(req.body);
      res.status(201).json(lineage);
    } catch (error) {
      res.status(500).json({ error: "Failed to create lineage" });
    }
  });

  app.get("/api/lineage/graph", async (req, res) => {
    try {
      const tableId = req.query.tableId ? parseInt(req.query.tableId as string) : undefined;
      const assetId = req.query.assetId ? parseInt(req.query.assetId as string) : undefined;
      const graph = await storage.getLineageGraph(tableId, assetId);
      res.json(graph);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lineage graph" });
    }
  });

  // BI Lineage Mapping endpoints
  app.get("/api/bi-lineage-mappings", async (req, res) => {
    try {
      const assetId = req.query.assetId ? parseInt(req.query.assetId as string) : undefined;
      const mappings = await storage.getBiLineageMappings(assetId);
      res.json(mappings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch BI lineage mappings" });
    }
  });

  app.post("/api/bi-lineage-mappings", async (req, res) => {
    try {
      const mapping = await storage.createBiLineageMapping(req.body);
      res.status(201).json(mapping);
    } catch (error) {
      res.status(500).json({ error: "Failed to create BI lineage mapping" });
    }
  });

  // Advanced Search Endpoints
  app.post("/api/search", async (req, res) => {
    try {
      const { filters, limit = 50, offset = 0 } = req.body;
      const result = await advancedSearchEngine.searchTables(filters, limit, offset);
      res.json(result);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.get("/api/search/suggestions", async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!query) {
        return res.json([]);
      }
      
      const suggestions = await advancedSearchEngine.getSuggestions(query, limit);
      res.json(suggestions);
    } catch (error) {
      console.error('Suggestions error:', error);
      res.status(500).json({ error: "Failed to get suggestions" });
    }
  });

  app.get("/api/search/popular", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const popular = await advancedSearchEngine.getPopularSearches(limit);
      res.json(popular);
    } catch (error) {
      console.error('Popular searches error:', error);
      res.status(500).json({ error: "Failed to get popular searches" });
    }
  });

  app.post("/api/search/index/:tableId", async (req, res) => {
    try {
      const tableId = parseInt(req.params.tableId);
      await advancedSearchEngine.indexTable(tableId);
      res.json({ success: true });
    } catch (error) {
      console.error('Index error:', error);
      res.status(500).json({ error: "Failed to index table" });
    }
  });

  // System Health and Production Optimization Endpoints
  app.get("/api/system/health", async (req, res) => {
    try {
      const health = await systemHealthMonitor.getSystemHealth();
      res.json(health);
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({ error: "Failed to get system health" });
    }
  });

  app.get("/api/system/health/report", async (req, res) => {
    try {
      const report = await systemHealthMonitor.generateHealthReport();
      res.setHeader('Content-Type', 'text/plain');
      res.send(report);
    } catch (error) {
      console.error('Health report error:', error);
      res.status(500).json({ error: "Failed to generate health report" });
    }
  });

  app.get("/api/system/alerts", async (req, res) => {
    try {
      const alerts = systemHealthMonitor.getAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('Alerts error:', error);
      res.status(500).json({ error: "Failed to get alerts" });
    }
  });

  app.get("/api/system/performance", async (req, res) => {
    try {
      const cacheStats = optimizer.getCacheStats();
      const rateLimitStats = optimizer.getRateLimitStats();
      
      res.json({
        cache: cacheStats,
        rateLimit: rateLimitStats,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      });
    } catch (error) {
      console.error('Performance stats error:', error);
      res.status(500).json({ error: "Failed to get performance stats" });
    }
  });

  app.post("/api/system/cache/clear", async (req, res) => {
    try {
      const pattern = req.body.pattern;
      if (pattern) {
        optimizer.invalidateCachePattern(pattern);
        res.json({ success: true, message: `Cleared cache entries matching: ${pattern}` });
      } else {
        optimizer.clearCache();
        res.json({ success: true, message: "Cleared all cache entries" });
      }
    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({ error: "Failed to clear cache" });
    }
  });

  // Apply production optimization middleware
  app.use(optimizer.performanceMiddleware());
  app.use(optimizer.securityHeadersMiddleware());
  app.use(optimizer.optimizeResponse());
  app.use(optimizer.errorHandlingMiddleware());

  // Start background optimization tasks
  optimizer.startBackgroundTasks();

  const httpServer = createServer(app);
  return httpServer;
}
