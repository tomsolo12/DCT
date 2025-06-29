import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, LayoutList, ScanLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import the advanced search components
import AdvancedSearch from "@/components/catalog/advanced-search";
import EnhancedSearchResults from "@/components/catalog/enhanced-search-results";
import SourceTree from "@/components/data-sources/source-tree";
import TableDetailModal from "@/components/table-detail-modal";

export default function Catalog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // View mode state
  const [viewMode, setViewMode] = useState<'browse' | 'search'>('browse');
  
  // Legacy browse mode state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedSchema, setSelectedSchema] = useState("all");
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  // Advanced search state
  const [searchFilters, setSearchFilters] = useState<any>({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Data fetching
  const { data: sources } = useQuery({
    queryKey: ['/api/data-sources'],
  });

  const { data: tables } = useQuery({
    queryKey: ['/api/data-tables'],
  });

  const scanSourcesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/scan-sources', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to scan sources');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Schema Scan Completed",
        description: `Scanned ${data.scanned} sources successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/data-tables'] });
    },
    onError: (error: any) => {
      toast({
        title: "Scan Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Advanced search functionality
  const handleFiltersChange = async (filters: any) => {
    setSearchFilters(filters);
    setIsSearching(true);
    setCurrentPage(1);
    
    try {
      const response = await fetch('/api/search/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...filters, limit: 50, offset: 0 }),
      });
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Unable to perform search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleFacetFilter = (facetType: string, value: string) => {
    // Handle facet filtering
    const newFilters = { ...searchFilters };
    
    if (facetType === 'sources') {
      newFilters.sourceIds = [parseInt(value)];
    } else if (facetType === 'schemas') {
      newFilters.schemas = [value];
    } else if (facetType === 'tags') {
      newFilters.tags = [value];
    }
    
    handleFiltersChange(newFilters);
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    const offset = (page - 1) * 50;
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/search/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...searchFilters, limit: 50, offset }),
      });
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Unable to load page. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Legacy browse mode functionality
  const handleScanSources = () => {
    scanSourcesMutation.mutate();
  };

  const handleTableSelect = (tableId: number) => {
    setSelectedTableId(tableId);
  };

  const handleCloseModal = () => {
    setSelectedTableId(null);
  };

  const isScanning = scanSourcesMutation.isPending;

  // Calculate derived data for legacy mode
  const uniqueSources = Array.from(new Set((tables || []).map((table: any) => table.sourceId)));
  const uniqueSchemas = Array.from(new Set((tables || []).map((table: any) => table.schema)));
  const schemas = uniqueSchemas;
  const popularTags = ['business-critical', 'pii', 'financial', 'customer-data'];

  const filteredTables = (tables || []).filter((table: any) => {
    const matchesSearch = !searchQuery || 
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.schema.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = selectedSource === "all" || table.sourceId.toString() === selectedSource;
    const matchesSchema = selectedSchema === "all" || table.schema === selectedSchema;
    
    return matchesSearch && matchesSource && matchesSchema;
  });

  const totalPages = searchResults ? Math.ceil(searchResults.metrics.totalResults / 50) : 1;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with View Mode Toggle */}
      <div className="bg-gray-50 border-b border-gray-300 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Data Catalog</h1>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'browse' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('browse')}
                className="flex items-center space-x-1"
              >
                <LayoutList className="w-4 h-4" />
                <span>Browse</span>
              </Button>
              <Button
                variant={viewMode === 'search' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('search')}
                className="flex items-center space-x-1"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </Button>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleScanSources}
            disabled={isScanning}
            className="flex items-center space-x-1"
          >
            <ScanLine className="w-4 h-4" />
            <span>{isScanning ? 'Scanning...' : 'Scan Sources'}</span>
          </Button>
        </div>
      </div>

      {/* Content based on view mode */}
      <div className="flex-1 flex flex-col">
        {viewMode === 'search' ? (
          <div className="flex-1 flex flex-col space-y-4 p-4">
            {/* Advanced Search Interface */}
            <AdvancedSearch
              onFiltersChange={handleFiltersChange}
              sources={sources || []}
              schemas={schemas}
              popularTags={popularTags}
              isLoading={isSearching}
            />
            
            {/* Search Results */}
            {searchResults && (
              <EnhancedSearchResults
                results={searchResults.results}
                metrics={searchResults.metrics}
                isLoading={isSearching}
                onTableSelect={handleTableSelect}
                onFacetFilter={handleFacetFilter}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                totalPages={totalPages}
                searchQuery={searchFilters.query}
              />
            )}
          </div>
        ) : (
          <>
            {/* Legacy Browse Interface */}
            <div className="bg-gray-50 border-b border-gray-300 px-4 py-2">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Input
                    type="text"
                    placeholder="Quick search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 text-sm border-gray-300 bg-white h-7"
                  />
                  <Search className="w-3 h-3 text-gray-400 absolute left-2 top-2" />
                </div>
                
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger className="w-32 h-7 text-xs border-gray-300">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {uniqueSources.map(sourceId => (
                      <SelectItem key={sourceId} value={sourceId.toString()}>
                        Source {sourceId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSchema} onValueChange={setSelectedSchema}>
                  <SelectTrigger className="w-32 h-7 text-xs border-gray-300">
                    <SelectValue placeholder="All Schemas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schemas</SelectItem>
                    {uniqueSchemas.map(schema => (
                      <SelectItem key={schema} value={schema}>
                        {schema}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Source Tree Sidebar */}
              <div className="w-80 border-r border-gray-300 bg-gray-50">
                <div className="bg-gray-100 border-b border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">
                  DATA SOURCES
                </div>
                <SourceTree sources={sources} />
              </div>

              {/* Data Table Grid */}
              <div className="flex-1 flex flex-col">
                <div className="bg-white border border-gray-300 flex-1">
                  {/* Grid Headers */}
                  <div className="bg-gray-100 border-b border-gray-300 grid grid-cols-8 text-xs font-medium text-gray-700">
                    <div className="px-3 py-2 border-r border-gray-300">Table Name</div>
                    <div className="px-3 py-2 border-r border-gray-300">Source</div>
                    <div className="px-3 py-2 border-r border-gray-300">Schema</div>
                    <div className="px-3 py-2 border-r border-gray-300">Field Count</div>
                    <div className="px-3 py-2 border-r border-gray-300">Record Count</div>
                    <div className="px-3 py-2 border-r border-gray-300">DQ Score</div>
                    <div className="px-3 py-2 border-r border-gray-300">Last Scan</div>
                    <div className="px-3 py-2">Tags</div>
                  </div>

                  {/* Data Rows */}
                  <div className="overflow-y-auto">
                    {filteredTables && filteredTables.length > 0 ? (
                      filteredTables.map((table: any) => {
                          const mockDQScore = 85 + (table.id % 15);
                          const mockRecordCount = Math.floor(Math.random() * 1000000) + 1000;
                          
                          return (
                            <div 
                              key={table.id} 
                              className="grid grid-cols-8 text-sm border-b border-gray-200 hover:bg-blue-50 cursor-pointer"
                              onClick={() => handleTableSelect(table.id)}
                            >
                              <div className="px-3 py-2 border-r border-gray-300 font-medium text-blue-600 hover:underline">
                                {table.name}
                              </div>
                              <div className="px-3 py-2 border-r border-gray-300 text-gray-600 text-xs">
                                {sources?.find((s: any) => s.id === table.sourceId)?.name || 'Unknown'}
                              </div>
                              <div className="px-3 py-2 border-r border-gray-300 text-gray-600 text-xs">
                                {table.schema}
                              </div>
                              <div className="px-3 py-2 border-r border-gray-300 text-right font-mono text-xs">
                                {table.fieldCount || 0}
                              </div>
                              <div className="px-3 py-2 border-r border-gray-300 text-right font-mono">
                                {mockRecordCount.toLocaleString()}
                              </div>
                              <div className="px-3 py-2 border-r border-gray-300 text-right">
                                <span className={`px-2 py-1 text-xs rounded ${
                                  mockDQScore >= 90 ? 'bg-green-100 text-green-800' :
                                  mockDQScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {mockDQScore}%
                                </span>
                              </div>
                              <div className="px-3 py-2 border-r border-gray-300 text-gray-500 text-xs font-mono">
                                {table.lastScanAt ? new Date(table.lastScanAt).toLocaleDateString() : 'Never'}
                              </div>
                              <div className="px-3 py-2">
                                {table.tags && table.tags.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {table.tags.slice(0, 2).map((tag: any, index: number) => (
                                      <span key={index} className="px-1 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                                        {tag}
                                      </span>
                                    ))}
                                    {table.tags.length > 2 && (
                                      <span className="px-1 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                                        +{table.tags.length - 2}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="px-3 py-8 text-center text-gray-500 text-sm">
                        No data tables found. Try scanning your data sources.
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Status Bar */}
                <div className="bg-gray-100 border-t border-gray-300 px-4 py-1 text-xs text-gray-600 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span>Showing {filteredTables?.length || 0} of {tables?.length || 0} tables</span>
                    <span>|</span>
                    <span>Search: {searchQuery || 'None'}</span>
                    {selectedSource !== "all" && <span>| Source: {selectedSource}</span>}
                    {selectedSchema !== "all" && <span>| Schema: {selectedSchema}</span>}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span>Total Sources: {sources?.length || 0}</span>
                    <span>|</span>
                    <span>Total Schemas: {uniqueSchemas.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedTableId && (
        <TableDetailModal
          tableId={selectedTableId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}