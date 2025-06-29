import { db } from "./db";
import { dataTables, dataFields, dataSources } from "@shared/schema";
import { eq, sql, ilike, and, or, isNotNull, desc, asc } from "drizzle-orm";
import { storage } from "./storage";

export interface SearchFilters {
  query?: string;
  sourceIds?: number[];
  schemas?: string[];
  tableTypes?: string[];
  tags?: string[];
  hasBusinessTerms?: boolean;
  hasDescription?: boolean;
  qualityScoreRange?: [number, number];
  rowCountRange?: [number, number];
  dateRange?: {
    start: Date;
    end: Date;
    field: 'createdAt' | 'lastScannedAt';
  };
}

export interface SearchResult {
  id: number;
  name: string;
  fullName: string;
  schema: string;
  sourceId: number;
  sourceName: string;
  sourceType: string;
  description?: string;
  tags: string[];
  rowCount?: number;
  fieldCount?: number;
  qualityScore?: number;
  lastScannedAt?: Date;
  relevanceScore: number;
  matchedFields: string[];
  businessTerms?: string[];
}

export interface SearchSuggestion {
  type: 'table' | 'field' | 'tag' | 'business_term';
  value: string;
  category: string;
  frequency: number;
}

export interface SearchMetrics {
  totalResults: number;
  searchTime: number;
  facets: {
    sources: Array<{ name: string; count: number }>;
    schemas: Array<{ name: string; count: number }>;
    tags: Array<{ name: string; count: number }>;
    qualityScores: Array<{ range: string; count: number }>;
  };
}

export class AdvancedSearchEngine {
  private searchHistory: Map<string, number> = new Map();
  private suggestionCache: Map<string, SearchSuggestion[]> = new Map();

