import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const dataSources = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'snowflake', 'postgresql', 'sqlserver', 'mysql'
  connectionString: text("connection_string").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastScanAt: timestamp("last_scan_at"),
});

export const dataTables = pgTable("data_tables", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => dataSources.id),
  name: text("name").notNull(),
  schema: text("schema"),
  fullName: text("full_name").notNull(), // schema.table_name
  recordCount: integer("record_count").default(0),
  fieldCount: integer("field_count").default(0),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  lastScanAt: timestamp("last_scan_at"),
});

export const dataFields = pgTable("data_fields", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").references(() => dataTables.id),
  name: text("name").notNull(),
  dataType: text("data_type").notNull(),
  isNullable: boolean("is_nullable").default(true),
  isPrimaryKey: boolean("is_primary_key").default(false),
  isForeignKey: boolean("is_foreign_key").default(false),
  uniqueCount: integer("unique_count"),
  nullCount: integer("null_count"),
  sampleValue: text("sample_value"),
});

export const dataQualityRules = pgTable("data_quality_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tableId: integer("table_id").references(() => dataTables.id),
  fieldId: integer("field_id").references(() => dataFields.id),
  ruleType: text("rule_type").notNull(), // 'non_null', 'format', 'range', 'uniqueness'
  ruleConfig: jsonb("rule_config").$type<Record<string, any>>().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  owner: text("owner"),
});

export const dataQualityResults = pgTable("data_quality_results", {
  id: serial("id").primaryKey(),
  ruleId: integer("rule_id").references(() => dataQualityRules.id),
  passed: boolean("passed").notNull(),
  violationCount: integer("violation_count").default(0),
  totalCount: integer("total_count").default(0),
  score: decimal("score", { precision: 5, scale: 2 }),
  details: jsonb("details").$type<Record<string, any>>(),
  runAt: timestamp("run_at").defaultNow(),
});

