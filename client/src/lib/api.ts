import { apiRequest } from "./queryClient";

export interface DashboardMetrics {
  totalSources: number;
  totalTables: number;
  totalRules: number;
  avgQualityScore: number;
  lastScanTime: Date | null;
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export class ApiException extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

// Enhanced API wrapper with error handling
async function handleApiRequest<T>(requestFn: () => Promise<Response>): Promise<T> {
  try {
    const response = await requestFn();
    
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      let errorDetails = null;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        errorDetails = errorData.details;
      } catch {
        // Failed to parse error response
      }
      
      throw new ApiException(
        errorMessage,
        response.status.toString(),
        errorDetails,
        response.status
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    
    // Handle network errors, timeouts, etc.
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiException(
        'Network error - please check your connection',
        'NETWORK_ERROR'
      );
    }
    
    throw new ApiException(
      'An unexpected error occurred',
      'UNKNOWN_ERROR',
      error
    );
  }
}

export const api = {
  // Dashboard
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    return handleApiRequest(() => apiRequest("GET", "/api/dashboard/metrics"));
  },

  // Data Sources
  getDataSources: async () => {
    return handleApiRequest(() => apiRequest("GET", "/api/data-sources"));
  },

  createDataSource: async (data: any) => {
    return handleApiRequest(() => apiRequest("POST", "/api/data-sources", data));
  },

  scanDataSource: async (id: number) => {
    return handleApiRequest(() => apiRequest("POST", `/api/data-sources/${id}/scan`));
  },

  scanAllSources: async () => {
    return handleApiRequest(() => apiRequest("POST", "/api/schema/scan-all"));
  },

  // Data Tables
  getDataTables: async (sourceId?: number) => {
    const url = sourceId ? `/api/data-tables?sourceId=${sourceId}` : "/api/data-tables";
    return handleApiRequest(() => apiRequest("GET", url));
  },

  getDataTable: async (id: number) => {
    return handleApiRequest(() => apiRequest("GET", `/api/data-tables/${id}`));
  },

  getDataFields: async (tableId: number) => {
    return handleApiRequest(() => apiRequest("GET", `/api/data-tables/${tableId}/fields`));
  },

  // Data Quality Rules
  getDataQualityRules: async (tableId?: number) => {
    const url = tableId ? `/api/data-quality-rules?tableId=${tableId}` : "/api/data-quality-rules";
    return handleApiRequest(() => apiRequest("GET", url));
  },

  createDataQualityRule: async (data: any) => {
    return handleApiRequest(() => apiRequest("POST", "/api/data-quality-rules", data));
  },

  // Saved Queries
  getSavedQueries: async () => {
    return handleApiRequest(() => apiRequest("GET", "/api/saved-queries"));
  },

  createSavedQuery: async (data: any) => {
    return handleApiRequest(() => apiRequest("POST", "/api/saved-queries", data));
  },

  // Query Execution with timeout
  executeQuery: async (sql: string, sourceId: number, timeoutMs: number = 30000): Promise<QueryResult> => {
    return handleApiRequest(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        const response = await fetch('/api/query/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql, sourceId }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ApiException(
            `Query execution timed out after ${timeoutMs / 1000} seconds`,
            'QUERY_TIMEOUT'
          );
        }
        throw error;
      }
    });
  },

  // Activity Logs
  getActivityLogs: async (limit?: number) => {
    const url = limit ? `/api/activity-logs?limit=${limit}` : "/api/activity-logs";
    return handleApiRequest(() => apiRequest("GET", url));
  },

  // Test data source connection
  testDataSourceConnection: async (sourceId: number) => {
    return handleApiRequest(() => apiRequest("POST", `/api/data-sources/${sourceId}/test`));
  },

  // Scan data source schema
  scanDataSourceSchema: async (sourceId: number) => {
    return handleApiRequest(() => apiRequest("POST", `/api/data-sources/${sourceId}/scan`));
  },

  // Generic POST method for custom endpoints
  post: async (endpoint: string, data?: any) => {
    return handleApiRequest(() => apiRequest("POST", endpoint, data));
  },
};
