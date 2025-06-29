import { 
  users, dataSources, dataTables, dataFields, dataQualityRules, 
  dataQualityResults, savedQueries, activityLogs, dataLineage, fieldLineage,
  biConnections, biAssets, biLineageMapping,
  type User, type InsertUser, type DataSource, type InsertDataSource,
  type DataTable, type InsertDataTable, type DataField, type InsertDataField,
  type DataQualityRule, type InsertDataQualityRule, type DataQualityResult,
  type InsertDataQualityResult, type SavedQuery, type InsertSavedQuery,
  type ActivityLog, type InsertActivityLog, type DataLineage, type InsertDataLineage,
  type FieldLineage, type InsertFieldLineage, type BiConnection, type InsertBiConnection,
  type BiAsset, type InsertBiAsset, type BiLineageMapping, type InsertBiLineageMapping
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Data sources
  getDataSources(): Promise<DataSource[]>;
  getDataSource(id: number): Promise<DataSource | undefined>;
  createDataSource(source: InsertDataSource): Promise<DataSource>;
  updateDataSource(id: number, updates: Partial<InsertDataSource>): Promise<DataSource>;

  // Data tables
  getDataTables(sourceId?: number): Promise<DataTable[]>;
  getDataTable(id: number): Promise<DataTable | undefined>;
  createDataTable(table: InsertDataTable): Promise<DataTable>;
  updateDataTable(id: number, updates: Partial<InsertDataTable>): Promise<DataTable>;

  // Data fields
  getDataFields(tableId: number): Promise<DataField[]>;
  createDataField(field: InsertDataField): Promise<DataField>;

  // Data quality rules
  getDataQualityRules(tableId?: number): Promise<DataQualityRule[]>;
  getDataQualityRule(id: number): Promise<DataQualityRule | undefined>;
  createDataQualityRule(rule: InsertDataQualityRule): Promise<DataQualityRule>;
  updateDataQualityRule(id: number, updates: Partial<InsertDataQualityRule>): Promise<DataQualityRule>;

  // Data quality results
  getDataQualityResults(ruleId?: number): Promise<DataQualityResult[]>;
  createDataQualityResult(result: InsertDataQualityResult): Promise<DataQualityResult>;

  // Saved queries
  getSavedQueries(userId?: number): Promise<SavedQuery[]>;
  getSavedQuery(id: number): Promise<SavedQuery | undefined>;
  createSavedQuery(query: InsertSavedQuery): Promise<SavedQuery>;
  updateSavedQuery(id: number, updates: Partial<InsertSavedQuery>): Promise<SavedQuery>;
  deleteSavedQuery(id: number): Promise<void>;

  // Activity logs
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    totalSources: number;
    totalTables: number;
    totalRules: number;
    avgQualityScore: number;
    lastScanTime: Date | null;
  }>;

  // Data Lineage
  getDataLineages(): Promise<DataLineage[]>;
  getDataLineage(id: number): Promise<DataLineage | undefined>;
  createDataLineage(lineage: InsertDataLineage): Promise<DataLineage>;
  updateDataLineage(id: number, updates: Partial<InsertDataLineage>): Promise<DataLineage>;
  deleteDataLineage(id: number): Promise<void>;

  // Field Lineage
  getFieldLineages(lineageId?: number): Promise<FieldLineage[]>;
  createFieldLineage(lineage: InsertFieldLineage): Promise<FieldLineage>;

  // BI Connections
  getBiConnections(): Promise<BiConnection[]>;
  getBiConnection(id: number): Promise<BiConnection | undefined>;
  createBiConnection(connection: InsertBiConnection): Promise<BiConnection>;
  updateBiConnection(id: number, updates: Partial<InsertBiConnection>): Promise<BiConnection>;
  deleteBiConnection(id: number): Promise<void>;
  testBiConnection(id: number): Promise<{ success: boolean; message: string }>;

  // BI Assets
  getBiAssets(connectionId?: number): Promise<BiAsset[]>;
  getBiAsset(id: number): Promise<BiAsset | undefined>;
  createBiAsset(asset: InsertBiAsset): Promise<BiAsset>;
  updateBiAsset(id: number, updates: Partial<InsertBiAsset>): Promise<BiAsset>;
  deleteBiAsset(id: number): Promise<void>;
  syncBiAssets(connectionId: number): Promise<{ synced: number; errors: string[] }>;

  // BI Lineage Mapping
  getBiLineageMappings(assetId?: number): Promise<BiLineageMapping[]>;
  createBiLineageMapping(mapping: InsertBiLineageMapping): Promise<BiLineageMapping>;
  deleteBiLineageMapping(id: number): Promise<void>;
  getLineageGraph(tableId?: number, assetId?: number): Promise<{
    nodes: Array<{ id: string; type: string; label: string; metadata: any }>;
    edges: Array<{ source: string; target: string; type: string; confidence: number }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getDataSources(): Promise<DataSource[]> {
    return await db.select().from(dataSources).orderBy(desc(dataSources.createdAt));
  }

  async getDataSource(id: number): Promise<DataSource | undefined> {
    const [source] = await db.select().from(dataSources).where(eq(dataSources.id, id));
    return source || undefined;
  }

  async createDataSource(source: InsertDataSource): Promise<DataSource> {
    const [newSource] = await db
      .insert(dataSources)
      .values(source)
      .returning();
    return newSource;
  }

  async updateDataSource(id: number, updates: Partial<InsertDataSource>): Promise<DataSource> {
    const [updated] = await db
      .update(dataSources)
      .set(updates)
      .where(eq(dataSources.id, id))
      .returning();
    return updated;
  }

  async getDataTables(sourceId?: number): Promise<DataTable[]> {
    if (sourceId) {
      return await db.select().from(dataTables)
        .where(eq(dataTables.sourceId, sourceId))
        .orderBy(desc(dataTables.lastScanAt));
    }
    return await db.select().from(dataTables).orderBy(desc(dataTables.lastScanAt));
  }

  async getDataTable(id: number): Promise<DataTable | undefined> {
    const [table] = await db.select().from(dataTables).where(eq(dataTables.id, id));
    return table || undefined;
  }

  async createDataTable(table: InsertDataTable): Promise<DataTable> {
    const [newTable] = await db
      .insert(dataTables)
      .values(table)
      .returning();
    return newTable;
  }

  async updateDataTable(id: number, updates: Partial<InsertDataTable>): Promise<DataTable> {
    const [updated] = await db
      .update(dataTables)
      .set(updates)
      .where(eq(dataTables.id, id))
      .returning();
    return updated;
  }

  async getDataFields(tableId: number): Promise<DataField[]> {
    return await db.select().from(dataFields)
      .where(eq(dataFields.tableId, tableId))
      .orderBy(dataFields.name);
  }

  async createDataField(field: InsertDataField): Promise<DataField> {
    const [newField] = await db
      .insert(dataFields)
      .values(field)
      .returning();
    return newField;
  }

  async getDataQualityRules(tableId?: number): Promise<DataQualityRule[]> {
    if (tableId) {
      return await db.select().from(dataQualityRules)
        .where(eq(dataQualityRules.tableId, tableId))
        .orderBy(desc(dataQualityRules.createdAt));
    }
    return await db.select().from(dataQualityRules).orderBy(desc(dataQualityRules.createdAt));
  }

  async getDataQualityRule(id: number): Promise<DataQualityRule | undefined> {
    const [rule] = await db.select().from(dataQualityRules).where(eq(dataQualityRules.id, id));
    return rule || undefined;
  }

  async createDataQualityRule(rule: InsertDataQualityRule): Promise<DataQualityRule> {
    const [newRule] = await db
      .insert(dataQualityRules)
      .values(rule)
      .returning();
    return newRule;
  }

  async updateDataQualityRule(id: number, updates: Partial<InsertDataQualityRule>): Promise<DataQualityRule> {
    const [updated] = await db
      .update(dataQualityRules)
      .set(updates)
      .where(eq(dataQualityRules.id, id))
      .returning();
    return updated;
  }

  async getDataQualityResults(ruleId?: number): Promise<DataQualityResult[]> {
    if (ruleId) {
      return await db.select().from(dataQualityResults)
        .where(eq(dataQualityResults.ruleId, ruleId))
        .orderBy(desc(dataQualityResults.runAt));
    }
    return await db.select().from(dataQualityResults).orderBy(desc(dataQualityResults.runAt));
  }

  async createDataQualityResult(result: InsertDataQualityResult): Promise<DataQualityResult> {
    const [newResult] = await db
      .insert(dataQualityResults)
      .values(result)
      .returning();
    return newResult;
  }

  async getSavedQueries(userId?: number): Promise<SavedQuery[]> {
    if (userId) {
      return await db.select().from(savedQueries)
        .where(eq(savedQueries.createdBy, userId))
        .orderBy(desc(savedQueries.updatedAt));
    }
    return await db.select().from(savedQueries).orderBy(desc(savedQueries.updatedAt));
  }

  async getSavedQuery(id: number): Promise<SavedQuery | undefined> {
    const [query] = await db.select().from(savedQueries).where(eq(savedQueries.id, id));
    return query || undefined;
  }

  async createSavedQuery(query: InsertSavedQuery): Promise<SavedQuery> {
    const [newQuery] = await db
      .insert(savedQueries)
      .values(query)
      .returning();
    return newQuery;
  }

  async updateSavedQuery(id: number, updates: Partial<InsertSavedQuery>): Promise<SavedQuery> {
    const [updated] = await db
      .update(savedQueries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(savedQueries.id, id))
      .returning();
    return updated;
  }

  async deleteSavedQuery(id: number): Promise<void> {
    await db.delete(savedQueries).where(eq(savedQueries.id, id));
  }

  async getActivityLogs(limit: number = 20): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db
      .insert(activityLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getDashboardMetrics() {
    const [sourcesCount] = await db.select({ count: sql<number>`count(*)` }).from(dataSources);
    const [tablesCount] = await db.select({ count: sql<number>`count(*)` }).from(dataTables);
    const [rulesCount] = await db.select({ count: sql<number>`count(*)` }).from(dataQualityRules);
    
    const [avgScore] = await db.select({ 
      avg: sql<number>`COALESCE(AVG(${dataQualityResults.score}), 0)` 
    }).from(dataQualityResults);
    
    const [lastScan] = await db.select({ 
      lastScanAt: sql<Date>`MAX(${dataSources.lastScanAt})` 
    }).from(dataSources);

    return {
      totalSources: sourcesCount.count,
      totalTables: tablesCount.count,
      totalRules: rulesCount.count,
      avgQualityScore: Number(avgScore.avg) || 0,
      lastScanTime: lastScan.lastScanAt,
    };
  }

  // Data Lineage Implementation
  async getDataLineages(): Promise<DataLineage[]> {
    return await db.select().from(dataLineage).orderBy(desc(dataLineage.createdAt));
  }

  async getDataLineage(id: number): Promise<DataLineage | undefined> {
    const [lineage] = await db.select().from(dataLineage).where(eq(dataLineage.id, id));
    return lineage || undefined;
  }

  async createDataLineage(lineageData: InsertDataLineage): Promise<DataLineage> {
    const [lineage] = await db.insert(dataLineage).values(lineageData).returning();
    return lineage;
  }

  async updateDataLineage(id: number, updates: Partial<InsertDataLineage>): Promise<DataLineage> {
    const [lineage] = await db.update(dataLineage).set(updates).where(eq(dataLineage.id, id)).returning();
    return lineage;
  }

  async deleteDataLineage(id: number): Promise<void> {
    await db.delete(dataLineage).where(eq(dataLineage.id, id));
  }

  // Field Lineage Implementation
  async getFieldLineages(lineageId?: number): Promise<FieldLineage[]> {
    if (lineageId) {
      return await db.select().from(fieldLineage).where(eq(fieldLineage.lineageId, lineageId));
    }
    return await db.select().from(fieldLineage).orderBy(desc(fieldLineage.createdAt));
  }

  async createFieldLineage(lineageData: InsertFieldLineage): Promise<FieldLineage> {
    const [lineage] = await db.insert(fieldLineage).values(lineageData).returning();
    return lineage;
  }

  // BI Connections Implementation
  async getBiConnections(): Promise<BiConnection[]> {
    return await db.select().from(biConnections).orderBy(desc(biConnections.createdAt));
  }

  async getBiConnection(id: number): Promise<BiConnection | undefined> {
    const [connection] = await db.select().from(biConnections).where(eq(biConnections.id, id));
    return connection || undefined;
  }

  async createBiConnection(connectionData: InsertBiConnection): Promise<BiConnection> {
    const [connection] = await db.insert(biConnections).values(connectionData).returning();
    return connection;
  }

  async updateBiConnection(id: number, updates: Partial<InsertBiConnection>): Promise<BiConnection> {
    const [connection] = await db.update(biConnections).set(updates).where(eq(biConnections.id, id)).returning();
    return connection;
  }

  async deleteBiConnection(id: number): Promise<void> {
    await db.delete(biConnections).where(eq(biConnections.id, id));
  }

  async testBiConnection(id: number): Promise<{ success: boolean; message: string }> {
    const connection = await this.getBiConnection(id);
    if (!connection) {
      return { success: false, message: "Connection not found" };
    }
    
    // Simulate connection test - in real implementation, would test actual BI tool APIs
    return { success: true, message: `Successfully connected to ${connection.type} workspace` };
  }

  // BI Assets Implementation
  async getBiAssets(connectionId?: number): Promise<BiAsset[]> {
    if (connectionId) {
      return await db.select().from(biAssets).where(eq(biAssets.biConnectionId, connectionId));
    }
    return await db.select().from(biAssets).orderBy(desc(biAssets.createdAt));
  }

  async getBiAsset(id: number): Promise<BiAsset | undefined> {
    const [asset] = await db.select().from(biAssets).where(eq(biAssets.id, id));
    return asset || undefined;
  }

  async createBiAsset(assetData: InsertBiAsset): Promise<BiAsset> {
    const [asset] = await db.insert(biAssets).values(assetData).returning();
    return asset;
  }

  async updateBiAsset(id: number, updates: Partial<InsertBiAsset>): Promise<BiAsset> {
    const [asset] = await db.update(biAssets).set(updates).where(eq(biAssets.id, id)).returning();
    return asset;
  }

  async deleteBiAsset(id: number): Promise<void> {
    await db.delete(biAssets).where(eq(biAssets.id, id));
  }

  async syncBiAssets(connectionId: number): Promise<{ synced: number; errors: string[] }> {
    // Simulate asset sync - in real implementation, would call BI tool APIs
    const connection = await this.getBiConnection(connectionId);
    if (!connection) {
      return { synced: 0, errors: ["Connection not found"] };
    }
    
    // Mock sync results
    return { synced: 5, errors: [] };
  }

  // BI Lineage Mapping Implementation
  async getBiLineageMappings(assetId?: number): Promise<BiLineageMapping[]> {
    if (assetId) {
      return await db.select().from(biLineageMapping).where(eq(biLineageMapping.biAssetId, assetId));
    }
    return await db.select().from(biLineageMapping).orderBy(desc(biLineageMapping.createdAt));
  }

  async createBiLineageMapping(mappingData: InsertBiLineageMapping): Promise<BiLineageMapping> {
    const [mapping] = await db.insert(biLineageMapping).values(mappingData).returning();
    return mapping;
  }

  async deleteBiLineageMapping(id: number): Promise<void> {
    await db.delete(biLineageMapping).where(eq(biLineageMapping.id, id));
  }

  async getLineageGraph(tableId?: number, assetId?: number): Promise<{
    nodes: Array<{ id: string; type: string; label: string; metadata: any }>;
    edges: Array<{ source: string; target: string; type: string; confidence: number }>;
  }> {
    const nodes: Array<{ id: string; type: string; label: string; metadata: any }> = [];
    const edges: Array<{ source: string; target: string; type: string; confidence: number }> = [];
    
    // Get all data tables and their lineages
    const tables = await db.select().from(dataTables);
    const lineages = await db.select().from(dataLineage);
    const biMappings = await db.select().from(biLineageMapping);
    const assets = await db.select().from(biAssets);
    
    // Add table nodes
    tables.forEach(table => {
      nodes.push({
        id: `table_${table.id}`,
        type: 'table',
        label: table.name,
        metadata: { sourceId: table.sourceId, recordCount: table.recordCount }
      });
    });
    
    // Add BI asset nodes
    assets.forEach(asset => {
      nodes.push({
        id: `asset_${asset.id}`,
        type: asset.type,
        label: asset.name,
        metadata: { connectionId: asset.biConnectionId, assetId: asset.assetId }
      });
    });
    
    // Add lineage edges
    lineages.forEach(lineage => {
      edges.push({
        source: `table_${lineage.sourceTableId}`,
        target: `table_${lineage.targetTableId}`,
        type: lineage.transformationType,
        confidence: Number(lineage.confidence) || 1.0
      });
    });
    
    // Add BI mapping edges
    biMappings.forEach(mapping => {
      if (mapping.dataTableId) {
        edges.push({
          source: `table_${mapping.dataTableId}`,
          target: `asset_${mapping.biAssetId}`,
          type: mapping.mappingType,
          confidence: Number(mapping.confidenceScore) || 0.8
        });
      }
    });
    
    return { nodes, edges };
  }
}

export const storage = new DatabaseStorage();