export const savedQueries = pgTable("saved_queries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sqlContent: text("sql_content").notNull(),
  sourceId: integer("source_id").references(() => dataSources.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isFavorite: boolean("is_favorite").default(false),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'scan', 'rule_created', 'query_executed', 'issue_detected'
  description: text("description").notNull(),
  entityType: text("entity_type"), // 'source', 'table', 'rule', 'query'
  entityId: integer("entity_id"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Data Lineage Tables
export const dataLineage = pgTable("data_lineage", {
  id: serial("id").primaryKey(),
  sourceTableId: integer("source_table_id").notNull(),
  targetTableId: integer("target_table_id").notNull(),
  transformationType: text("transformation_type").notNull(), // 'direct', 'aggregation', 'join', 'calculation'
  transformationQuery: text("transformation_query"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("1.0"), // 0-1 confidence score
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fieldLineage = pgTable("field_lineage", {
  id: serial("id").primaryKey(),
  sourceFieldId: integer("source_field_id").notNull(),
  targetFieldId: integer("target_field_id").notNull(),
  lineageId: integer("lineage_id").notNull(),
  transformationLogic: text("transformation_logic"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// BI Integration Tables
export const biConnections = pgTable("bi_connections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'powerbi', 'tableau', 'looker', 'qlik'
  connectionString: text("connection_string").notNull(),
  workspaceId: text("workspace_id"),
  apiKey: text("api_key"),
  refreshToken: text("refresh_token"),
  isActive: boolean("is_active").default(true),
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const biAssets = pgTable("bi_assets", {
  id: serial("id").primaryKey(),
  biConnectionId: integer("bi_connection_id").notNull(),
  assetId: text("asset_id").notNull(), // BI tool's internal ID
  name: text("name").notNull(),
  type: text("type").notNull(), // 'report', 'dashboard', 'dataset', 'dataflow'
  description: text("description"),
  createdBy: text("created_by"),
  lastModified: timestamp("last_modified"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const biLineageMapping = pgTable("bi_lineage_mapping", {
  id: serial("id").primaryKey(),
  biAssetId: integer("bi_asset_id").notNull(),
  dataTableId: integer("data_table_id"),
  dataFieldId: integer("data_field_id"),
  mappingType: text("mapping_type").notNull(), // 'source', 'target', 'reference'
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }).default("0.8"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const dataSourcesRelations = relations(dataSources, ({ many }) => ({
  tables: many(dataTables),
  queries: many(savedQueries),
}));

export const dataTablesRelations = relations(dataTables, ({ one, many }) => ({
  source: one(dataSources, {
    fields: [dataTables.sourceId],
    references: [dataSources.id],
  }),
  fields: many(dataFields),
  qualityRules: many(dataQualityRules),
}));

export const dataFieldsRelations = relations(dataFields, ({ one, many }) => ({
  table: one(dataTables, {
    fields: [dataFields.tableId],
    references: [dataTables.id],
  }),
  qualityRules: many(dataQualityRules),
}));

export const dataQualityRulesRelations = relations(dataQualityRules, ({ one, many }) => ({
  table: one(dataTables, {
    fields: [dataQualityRules.tableId],
    references: [dataTables.id],
  }),
  field: one(dataFields, {
    fields: [dataQualityRules.fieldId],
    references: [dataFields.id],
  }),
  results: many(dataQualityResults),
}));

export const dataQualityResultsRelations = relations(dataQualityResults, ({ one }) => ({
  rule: one(dataQualityRules, {
    fields: [dataQualityResults.ruleId],
    references: [dataQualityRules.id],
  }),
}));

export const savedQueriesRelations = relations(savedQueries, ({ one }) => ({
  source: one(dataSources, {
    fields: [savedQueries.sourceId],
    references: [dataSources.id],
  }),
  creator: one(users, {
    fields: [savedQueries.createdBy],
    references: [users.id],
  }),
}));

// Lineage Relations
export const dataLineageRelations = relations(dataLineage, ({ one, many }) => ({
  sourceTable: one(dataTables, {
    fields: [dataLineage.sourceTableId],
    references: [dataTables.id],
  }),
  targetTable: one(dataTables, {
    fields: [dataLineage.targetTableId],
    references: [dataTables.id],
  }),
  fieldLineages: many(fieldLineage),
}));

export const fieldLineageRelations = relations(fieldLineage, ({ one }) => ({
  sourceField: one(dataFields, {
    fields: [fieldLineage.sourceFieldId],
    references: [dataFields.id],
  }),
  targetField: one(dataFields, {
    fields: [fieldLineage.targetFieldId],
    references: [dataFields.id],
  }),
  lineage: one(dataLineage, {
    fields: [fieldLineage.lineageId],
    references: [dataLineage.id],
  }),
}));

// BI Integration Relations
export const biConnectionsRelations = relations(biConnections, ({ many }) => ({
  assets: many(biAssets),
}));

export const biAssetsRelations = relations(biAssets, ({ one, many }) => ({
  connection: one(biConnections, {
    fields: [biAssets.biConnectionId],
    references: [biConnections.id],
  }),
  lineageMappings: many(biLineageMapping),
}));

export const biLineageMappingRelations = relations(biLineageMapping, ({ one }) => ({
  biAsset: one(biAssets, {
    fields: [biLineageMapping.biAssetId],
    references: [biAssets.id],
  }),
  dataTable: one(dataTables, {
    fields: [biLineageMapping.dataTableId],
    references: [dataTables.id],
  }),
  dataField: one(dataFields, {
    fields: [biLineageMapping.dataFieldId],
    references: [dataFields.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertDataSourceSchema = createInsertSchema(dataSources).omit({
  id: true,
  createdAt: true,
  lastScanAt: true,
});

export const insertDataTableSchema = createInsertSchema(dataTables).omit({
  id: true,
  createdAt: true,
  lastScanAt: true,
});

export const insertDataFieldSchema = createInsertSchema(dataFields).omit({
  id: true,
});

export const insertDataQualityRuleSchema = createInsertSchema(dataQualityRules).omit({
  id: true,
  createdAt: true,
});

export const insertDataQualityResultSchema = createInsertSchema(dataQualityResults).omit({
  id: true,
  runAt: true,
});

export const insertSavedQuerySchema = createInsertSchema(savedQueries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;
export type DataSource = typeof dataSources.$inferSelect;

export type InsertDataTable = z.infer<typeof insertDataTableSchema>;
export type DataTable = typeof dataTables.$inferSelect;

export type InsertDataField = z.infer<typeof insertDataFieldSchema>;
export type DataField = typeof dataFields.$inferSelect;

export type InsertDataQualityRule = z.infer<typeof insertDataQualityRuleSchema>;
export type DataQualityRule = typeof dataQualityRules.$inferSelect;

export type InsertDataQualityResult = z.infer<typeof insertDataQualityResultSchema>;
export type DataQualityResult = typeof dataQualityResults.$inferSelect;

export type InsertSavedQuery = z.infer<typeof insertSavedQuerySchema>;
export type SavedQuery = typeof savedQueries.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Lineage schemas and types
export const insertDataLineageSchema = createInsertSchema(dataLineage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFieldLineageSchema = createInsertSchema(fieldLineage).omit({
  id: true,
  createdAt: true,
});

export const insertBiConnectionSchema = createInsertSchema(biConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSync: true,
});

export const insertBiAssetSchema = createInsertSchema(biAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBiLineageMappingSchema = createInsertSchema(biLineageMapping).omit({
  id: true,
  createdAt: true,
});

export type InsertDataLineage = z.infer<typeof insertDataLineageSchema>;
export type DataLineage = typeof dataLineage.$inferSelect;

export type InsertFieldLineage = z.infer<typeof insertFieldLineageSchema>;
export type FieldLineage = typeof fieldLineage.$inferSelect;

export type InsertBiConnection = z.infer<typeof insertBiConnectionSchema>;
export type BiConnection = typeof biConnections.$inferSelect;

export type InsertBiAsset = z.infer<typeof insertBiAssetSchema>;
export type BiAsset = typeof biAssets.$inferSelect;

export type InsertBiLineageMapping = z.infer<typeof insertBiLineageMappingSchema>;
export type BiLineageMapping = typeof biLineageMapping.$inferSelect;
