import { useState, useEffect } from "react";
import { Search, Filter, X, ChevronDown, Tag, Calendar, BarChart3, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SearchFilters {
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

interface SearchSuggestion {
  type: 'table' | 'field' | 'tag' | 'business_term';
  value: string;
  category: string;
  frequency: number;
}

interface AdvancedSearchProps {
  onFiltersChange: (filters: SearchFilters) => void;
  sources: any[];
  schemas: string[];
  popularTags: string[];
  isLoading?: boolean;
}

export default function AdvancedSearch({ 
  onFiltersChange, 
  sources, 
  schemas, 
  popularTags,
  isLoading = false 
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [qualityScore, setQualityScore] = useState<[number, number]>([0, 100]);
  const [rowCountRange, setRowCountRange] = useState<[number, number]>([0, 1000000]);

  // Debounced search suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        try {
          const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=10`);
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
        }
      } else {
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update filters when search query changes
  useEffect(() => {
    const newFilters = { ...filters, query: searchQuery || undefined };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  }, [searchQuery]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSourceToggle = (sourceId: number, checked: boolean) => {
    const currentSources = filters.sourceIds || [];
    const newSources = checked 
      ? [...currentSources, sourceId]
      : currentSources.filter(id => id !== sourceId);
    
    handleFilterChange('sourceIds', newSources.length > 0 ? newSources : undefined);
  };

  const handleSchemaToggle = (schema: string, checked: boolean) => {
    const currentSchemas = filters.schemas || [];
    const newSchemas = checked 
      ? [...currentSchemas, schema]
      : currentSchemas.filter(s => s !== schema);
    
    handleFilterChange('schemas', newSchemas.length > 0 ? newSchemas : undefined);
  };

  const handleTagToggle = (tag: string, checked: boolean) => {
    const currentTags = filters.tags || [];
    const newTags = checked 
      ? [...currentTags, tag]
      : currentTags.filter(t => t !== tag);
    
    handleFilterChange('tags', newTags.length > 0 ? newTags : undefined);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.value);
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
    setQualityScore([0, 100]);
    setRowCountRange([0, 1000000]);
    onFiltersChange({});
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.sourceIds?.length) count++;
    if (filters.schemas?.length) count++;
    if (filters.tags?.length) count++;
    if (filters.hasBusinessTerms) count++;
    if (filters.hasDescription) count++;
    if (filters.qualityScoreRange && (filters.qualityScoreRange[0] > 0 || filters.qualityScoreRange[1] < 100)) count++;
    if (filters.rowCountRange && (filters.rowCountRange[0] > 0 || filters.rowCountRange[1] < 1000000)) count++;
    return count;
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              placeholder="Search tables, fields, descriptions, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10"
              disabled={isLoading}
            />
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center space-x-2">
                      {suggestion.type === 'table' && <Layers className="w-4 h-4 text-blue-500" />}
                      {suggestion.type === 'field' && <BarChart3 className="w-4 h-4 text-green-500" />}
                      {suggestion.type === 'tag' && <Tag className="w-4 h-4 text-purple-500" />}
                      <span className="text-sm font-medium">{suggestion.value}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{suggestion.category}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Button
            variant={showAdvanced ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-1"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-1 px-1 min-w-[1.2rem] h-5">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
          
          {getActiveFilterCount() > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              Advanced Filters
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Data Sources */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <Layers className="w-4 h-4" />
                  <span>Data Sources</span>
                </Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {sources.map((source) => (
                    <div key={source.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`source-${source.id}`}
                        checked={filters.sourceIds?.includes(source.id) || false}
                        onCheckedChange={(checked) => handleSourceToggle(source.id, checked as boolean)}
                      />
                      <Label htmlFor={`source-${source.id}`} className="text-sm cursor-pointer">
                        {source.name} ({source.type})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schemas */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <Layers className="w-4 h-4" />
                  <span>Schemas</span>
                </Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {schemas.map((schema) => (
                    <div key={schema} className="flex items-center space-x-2">
                      <Checkbox
                        id={`schema-${schema}`}
                        checked={filters.schemas?.includes(schema) || false}
                        onCheckedChange={(checked) => handleSchemaToggle(schema, checked as boolean)}
                      />
                      <Label htmlFor={`schema-${schema}`} className="text-sm cursor-pointer">
                        {schema}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular Tags */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <Tag className="w-4 h-4" />
                  <span>Tags</span>
                </Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {popularTags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={filters.tags?.includes(tag) || false}
                        onCheckedChange={(checked) => handleTagToggle(tag, checked as boolean)}
                      />
                      <Label htmlFor={`tag-${tag}`} className="text-sm cursor-pointer">
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Quality and Metadata Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Quality Score Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Quality Score Range</span>
                </Label>
                <div className="space-y-2">
                  <Slider
                    value={qualityScore}
                    onValueChange={(value) => {
                      setQualityScore(value as [number, number]);
                      handleFilterChange('qualityScoreRange', value);
                    }}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{qualityScore[0]}%</span>
                    <span>{qualityScore[1]}%</span>
                  </div>
                </div>
              </div>

              {/* Row Count Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Row Count Range</span>
                </Label>
                <div className="space-y-2">
                  <Slider
                    value={rowCountRange}
                    onValueChange={(value) => {
                      setRowCountRange(value as [number, number]);
                      handleFilterChange('rowCountRange', value);
                    }}
                    max={1000000}
                    min={0}
                    step={10000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{rowCountRange[0].toLocaleString()}</span>
                    <span>{rowCountRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Metadata Filters */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Metadata Requirements</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-description"
                    checked={filters.hasDescription || false}
                    onCheckedChange={(checked) => handleFilterChange('hasDescription', checked)}
                  />
                  <Label htmlFor="has-description" className="text-sm cursor-pointer">
                    Has Description
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-business-terms"
                    checked={filters.hasBusinessTerms || false}
                    onCheckedChange={(checked) => handleFilterChange('hasBusinessTerms', checked)}
                  />
                  <Label htmlFor="has-business-terms" className="text-sm cursor-pointer">
                    Has Business Terms
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}