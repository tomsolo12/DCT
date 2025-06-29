import { db } from "./db";
import { dataSources, dataTables, dataFields } from "@shared/schema";
import { eq } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";

export interface SchemaInfo {
  tables: TableInfo[];
  error?: string;
}

export interface TableInfo {
  name: string;
  schema: string;
  fullName: string;
  rowCount?: number;
  fields: FieldInfo[];
  description?: string;
}

export interface FieldInfo {
  name: string;
  dataType: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  maxLength?: number;
  defaultValue?: string;
  description?: string;
}

export class SchemaDiscoveryService {
  
  async discoverSchema(sourceId: number): Promise<SchemaInfo> {
    try {
      // Get data source info
      const [source] = await db
        .select()
        .from(dataSources)
        .where(eq(dataSources.id, sourceId));
      
      if (!source) {
        throw new Error(`Data source ${sourceId} not found`);
      }

      console.log(`Starting schema discovery for source: ${source.name} (${source.type})`);
      
      let schemaInfo: SchemaInfo;
      
      switch (source.type.toLowerCase()) {
        case 'postgresql':
          schemaInfo = await this.discoverPostgreSQLSchema(source.connectionString);
          break;
        case 'mysql':
          schemaInfo = await this.discoverMySQLSchema(source.connectionString);
          break;
        case 'sqlserver':
          schemaInfo = await this.discoverSQLServerSchema(source.connectionString);
          break;
        case 'snowflake':
          schemaInfo = await this.discoverSnowflakeSchema(source.connectionString);
          break;
        default:
          schemaInfo = { 
            tables: [], 
            error: `Schema discovery not implemented for ${source.type}` 
          };
      }

      // Store discovered schema in database
      if (schemaInfo.tables.length > 0) {
        await this.storeDiscoveredSchema(sourceId, schemaInfo.tables);
        
        // Update source scan timestamp
        await db
          .update(dataSources)
          .set({ lastScanAt: new Date() })
          .where(eq(dataSources.id, sourceId));
      }

      console.log(`Schema discovery completed for source ${sourceId}: ${schemaInfo.tables.length} tables found`);
      return schemaInfo;

    } catch (error) {
      console.error(`Schema discovery failed for source ${sourceId}:`, error);
      return {
        tables: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async discoverPostgreSQLSchema(connectionString: string): Promise<SchemaInfo> {
    const pool = new Pool({ connectionString });
    
    try {
      // Get all tables with their schemas
      const tablesQuery = `
        SELECT 
          t.table_schema as schema_name,
          t.table_name,
          COALESCE(pg_stat_user_tables.n_tup_ins + pg_stat_user_tables.n_tup_upd + pg_stat_user_tables.n_tup_del, 0) as row_count,
          obj_description(c.oid) as table_comment
        FROM information_schema.tables t
        LEFT JOIN pg_class c ON c.relname = t.table_name
        LEFT JOIN pg_stat_user_tables ON pg_stat_user_tables.relname = t.table_name
        WHERE t.table_type = 'BASE TABLE'
          AND t.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY t.table_schema, t.table_name;
      `;

      const tablesResult = await pool.query(tablesQuery);
      const tables: TableInfo[] = [];

      for (const tableRow of tablesResult.rows) {
        // Get column information for each table
        const columnsQuery = `
          SELECT 
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            c.character_maximum_length,
            CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
            CASE WHEN uq.column_name IS NOT NULL THEN true ELSE false END as is_unique,
            col_description(pgc.oid, c.ordinal_position) as column_comment
          FROM information_schema.columns c
          LEFT JOIN pg_class pgc ON pgc.relname = c.table_name
          LEFT JOIN (
            SELECT ku.table_name, ku.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
          ) pk ON pk.table_name = c.table_name AND pk.column_name = c.column_name
          LEFT JOIN (
            SELECT ku.table_name, ku.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
            WHERE tc.constraint_type = 'UNIQUE'
          ) uq ON uq.table_name = c.table_name AND uq.column_name = c.column_name
          WHERE c.table_name = $1 AND c.table_schema = $2
          ORDER BY c.ordinal_position;
        `;

        const columnsResult = await pool.query(columnsQuery, [tableRow.table_name, tableRow.schema_name]);
        
        const fields: FieldInfo[] = columnsResult.rows.map(col => ({
          name: col.column_name,
          dataType: col.data_type,
          nullable: col.is_nullable === 'YES',
          isPrimaryKey: col.is_primary_key,
          isUnique: col.is_unique,
          maxLength: col.character_maximum_length,
          defaultValue: col.column_default,
          description: col.column_comment
        }));

        tables.push({
          name: tableRow.table_name,
          schema: tableRow.schema_name,
          fullName: `${tableRow.schema_name}.${tableRow.table_name}`,
          rowCount: parseInt(tableRow.row_count) || 0,
          fields,
          description: tableRow.table_comment
        });
      }

      return { tables };

    } finally {
      await pool.end();
    }
  }

  private async discoverMySQLSchema(connectionString: string): Promise<SchemaInfo> {
    // MySQL schema discovery implementation
    return {
      tables: [],
      error: "MySQL schema discovery not yet implemented"
    };
  }

  private async discoverSQLServerSchema(connectionString: string): Promise<SchemaInfo> {
    // SQL Server schema discovery implementation
    return {
      tables: [],
      error: "SQL Server schema discovery not yet implemented"
    };
  }

  private async discoverSnowflakeSchema(connectionString: string): Promise<SchemaInfo> {
    // Snowflake schema discovery implementation
    return {
      tables: [],
      error: "Snowflake schema discovery not yet implemented"
    };
  }

  private async storeDiscoveredSchema(sourceId: number, tables: TableInfo[]): Promise<void> {
    // Remove existing tables and fields for this source
    const existingTables = await db
      .select({ id: dataTables.id })
      .from(dataTables)
      .where(eq(dataTables.sourceId, sourceId));
    
    for (const table of existingTables) {
      await db.delete(dataFields).where(eq(dataFields.tableId, table.id));
    }
    
    await db.delete(dataTables).where(eq(dataTables.sourceId, sourceId));

    // Insert discovered tables and fields
    for (const tableInfo of tables) {
      const [insertedTable] = await db
        .insert(dataTables)
        .values({
          sourceId,
          name: tableInfo.name,
          schema: tableInfo.schema,
          fullName: tableInfo.fullName,
          recordCount: tableInfo.rowCount || 0,
          fieldCount: tableInfo.fields.length
        })
        .returning();

      // Insert fields for this table
      if (tableInfo.fields.length > 0) {
        await db.insert(dataFields).values(
          tableInfo.fields.map(field => ({
            tableId: insertedTable.id,
            name: field.name,
            dataType: field.dataType,
            isNullable: field.nullable,
            isPrimaryKey: field.isPrimaryKey
          }))
        );
      }
    }
  }

  async scanAllSources(): Promise<{ scanned: number; errors: string[] }> {
    const sources = await db.select().from(dataSources).where(eq(dataSources.isActive, true));
    const errors: string[] = [];
    let scanned = 0;

    for (const source of sources) {
      try {
        const result = await this.discoverSchema(source.id);
        if (!result.error) {
          scanned++;
        } else {
          errors.push(`${source.name}: ${result.error}`);
        }
      } catch (error) {
        errors.push(`${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { scanned, errors };
  }
}

export const schemaDiscoveryService = new SchemaDiscoveryService();