  async searchTables(filters: SearchFilters, limit: number = 50, offset: number = 0): Promise<{
    results: SearchResult[];
    metrics: SearchMetrics;
  }> {
    const startTime = Date.now();
    
    try {
      // Build base query with joins
      let baseQuery = db
        .select({
          id: dataTables.id,
          name: dataTables.name,
          fullName: dataTables.fullName,
          schema: sql<string>`COALESCE(SPLIT_PART(${dataTables.fullName}, '.', 1), 'public')`.as('schema'),
          sourceId: dataTables.sourceId,
          sourceName: dataSources.name,
          sourceType: dataSources.type,
          description: dataTables.description,
          tags: dataTables.tags,
          rowCount: dataTables.rowCount,
          fieldCount: dataTables.fieldCount,
          qualityScore: dataTables.qualityScore,
          lastScannedAt: dataTables.lastScannedAt,
        })
        .from(dataTables)
        .leftJoin(dataSources, eq(dataTables.sourceId, dataSources.id));

      // Apply filters
      const conditions = [];

      // Text search with ranking
      if (filters.query) {
        const searchTerm = `%${filters.query.toLowerCase()}%`;
        conditions.push(
          or(
            ilike(dataTables.name, searchTerm),
            ilike(dataTables.fullName, searchTerm),
            ilike(dataTables.description, searchTerm),
            sql`LOWER(array_to_string(${dataTables.tags}, ' ')) LIKE ${searchTerm}`
          )
        );
      }

      // Source filtering
      if (filters.sourceIds?.length) {
        conditions.push(sql`${dataTables.sourceId} = ANY(${filters.sourceIds})`);
      }

      // Schema filtering
      if (filters.schemas?.length) {
        const schemaConditions = filters.schemas.map(schema => 
          sql`SPLIT_PART(${dataTables.fullName}, '.', 1) = ${schema}`
        );
        conditions.push(or(...schemaConditions));
      }

      // Tag filtering
      if (filters.tags?.length) {
        conditions.push(
          sql`${dataTables.tags} && ${filters.tags}`
        );
      }

      // Quality score range
      if (filters.qualityScoreRange) {
        const [min, max] = filters.qualityScoreRange;
        conditions.push(
          and(
            sql`${dataTables.qualityScore} >= ${min}`,
            sql`${dataTables.qualityScore} <= ${max}`
          )
        );
      }

      // Row count range
      if (filters.rowCountRange) {
        const [min, max] = filters.rowCountRange;
        conditions.push(
          and(
            sql`${dataTables.rowCount} >= ${min}`,
            sql`${dataTables.rowCount} <= ${max}`
          )
        );
      }

      // Has description filter
      if (filters.hasDescription) {
        conditions.push(isNotNull(dataTables.description));
      }

      // Apply all conditions
      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions));
      }

      // Get total count for metrics
      const countQuery = db
        .select({ count: sql<number>`COUNT(*)` })
        .from(dataTables)
        .leftJoin(dataSources, eq(dataTables.sourceId, dataSources.id));

      if (conditions.length > 0) {
        countQuery.where(and(...conditions));
      }

      const [{ count: totalResults }] = await countQuery;

      // Execute main query with pagination and sorting
      const results = await baseQuery
        .orderBy(desc(dataTables.qualityScore), asc(dataTables.name))
        .limit(limit)
        .offset(offset);

      // Calculate relevance scores and match information
      const searchResults: SearchResult[] = results.map(result => {
        const relevanceScore = this.calculateRelevanceScore(result, filters.query);
        const matchedFields = this.getMatchedFields(result, filters.query);
        
        return {
          ...result,
          tags: result.tags || [],
          relevanceScore,
          matchedFields,
          businessTerms: this.extractBusinessTerms(result.tags || [])
        };
      });

      // Generate search metrics and facets
      const metrics = await this.generateSearchMetrics(filters, totalResults, startTime);

      // Update search history
      if (filters.query) {
        this.updateSearchHistory(filters.query);
      }

      return {
        results: searchResults,
        metrics
      };

    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Search failed');
    }
  }

  private calculateRelevanceScore(result: any, query?: string): number {
    if (!query) return 0.5;

    let score = 0;
    const queryLower = query.toLowerCase();

    // Name match (highest weight)
    if (result.name?.toLowerCase().includes(queryLower)) {
      score += 1.0;
    }

    // Full name match
    if (result.fullName?.toLowerCase().includes(queryLower)) {
      score += 0.8;
    }

    // Description match
    if (result.description?.toLowerCase().includes(queryLower)) {
      score += 0.6;
    }

    // Tag match
    if (result.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))) {
      score += 0.4;
    }

    // Quality score bonus
    if (result.qualityScore) {
      score += (result.qualityScore / 100) * 0.2;
    }

    return Math.min(score, 1.0);
  }

  private getMatchedFields(result: any, query?: string): string[] {
    if (!query) return [];

    const matches = [];
    const queryLower = query.toLowerCase();

    if (result.name?.toLowerCase().includes(queryLower)) {
      matches.push('name');
    }
    if (result.fullName?.toLowerCase().includes(queryLower)) {
      matches.push('fullName');
    }
    if (result.description?.toLowerCase().includes(queryLower)) {
      matches.push('description');
    }
    if (result.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))) {
      matches.push('tags');
    }

    return matches;
  }

  private extractBusinessTerms(tags: string[]): string[] {
    // Extract potential business terms from tags
    return tags.filter(tag => 
      tag.includes('business') || 
      tag.includes('metric') || 
      tag.includes('kpi') ||
      tag.includes('dimension')
    );
  }

  private async generateSearchMetrics(filters: SearchFilters, totalResults: number, startTime: number): Promise<SearchMetrics> {
    const searchTime = Date.now() - startTime;

    // Generate facets
    const sourceFacets = await db
      .select({
        name: dataSources.name,
        count: sql<number>`COUNT(*)`,
      })
      .from(dataTables)
      .leftJoin(dataSources, eq(dataTables.sourceId, dataSources.id))
      .groupBy(dataSources.name)
      .orderBy(desc(sql`COUNT(*)`));

    const schemaFacets = await db
      .select({
        name: sql<string>`SPLIT_PART(${dataTables.fullName}, '.', 1)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(dataTables)
      .groupBy(sql`SPLIT_PART(${dataTables.fullName}, '.', 1)`)
      .orderBy(desc(sql`COUNT(*)`));

    // Quality score distribution
    const qualityFacets = await db
      .select({
        range: sql<string>`
          CASE 
            WHEN ${dataTables.qualityScore} >= 90 THEN 'Excellent (90-100)'
            WHEN ${dataTables.qualityScore} >= 80 THEN 'Good (80-89)'
            WHEN ${dataTables.qualityScore} >= 70 THEN 'Fair (70-79)'
            WHEN ${dataTables.qualityScore} >= 60 THEN 'Poor (60-69)'
            ELSE 'Critical (<60)'
          END
        `,
        count: sql<number>`COUNT(*)`,
      })
      .from(dataTables)
      .where(isNotNull(dataTables.qualityScore))
      .groupBy(sql`
        CASE 
          WHEN ${dataTables.qualityScore} >= 90 THEN 'Excellent (90-100)'
          WHEN ${dataTables.qualityScore} >= 80 THEN 'Good (80-89)'
          WHEN ${dataTables.qualityScore} >= 70 THEN 'Fair (70-79)'
          WHEN ${dataTables.qualityScore} >= 60 THEN 'Poor (60-69)'
          ELSE 'Critical (<60)'
        END
      `)
      .orderBy(desc(sql`COUNT(*)`));

    return {
      totalResults,
      searchTime,
      facets: {
        sources: sourceFacets.map(f => ({ name: f.name || 'Unknown', count: f.count })),
        schemas: schemaFacets.map(f => ({ name: f.name || 'public', count: f.count })),
        tags: [], // Will be populated from tag analysis
        qualityScores: qualityFacets.map(f => ({ range: f.range, count: f.count }))
      }
    };
  }

  async getSuggestions(query: string, limit: number = 10): Promise<SearchSuggestion[]> {
    const cacheKey = `suggestions:${query}`;
    
    if (this.suggestionCache.has(cacheKey)) {
      return this.suggestionCache.get(cacheKey)!;
    }

    const suggestions: SearchSuggestion[] = [];

    // Table name suggestions
    const tableNames = await db
      .select({ name: dataTables.name })
      .from(dataTables)
      .where(ilike(dataTables.name, `%${query}%`))
      .limit(5);

    tableNames.forEach(table => {
      suggestions.push({
        type: 'table',
        value: table.name,
        category: 'Tables',
        frequency: this.searchHistory.get(table.name) || 0
      });
    });

    // Field name suggestions
    const fieldNames = await db
      .select({ name: dataFields.name })
      .from(dataFields)
      .where(ilike(dataFields.name, `%${query}%`))
      .limit(5);

    fieldNames.forEach(field => {
      suggestions.push({
        type: 'field',
        value: field.name,
        category: 'Fields',
        frequency: this.searchHistory.get(field.name) || 0
      });
    });

    // Sort by frequency and relevance
    suggestions.sort((a, b) => b.frequency - a.frequency);

    const result = suggestions.slice(0, limit);
    this.suggestionCache.set(cacheKey, result);

    return result;
  }

  private updateSearchHistory(query: string): void {
    const current = this.searchHistory.get(query) || 0;
    this.searchHistory.set(query, current + 1);
  }

  async getPopularSearches(limit: number = 10): Promise<string[]> {
    return Array.from(this.searchHistory.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([query]) => query);
  }

  async indexTable(tableId: number): Promise<void> {
    // Update search indexes for better performance
    // This would typically update full-text search indexes
    try {
      await storage.createActivityLog({
        type: 'table_indexed',
        description: `Table ${tableId} indexed for search`,
        entityType: 'table',
        entityId: tableId
      });
    } catch (error) {
      console.error('Failed to index table:', error);
    }
  }
}

export const advancedSearchEngine = new AdvancedSearchEngine();