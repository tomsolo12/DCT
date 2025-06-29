import { db } from "./db";
import { 
  dataQualityRules, 
  dataQualityResults, 
  dataTables, 
  dataFields, 
  dataSources,
  activityLogs 
} from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";

export interface RuleExecutionResult {
  ruleId: number;
  passed: boolean;
  violationCount: number;
  totalCount: number;
  score: number;
  details: Record<string, any>;
  executionTime: number;
}

export interface QualityScoreCard {
  tableId: number;
  tableName: string;
  sourceId: number;
  sourceName: string;
  overallScore: number;
  ruleCount: number;
  passedRules: number;
  failedRules: number;
  lastExecuted: Date | null;
  trends: {
    previousScore: number | null;
    trend: 'improving' | 'declining' | 'stable' | 'new';
  };
}

export class RuleExecutionEngine {
  
  async executeRule(ruleId: number): Promise<RuleExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Get rule details with related table and source info
      const [ruleWithContext] = await db
        .select({
          rule: dataQualityRules,
          table: dataTables,
          source: dataSources,
          field: dataFields
        })
        .from(dataQualityRules)
        .leftJoin(dataTables, eq(dataQualityRules.tableId, dataTables.id))
        .leftJoin(dataSources, eq(dataTables.sourceId, dataSources.id))
        .leftJoin(dataFields, eq(dataQualityRules.fieldId, dataFields.id))
        .where(eq(dataQualityRules.id, ruleId));

      if (!ruleWithContext) {
        throw new Error(`Rule ${ruleId} not found`);
      }

      const { rule, table, source, field } = ruleWithContext;
      
      if (!table || !source) {
        throw new Error(`Rule ${ruleId} missing table or source context`);
      }

      console.log(`Executing rule: ${rule.name} on table ${table.fullName}`);

      // Execute rule based on type
      let result: RuleExecutionResult;
      
      switch (rule.ruleType) {
        case 'non_null':
          result = await this.executeNonNullRule(rule, table, source, field);
          break;
        case 'format':
          result = await this.executeFormatRule(rule, table, source, field);
          break;
        case 'range':
          result = await this.executeRangeRule(rule, table, source, field);
          break;
        case 'uniqueness':
          result = await this.executeUniquenessRule(rule, table, source, field);
          break;
        case 'custom':
          result = await this.executeCustomRule(rule, table, source, field);
          break;
        default:
          throw new Error(`Unsupported rule type: ${rule.ruleType}`);
      }

      result.executionTime = Date.now() - startTime;
      
      // Store execution result
      await this.storeExecutionResult(result);
      
      // Log activity
      await db.insert(activityLogs).values({
        type: 'rule_executed',
        description: `Data quality rule "${rule.name}" executed on ${table.fullName}`,
        entityType: 'rule',
        entityId: rule.id
      });

