import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Save, 
  Download, 
  Play, 
  Square,
  FileText,
  FolderOpen,
  Database,
  Settings,
  Copy,
  Trash2,
  GripVertical,
  Brain,
  Star,
  Clock,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Table,
  Hash,
  Type,
  AlertTriangle,
  Key
} from "lucide-react";
import SQLEditor from "@/components/query-studio/sql-editor";
import QueryResults from "@/components/query-studio/query-results";
import AiAssistant from "@/components/query-studio/ai-assistant";
import PerformanceMonitor from "@/components/query-studio/performance-monitor";
import { ErrorDisplay, LoadingSkeleton } from "@/components/ui/error-display";
import { ApiException } from "@/lib/api";

// Database Explorer Component
interface DatabaseExplorerProps {
  selectedSourceId: string;
  onFieldSelect: (field: string) => void;
  onTableSelect: (table: string) => void;
}

function DatabaseExplorer({ selectedSourceId, onFieldSelect, onTableSelect }: DatabaseExplorerProps) {
  const [expandedTables, setExpandedTables] = useState<Set<number>>(new Set());

  const { data: tables } = useQuery({
    queryKey: ["/api/data-tables"],
    queryFn: () => api.getDataTables(),
  });

  const { data: dataFields } = useQuery({
    queryKey: ["/api/data-fields"],
    queryFn: () => api.getDataFields(1), // Would need to be dynamic
  });

  const toggleTable = (tableId: number) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableId)) {
      newExpanded.delete(tableId);
    } else {
      newExpanded.add(tableId);
    }
    setExpandedTables(newExpanded);
  };

  const getFieldIcon = (dataType: string) => {
    if (dataType.includes('INT') || dataType.includes('NUMBER')) return <Hash className="w-3 h-3 text-blue-500" />;
    if (dataType.includes('VARCHAR') || dataType.includes('TEXT')) return <Type className="w-3 h-3 text-green-500" />;
    if (dataType.includes('BOOLEAN')) return <Database className="w-3 h-3 text-purple-500" />;
    return <Database className="w-3 h-3 text-gray-500" />;
  };

  const filteredTables = tables?.filter((table: any) => 
    !selectedSourceId || selectedSourceId === "all" || table.sourceId.toString() === selectedSourceId
  ) || [];

  return (
    <div className="w-64 border-r border-gray-300 bg-gray-50 flex flex-col">
      <div className="bg-gray-100 border-b border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">
        DATABASE EXPLORER
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredTables.length > 0 ? (
          <div className="p-1">
            {filteredTables.map((table: any) => (
              <div key={table.id} className="mb-1">
                <div 
                  className="flex items-center space-x-1 px-2 py-1 text-xs hover:bg-blue-50 cursor-pointer rounded"
                  onClick={() => toggleTable(table.id)}
                >
                  {expandedTables.has(table.id) ? (
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  )}
                  <Table className="w-3 h-3 text-blue-600" />
                  <span 
                    className="font-medium text-blue-700 hover:underline flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTableSelect(table.fullName || table.name);
                    }}
                  >
                    {table.name}
                  </span>
                  <span className="text-gray-400">({table.fieldCount || 0})</span>
                </div>
                
                {expandedTables.has(table.id) && (
                  <div className="ml-4 border-l border-gray-200">
                    {table.id === 1 && dataFields ? (
                      dataFields.map((field: any) => (
                        <div 
                          key={field.id}
                          className="flex items-center space-x-1 px-2 py-1 text-xs hover:bg-blue-50 cursor-pointer"
                          onClick={() => onFieldSelect(field.name)}
                        >
                          <div className="w-3 h-3 flex items-center justify-center">
                            {field.isPrimaryKey && <Key className="w-2 h-2 text-yellow-600" />}
                          </div>
                          {getFieldIcon(field.dataType)}
                          <span className="text-gray-700">{field.name}</span>
                          <span className="text-gray-400 text-xs">({field.dataType})</span>
                        </div>
                      ))
                    ) : (
                      // Mock fields for other tables
                      <>
                        <div 
                          className="flex items-center space-x-1 px-2 py-1 text-xs hover:bg-blue-50 cursor-pointer"
                          onClick={() => onFieldSelect(`${table.name}_id`)}
                        >
                          <Key className="w-2 h-2 text-yellow-600" />
                          <Hash className="w-3 h-3 text-blue-500" />
                          <span className="text-gray-700">{table.name}_id</span>
                          <span className="text-gray-400 text-xs">(INT)</span>
                        </div>
                        <div 
                          className="flex items-center space-x-1 px-2 py-1 text-xs hover:bg-blue-50 cursor-pointer"
                          onClick={() => onFieldSelect('name')}
                        >
                          <div className="w-2 h-2"></div>
                          <Type className="w-3 h-3 text-green-500" />
                          <span className="text-gray-700">name</span>
                          <span className="text-gray-400 text-xs">(VARCHAR)</span>
                        </div>
                        <div 
                          className="flex items-center space-x-1 px-2 py-1 text-xs hover:bg-blue-50 cursor-pointer"
                          onClick={() => onFieldSelect('created_at')}
                        >
                          <div className="w-2 h-2"></div>
                          <Database className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-700">created_at</span>
                          <span className="text-gray-400 text-xs">(TIMESTAMP)</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-xs text-gray-500 text-center">
            {selectedSourceId ? 'No tables found in selected source' : 'Select a data source to browse tables'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function QueryStudio() {
  const [selectedSourceId, setSelectedSourceId] = useState<string>("1");
  const [sqlQuery, setSqlQuery] = useState(`-- Customer Analysis Query
SELECT 
    c.customer_id,
    c.first_name,
    c.last_name,
    c.email,
    c.created_date,
    COUNT(t.transaction_id) as total_transactions,
    SUM(t.amount) as total_amount
FROM customers c
LEFT JOIN transactions t ON c.customer_id = t.customer_id
WHERE c.created_date >= '2024-01-01'
    AND c.status = 'active'
GROUP BY c.customer_id, c.first_name, c.last_name, c.email, c.created_date
ORDER BY total_amount DESC
LIMIT 100;`);
  const [queryResults, setQueryResults] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveQueryName, setSaveQueryName] = useState("");
  const [saveQueryDescription, setSaveQueryDescription] = useState("");
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Resizable splitter state
  const [editorWidth, setEditorWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // AI Assistant state
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  
  // Error handling state
  const [queryError, setQueryError] = useState<Error | null>(null);

  // Performance monitoring state
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [isPerformanceMonitorOpen, setIsPerformanceMonitorOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  
  const queryClient = useQueryClient();

  // Resizable splitter handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left - 256) / (containerRect.width - 256)) * 100; // 256px for sidebar
    
    // Limit resize between 20% and 80%
    const clampedWidth = Math.min(Math.max(newWidth, 20), 80);
    setEditorWidth(clampedWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const { data: sources } = useQuery({
    queryKey: ["/api/data-sources"],
    queryFn: () => api.getDataSources(),
  });

  const { data: savedQueries } = useQuery({
    queryKey: ["/api/saved-queries"],
    queryFn: () => api.getSavedQueries(),
  });

  const { data: tables } = useQuery({
    queryKey: ["/api/data-tables"],
    queryFn: () => api.getDataTables(),
  });

  const saveQueryMutation = useMutation({
    mutationFn: (data: any) => api.createSavedQuery(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-queries"] });
      setIsSaveDialogOpen(false);
      setSaveQueryName("");
      setSaveQueryDescription("");
      console.log("Query saved successfully");
    },
    onError: (error) => {
      console.error("Failed to save query:", error);
    },
  });

  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim() || !selectedSourceId) return;
    
    setIsExecuting(true);
    setQueryError(null);
    const startTime = Date.now();
    
    try {
      const result = await api.executeQuery(sqlQuery, parseInt(selectedSourceId), 30000);
      setQueryResults(result);
      setExecutionTime(result.executionTime || Date.now() - startTime);
      
      // Capture performance data if available
      if (result.performance) {
        setPerformanceData(result.performance);
        setIsPerformanceMonitorOpen(true); // Auto-open performance monitor after execution
      }
    } catch (error) {
      console.error("Query execution failed:", error);
      setQueryError(error instanceof Error ? error : new Error('Query execution failed'));
      
      // Create basic performance data for failed queries
      const failedPerformanceData = {
        grade: 'F' as const,
        metrics: {
          queryId: `failed-${Date.now()}`,
          executionTime: Date.now() - startTime,
          rowsReturned: 0,
          rowsScanned: 0,
          memoryUsage: 0,
          cpuTime: 0,
          ioOperations: 0,
          cacheHits: 0,
          indexesUsed: [],
          warnings: [error instanceof Error ? error.message : 'Query execution failed'],
          suggestions: ['Check query syntax and database connectivity']
        },
        suggestions: ['Review query syntax', 'Verify data source connection', 'Check table and column names'],
        executionPlan: undefined
      };
      
      setPerformanceData(failedPerformanceData);
      setIsPerformanceMonitorOpen(true);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSaveQuery = () => {
    setIsSaveDialogOpen(true);
  };

  const confirmSaveQuery = () => {
    if (!saveQueryName.trim() || !sqlQuery.trim()) return;
    
    saveQueryMutation.mutate({
      name: saveQueryName,
      description: saveQueryDescription,
      sqlContent: sqlQuery,
      sourceId: parseInt(selectedSourceId),
      isFavorite: false
    });
  };

  const handleNewQuery = () => {
    setSqlQuery("-- New Query\nSELECT * FROM ");
    setQueryResults(null);
    setExecutionTime(null);
    if (textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleOpenQuery = () => {
    // In a real implementation, this would open a file picker or query browser
    const mockQuery = `-- Opened Query: Customer Analysis
SELECT 
    c.customer_id,
    c.first_name,
    c.last_name,
    COUNT(t.transaction_id) as transaction_count,
    SUM(t.amount) as total_amount
FROM customers c
LEFT JOIN transactions t ON c.customer_id = t.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name
ORDER BY total_amount DESC;`;
    
    setSqlQuery(mockQuery);
    if (textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleExport = () => {
    if (!queryResults) return;
    
    const { columns, rows } = queryResults;
    
    // Create CSV content
    const csvContent = [
      columns.join(','),
      ...rows.map((row: any[]) => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query_results_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleCopyResults = () => {
    if (!queryResults) return;
    
    const { columns, rows } = queryResults;
    const content = [
      columns.join('\t'),
      ...rows.map((row: any[]) => row.join('\t'))
    ].join('\n');
    
    navigator.clipboard.writeText(content).then(() => {
      console.log('Results copied to clipboard');
    });
  };

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(sqlQuery).then(() => {
      console.log('Query copied to clipboard');
    });
  };

  const handleQuerySuggestion = (suggestedQuery: string) => {
    setSqlQuery(suggestedQuery);
    if (textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* DAX Studio-style Ribbon Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300">
        {/* Primary Toolbar */}
        <div className="px-4 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {/* File Operations Group */}
              <div className="flex items-center space-x-1 mr-4 pr-4 border-r border-gray-300">
                <Button variant="outline" size="sm" className="text-xs h-8 px-3" onClick={handleNewQuery}>
                  <FileText className="w-3 h-3 mr-1" />
                  New
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-8 px-3" onClick={handleOpenQuery}>
                  <FolderOpen className="w-3 h-3 mr-1" />
                  Open
                </Button>
                <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs h-8 px-3" onClick={handleSaveQuery}>
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Query</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="queryName">Query Name</Label>
                        <Input
                          id="queryName"
                          value={saveQueryName}
                          onChange={(e) => setSaveQueryName(e.target.value)}
                          placeholder="Enter query name..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="queryDescription">Description (Optional)</Label>
                        <Textarea
                          id="queryDescription"
                          value={saveQueryDescription}
                          onChange={(e) => setSaveQueryDescription(e.target.value)}
                          placeholder="Enter description..."
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={confirmSaveQuery} disabled={!saveQueryName.trim()}>
                          Save Query
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Query Execution Group */}
              <div className="flex items-center space-x-1 mr-4 pr-4 border-r border-gray-300">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="text-xs h-8 px-4 bg-green-600 hover:bg-green-700" 
                  onClick={handleExecuteQuery} 
                  disabled={isExecuting || !selectedSourceId || !sqlQuery.trim()}
                >
                  <Play className="w-3 h-3 mr-1" />
                  {isExecuting ? "Running..." : "Execute"}
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-8 px-3" disabled={!isExecuting}>
                  <Square className="w-3 h-3 mr-1" />
                  Stop
                </Button>
              </div>

              {/* Data Source Selection */}
              <div className="flex items-center space-x-2 mr-4 pr-4 border-r border-gray-300">
                <Database className="w-4 h-4 text-gray-500" />
                <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                  <SelectTrigger className="w-48 h-8 text-xs border-gray-300">
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources?.map((source: any) => (
                      <SelectItem key={source.id} value={source.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Database className="w-3 h-3" />
                          <span>{source.name} ({source.type})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Export Operations */}
              <div className="flex items-center space-x-1 mr-4 pr-4 border-r border-gray-300">
                <Button variant="outline" size="sm" className="text-xs h-8 px-3" onClick={handleExport} disabled={!queryResults}>
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-8 px-3" onClick={handleCopyResults} disabled={!queryResults}>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>

              {/* Performance & AI Tools */}
              <div className="flex items-center space-x-1">
                <PerformanceMonitor
                  performanceData={performanceData}
                  isVisible={isPerformanceMonitorOpen}
                  onToggle={() => setIsPerformanceMonitorOpen(!isPerformanceMonitorOpen)}
                />
                <Button 
                  variant={isAiAssistantOpen ? "default" : "outline"} 
                  size="sm" 
                  className="text-xs h-8 px-3" 
                  onClick={() => setIsAiAssistantOpen(!isAiAssistantOpen)}
                >
                  <Brain className="w-3 h-3 mr-1" />
                  AI Assistant
                </Button>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <div className={`w-2 h-2 rounded-full ${selectedSourceId ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{selectedSourceId ? `Connected to Source ${selectedSourceId}` : 'No connection'}</span>
            </div>
          </div>
        </div>

        {/* Secondary Toolbar - Query Tabs */}
        <div className="px-4 py-1 bg-gray-100">
          <div className="flex items-center space-x-1">
            <div className="bg-white border border-gray-300 px-3 py-1 text-xs font-medium rounded-t">
              Query 1 ●
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-6 px-2 text-gray-500">
              +
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Database Explorer */}
        <DatabaseExplorer
          selectedSourceId={selectedSourceId}
          onFieldSelect={(field) => {
            if (textareaRef.current) {
              const textarea = textareaRef.current;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const newQuery = sqlQuery.substring(0, start) + field + sqlQuery.substring(end);
              setSqlQuery(newQuery);
              
              // Move cursor after the inserted field
              setTimeout(() => {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = start + field.length;
              }, 0);
            }
          }}
          onTableSelect={(table) => {
            const newQuery = `SELECT * FROM ${table} LIMIT 100;`;
            setSqlQuery(newQuery);
            if (textareaRef.current) {
              setTimeout(() => textareaRef.current?.focus(), 0);
            }
          }}
        />

        {/* Center - SQL Editor */}
        <div className="flex flex-col" style={{ width: `${editorWidth}%` }}>
          <div className="bg-gray-100 border-b border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 flex items-center justify-between">
            <span>SQL EDITOR</span>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-gray-500">
                <span>{sqlQuery.split('\n').length} lines</span>
                <span>•</span>
                <span>{sqlQuery.length} chars</span>
              </div>
              <button 
                onClick={handleCopyQuery}
                className="flex items-center space-x-1 px-2 py-0.5 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            {queryError && (
              <div className="p-2 border-b">
                <ErrorDisplay
                  error={queryError}
                  onRetry={() => {
                    setQueryError(null);
                    handleExecuteQuery();
                  }}
                  onDismiss={() => setQueryError(null)}
                  className="border-red-200 bg-red-50"
                />
              </div>
            )}
            <SQLEditor 
              value={sqlQuery}
              onChange={setSqlQuery}
              ref={textareaRef}
            />
          </div>
        </div>

        {/* Resizable Splitter */}
        <div 
          className="w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize flex items-center justify-center group transition-colors"
          onMouseDown={handleMouseDown}
          style={{ 
            backgroundColor: isResizing ? '#9CA3AF' : undefined,
            cursor: 'col-resize'
          }}
        >
          <GripVertical className="w-3 h-3 text-gray-500 group-hover:text-gray-700 opacity-50 group-hover:opacity-100" />
        </div>

        {/* Right Panel - Results */}
        <div className="flex flex-col border-l border-gray-300" style={{ width: `${100 - editorWidth}%` }}>
          <div className="bg-gray-100 border-b border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 flex items-center justify-between">
            <span>QUERY RESULTS</span>
            {queryResults && (
              <div className="flex items-center space-x-4 text-gray-500">
                <span>{(queryResults as any).rowCount} rows</span>
                <span>•</span>
                <span>{executionTime}ms</span>
                <span>•</span>
                <span className="text-green-600">✓ Success</span>
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col">
            <QueryResults 
              results={queryResults}
              isLoading={isExecuting}
            />
            
            {/* Performance Monitor Panel */}
            {isPerformanceMonitorOpen && (
              <PerformanceMonitor
                performanceData={performanceData}
                isVisible={true}
                onToggle={() => setIsPerformanceMonitorOpen(false)}
              />
            )}
          </div>
        </div>

        {/* AI Assistant Panel */}
        {isAiAssistantOpen && (
          <AiAssistant
            onQuerySuggestion={handleQuerySuggestion}
            currentQuery={sqlQuery}
            selectedSourceId={selectedSourceId}
            tables={tables as any[]}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 border-t border-gray-300 px-4 py-1 text-xs text-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Ready</span>
          <span>|</span>
          <span>Source: {selectedSourceId ? `Database ${selectedSourceId}` : 'None'}</span>
          <span>|</span>
          <span>Mode: SQL Editor</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Queries: {savedQueries?.length || 0}</span>
          <span>|</span>
          <span>{isExecuting ? 'Executing...' : queryResults ? 'Last execution: Success' : 'Ready to execute'}</span>
        </div>
      </div>
    </div>
  );
}
