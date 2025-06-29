import { useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Database, Clock, Hash, Tag, Star, TrendingUp, 
  Filter, ChevronLeft, ChevronRight, Eye, BarChart3
} from "lucide-react";

interface SearchResult {
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

interface SearchMetrics {
  totalResults: number;
  searchTime: number;
  facets: {
    sources: Array<{ name: string; count: number }>;
    schemas: Array<{ name: string; count: number }>;
    tags: Array<{ name: string; count: number }>;
    qualityScores: Array<{ range: string; count: number }>;
  };
}

interface EnhancedSearchResultsProps {
  results: SearchResult[];
  metrics: SearchMetrics;
  isLoading?: boolean;
  onTableSelect: (tableId: number) => void;
  onFacetFilter: (facetType: string, value: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  searchQuery?: string;
}

export default function EnhancedSearchResults({
  results,
  metrics,
  isLoading = false,
  onTableSelect,
  onFacetFilter,
  currentPage,
  onPageChange,
  totalPages,
  searchQuery
}: EnhancedSearchResultsProps) {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const getQualityScoreColor = (score?: number) => {
    if (!score) return "bg-gray-200";
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-blue-500";
    if (score >= 70) return "bg-yellow-500";
    if (score >= 60) return "bg-orange-500";
    return "bg-red-500";
  };

  const getQualityScoreLabel = (score?: number) => {
    if (!score) return "Unknown";
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Fair";
    if (score >= 60) return "Poor";
    return "Critical";
  };

  const highlightMatch = (text: string, query?: string) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "—";
    return num.toLocaleString();
  };

  const formatDate = (date?: Date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Searching data catalog...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Metrics Header */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Hash className="w-4 h-4" />
            <span><strong>{metrics.totalResults.toLocaleString()}</strong> results</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>in <strong>{metrics.searchTime}ms</strong></span>
          </div>
          {searchQuery && (
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>for "<strong>{searchQuery}</strong>"</span>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search Facets Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Sources Facet */}
          {metrics.facets.sources.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Database className="w-4 h-4" />
                  <span>Data Sources</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {metrics.facets.sources.slice(0, 5).map((source) => (
                  <button
                    key={source.name}
                    className="w-full flex items-center justify-between text-left p-2 rounded hover:bg-gray-50 text-sm"
                    onClick={() => onFacetFilter('source', source.name)}
                  >
                    <span className="truncate">{source.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {source.count}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quality Score Distribution */}
          {metrics.facets.qualityScores.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Quality Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {metrics.facets.qualityScores.map((score) => (
                  <button
                    key={score.range}
                    className="w-full flex items-center justify-between text-left p-2 rounded hover:bg-gray-50 text-sm"
                    onClick={() => onFacetFilter('quality', score.range)}
                  >
                    <span className="truncate">{score.range}</span>
                    <Badge variant="secondary" className="ml-2">
                      {score.count}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Schema Facet */}
          {metrics.facets.schemas.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Schemas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {metrics.facets.schemas.slice(0, 5).map((schema) => (
                  <button
                    key={schema.name}
                    className="w-full flex items-center justify-between text-left p-2 rounded hover:bg-gray-50 text-sm"
                    onClick={() => onFacetFilter('schema', schema.name)}
                  >
                    <span className="truncate">{schema.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {schema.count}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search Results</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Table</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead>Relevance</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {highlightMatch(result.name, searchQuery)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {highlightMatch(result.fullName, searchQuery)}
                          </div>
                          {result.description && (
                            <div className="text-xs text-gray-600 max-w-xs truncate">
                              {highlightMatch(result.description, searchQuery)}
                            </div>
                          )}
                          {result.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {result.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {highlightMatch(tag, searchQuery)}
                                </Badge>
                              ))}
                              {result.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{result.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                          {result.matchedFields.length > 0 && (
                            <div className="text-xs text-blue-600">
                              Matches: {result.matchedFields.join(', ')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Database className="w-3 h-3 text-gray-500" />
                            <span className="text-sm font-medium">{result.sourceName}</span>
                          </div>
                          <div className="text-xs text-gray-500">{result.sourceType}</div>
                          <div className="text-xs text-gray-500">{result.schema}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${getQualityScoreColor(result.qualityScore)}`}></div>
                            <span className="text-sm">{result.qualityScore || '—'}%</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getQualityScoreLabel(result.qualityScore)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatNumber(result.rowCount)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatNumber(result.fieldCount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress
                            value={result.relevanceScore * 100}
                            className="w-16 h-2"
                          />
                          <span className="text-xs text-gray-500">
                            {Math.round(result.relevanceScore * 100)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTableSelect(result.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {results.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No results found</p>
                    <p className="text-sm">Try adjusting your search criteria or filters</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}