      console.log(`Rule execution completed: ${rule.name} - Score: ${result.score}%`);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`Rule execution failed for rule ${ruleId}:`, error);
      
      return {
        ruleId,
        passed: false,
        violationCount: 0,
        totalCount: 0,
        score: 0,
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime 
        },
        executionTime
      };
    }
  }

  private async executeNonNullRule(
    rule: any, 
    table: any, 
    source: any, 
    field: any
  ): Promise<RuleExecutionResult> {
    if (!field) {
      throw new Error('Non-null rule requires a field');
    }

    const pool = new Pool({ connectionString: source.connectionString });
    
    try {
      // Count total rows
      const totalQuery = `SELECT COUNT(*) as total FROM ${table.fullName}`;
      const totalResult = await pool.query(totalQuery);
      const totalCount = parseInt(totalResult.rows[0].total);

      // Count null rows
      const nullQuery = `SELECT COUNT(*) as nulls FROM ${table.fullName} WHERE "${field.name}" IS NULL`;
      const nullResult = await pool.query(nullQuery);
      const violationCount = parseInt(nullResult.rows[0].nulls);

      const passed = violationCount === 0;
      const score = totalCount > 0 ? Math.round(((totalCount - violationCount) / totalCount) * 100) : 100;

      return {
        ruleId: rule.id,
        passed,
        violationCount,
        totalCount,
        score,
        details: {
          fieldName: field.name,
          tableName: table.fullName,
          nullCount: violationCount,
          nonNullCount: totalCount - violationCount
        },
        executionTime: 0
      };
    } finally {
      await pool.end();
    }
  }

  private async executeFormatRule(
    rule: any, 
    table: any, 
    source: any, 
    field: any
  ): Promise<RuleExecutionResult> {
    if (!field) {
      throw new Error('Format rule requires a field');
    }

    const ruleConfig = rule.ruleConfig as { pattern: string; description?: string };
    if (!ruleConfig.pattern) {
      throw new Error('Format rule requires a pattern');
    }

    const pool = new Pool({ connectionString: source.connectionString });
    
    try {
      // Count total non-null rows
      const totalQuery = `SELECT COUNT(*) as total FROM ${table.fullName} WHERE "${field.name}" IS NOT NULL`;
      const totalResult = await pool.query(totalQuery);
      const totalCount = parseInt(totalResult.rows[0].total);

      // Count rows that don't match pattern
      const violationQuery = `
        SELECT COUNT(*) as violations 
        FROM ${table.fullName} 
        WHERE "${field.name}" IS NOT NULL 
        AND "${field.name}" !~ $1
      `;
      const violationResult = await pool.query(violationQuery, [ruleConfig.pattern]);
      const violationCount = parseInt(violationResult.rows[0].violations);

      const passed = violationCount === 0;
      const score = totalCount > 0 ? Math.round(((totalCount - violationCount) / totalCount) * 100) : 100;

      return {
        ruleId: rule.id,
        passed,
        violationCount,
        totalCount,
        score,
        details: {
          fieldName: field.name,
          tableName: table.fullName,
          pattern: ruleConfig.pattern,
          matchingCount: totalCount - violationCount,
          violatingCount: violationCount
        },
        executionTime: 0
      };
    } finally {
      await pool.end();
    }
  }

  private async executeRangeRule(
    rule: any, 
    table: any, 
    source: any, 
    field: any
  ): Promise<RuleExecutionResult> {
    if (!field) {
      throw new Error('Range rule requires a field');
    }

    const ruleConfig = rule.ruleConfig as { 
      minValue?: number; 
      maxValue?: number; 
      includeMin?: boolean; 
      includeMax?: boolean 
    };

    const pool = new Pool({ connectionString: source.connectionString });
    
    try {
      // Count total non-null rows
      const totalQuery = `SELECT COUNT(*) as total FROM ${table.fullName} WHERE "${field.name}" IS NOT NULL`;
      const totalResult = await pool.query(totalQuery);
      const totalCount = parseInt(totalResult.rows[0].total);

      // Build range condition
      let rangeCondition = '';
      const params: any[] = [];
      
      if (ruleConfig.minValue !== undefined) {
        const op = ruleConfig.includeMin !== false ? '>=' : '>';
        rangeCondition += `"${field.name}" ${op} $${params.length + 1}`;
        params.push(ruleConfig.minValue);
      }
      
      if (ruleConfig.maxValue !== undefined) {
        if (rangeCondition) rangeCondition += ' AND ';
        const op = ruleConfig.includeMax !== false ? '<=' : '<';
        rangeCondition += `"${field.name}" ${op} $${params.length + 1}`;
        params.push(ruleConfig.maxValue);
      }

      if (!rangeCondition) {
        throw new Error('Range rule requires at least min or max value');
      }

      // Count violations (values outside range)
      const violationQuery = `
        SELECT COUNT(*) as violations 
        FROM ${table.fullName} 
        WHERE "${field.name}" IS NOT NULL 
        AND NOT (${rangeCondition})
      `;
      const violationResult = await pool.query(violationQuery, params);
      const violationCount = parseInt(violationResult.rows[0].violations);

      const passed = violationCount === 0;
      const score = totalCount > 0 ? Math.round(((totalCount - violationCount) / totalCount) * 100) : 100;

      return {
        ruleId: rule.id,
        passed,
        violationCount,
        totalCount,
        score,
        details: {
          fieldName: field.name,
          tableName: table.fullName,
          minValue: ruleConfig.minValue,
          maxValue: ruleConfig.maxValue,
          inRangeCount: totalCount - violationCount,
          outOfRangeCount: violationCount
        },
        executionTime: 0
      };
    } finally {
      await pool.end();
    }
  }

  private async executeUniquenessRule(
    rule: any, 
    table: any, 
    source: any, 
    field: any
  ): Promise<RuleExecutionResult> {
    if (!field) {
      throw new Error('Uniqueness rule requires a field');
    }

    const pool = new Pool({ connectionString: source.connectionString });
    
    try {
      // Count total non-null rows
      const totalQuery = `SELECT COUNT(*) as total FROM ${table.fullName} WHERE "${field.name}" IS NOT NULL`;
      const totalResult = await pool.query(totalQuery);
      const totalCount = parseInt(totalResult.rows[0].total);

      // Count unique values
      const uniqueQuery = `SELECT COUNT(DISTINCT "${field.name}") as unique_count FROM ${table.fullName} WHERE "${field.name}" IS NOT NULL`;
      const uniqueResult = await pool.query(uniqueQuery);
      const uniqueCount = parseInt(uniqueResult.rows[0].unique_count);

      const violationCount = totalCount - uniqueCount;
      const passed = violationCount === 0;
      const score = totalCount > 0 ? Math.round((uniqueCount / totalCount) * 100) : 100;

      return {
        ruleId: rule.id,
        passed,
        violationCount,
        totalCount,
        score,
        details: {
          fieldName: field.name,
          tableName: table.fullName,
          uniqueValues: uniqueCount,
          duplicateValues: violationCount,
          uniquenessRatio: totalCount > 0 ? (uniqueCount / totalCount) : 1
        },
        executionTime: 0
      };
    } finally {
      await pool.end();
    }
  }

  private async executeCustomRule(
    rule: any, 
    table: any, 
    source: any, 
    field: any
  ): Promise<RuleExecutionResult> {
    const ruleConfig = rule.ruleConfig as { sqlQuery: string; description?: string };
    if (!ruleConfig.sqlQuery) {
      throw new Error('Custom rule requires SQL query');
    }

    const pool = new Pool({ connectionString: source.connectionString });
    
    try {
      // Execute custom SQL query
      // Expected to return columns: total_count, violation_count, passed
      const result = await pool.query(ruleConfig.sqlQuery);
      
      if (result.rows.length === 0) {
        throw new Error('Custom rule query returned no results');
      }

      const row = result.rows[0];
      const totalCount = parseInt(row.total_count || '0');
      const violationCount = parseInt(row.violation_count || '0');
      const passed = row.passed === true || row.passed === 'true' || violationCount === 0;
      const score = totalCount > 0 ? Math.round(((totalCount - violationCount) / totalCount) * 100) : 100;

      return {
        ruleId: rule.id,
        passed,
        violationCount,
        totalCount,
        score,
        details: {
          tableName: table.fullName,
          customQuery: ruleConfig.sqlQuery,
          queryResult: row
        },
        executionTime: 0
      };
    } finally {
      await pool.end();
    }
  }

  private async storeExecutionResult(result: RuleExecutionResult): Promise<void> {
    await db.insert(dataQualityResults).values({
      ruleId: result.ruleId,
      passed: result.passed,
      violationCount: result.violationCount,
      totalCount: result.totalCount,
      score: result.score.toString(),
      details: result.details
    });
  }

  async executeAllRulesForTable(tableId: number): Promise<RuleExecutionResult[]> {
    const rules = await db
      .select()
      .from(dataQualityRules)
      .where(and(eq(dataQualityRules.tableId, tableId), eq(dataQualityRules.isActive, true)));

    const results: RuleExecutionResult[] = [];
    
    for (const rule of rules) {
      const result = await this.executeRule(rule.id);
      results.push(result);
    }

    return results;
  }

  async executeAllActiveRules(): Promise<{ executed: number; errors: string[] }> {
    const rules = await db
      .select()
      .from(dataQualityRules)
      .where(eq(dataQualityRules.isActive, true));

    const errors: string[] = [];
    let executed = 0;

    for (const rule of rules) {
      try {
        await this.executeRule(rule.id);
        executed++;
      } catch (error) {
        errors.push(`Rule ${rule.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { executed, errors };
  }

  async getQualityScoreCards(): Promise<QualityScoreCard[]> {
    // Get latest scores for each table
    const scoreCards = await db
      .select({
        tableId: dataTables.id,
        tableName: dataTables.fullName,
        sourceId: dataSources.id,
        sourceName: dataSources.name,
        ruleCount: sql<number>`COUNT(DISTINCT ${dataQualityRules.id})`,
        avgScore: sql<number>`COALESCE(AVG(CAST(${dataQualityResults.score} AS DECIMAL)), 0)`,
        passedRules: sql<number>`COUNT(CASE WHEN ${dataQualityResults.passed} = true THEN 1 END)`,
        failedRules: sql<number>`COUNT(CASE WHEN ${dataQualityResults.passed} = false THEN 1 END)`,
        lastExecuted: sql<Date>`MAX(${dataQualityResults.runAt})`
      })
      .from(dataTables)
      .leftJoin(dataSources, eq(dataTables.sourceId, dataSources.id))
      .leftJoin(dataQualityRules, eq(dataQualityRules.tableId, dataTables.id))
      .leftJoin(dataQualityResults, eq(dataQualityResults.ruleId, dataQualityRules.id))
      .groupBy(dataTables.id, dataSources.id, dataSources.name, dataTables.fullName);

    return scoreCards
      .filter(card => card.sourceId !== null && card.sourceName !== null)
      .map(card => ({
        tableId: card.tableId,
        tableName: card.tableName,
        sourceId: card.sourceId!,
        sourceName: card.sourceName!,
        overallScore: Math.round(card.avgScore),
        ruleCount: card.ruleCount,
        passedRules: card.passedRules,
        failedRules: card.failedRules,
        lastExecuted: card.lastExecuted,
        trends: {
          previousScore: null, // TODO: Implement trend calculation
          trend: 'stable' as const
        }
      }));
  }
}

export const ruleExecutionEngine = new RuleExecutionEngine();