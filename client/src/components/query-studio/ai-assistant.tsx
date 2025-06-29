import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Send, Sparkles, Code, Database, TrendingUp, Filter, Copy, Plus } from "lucide-react";

interface AiAssistantProps {
  onQuerySuggestion: (query: string) => void;
  currentQuery: string;
  selectedSourceId?: string;
  tables?: any[];
  onClose?: () => void;
}

interface QuerySuggestion {
  id: string;
  title: string;
  description: string;
  query: string;
  category: 'analysis' | 'filter' | 'join' | 'aggregate' | 'optimization';
  complexity: 'beginner' | 'intermediate' | 'advanced';
}

const mockSuggestions: QuerySuggestion[] = [
  {
    id: '1',
    title: 'Customer Transaction Summary',
    description: 'Get total transactions and amount per customer',
    category: 'analysis',
    complexity: 'beginner',
    query: `SELECT 
    c.customer_id,
    c.first_name,
    c.last_name,
    COUNT(t.transaction_id) as total_transactions,
    SUM(t.amount) as total_amount,
    AVG(t.amount) as avg_transaction_amount
FROM customers c
LEFT JOIN transactions t ON c.customer_id = t.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name
ORDER BY total_amount DESC;`
  },
  {
    id: '2',
    title: 'Monthly Revenue Trend',
    description: 'Analyze revenue trends by month',
    category: 'analysis',
    complexity: 'intermediate',
    query: `SELECT 
    DATE_TRUNC('month', transaction_date) as month,
    COUNT(*) as transaction_count,
    SUM(amount) as monthly_revenue,
    AVG(amount) as avg_transaction_value
FROM transactions
WHERE transaction_date >= '2024-01-01'
GROUP BY DATE_TRUNC('month', transaction_date)
ORDER BY month;`
  },
  {
    id: '3',
    title: 'Top Performing Customers',
    description: 'Find customers with highest transaction values',
    category: 'filter',
    complexity: 'beginner',
    query: `SELECT 
    c.customer_id,
    c.first_name,
    c.last_name,
    c.email,
    SUM(t.amount) as total_spent
FROM customers c
INNER JOIN transactions t ON c.customer_id = t.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name, c.email
HAVING SUM(t.amount) > 1000
ORDER BY total_spent DESC
LIMIT 20;`
  },
  {
    id: '4',
    title: 'Customer Segmentation',
    description: 'Segment customers by transaction frequency and value',
    category: 'analysis',
    complexity: 'advanced',
    query: `WITH customer_metrics AS (
    SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        COUNT(t.transaction_id) as transaction_count,
        SUM(t.amount) as total_value,
        AVG(t.amount) as avg_value
    FROM customers c
    LEFT JOIN transactions t ON c.customer_id = t.customer_id
    GROUP BY c.customer_id, c.first_name, c.last_name
)
SELECT 
    *,
    CASE 
        WHEN transaction_count >= 20 AND total_value >= 2000 THEN 'VIP'
        WHEN transaction_count >= 10 AND total_value >= 1000 THEN 'Premium'
        WHEN transaction_count >= 5 THEN 'Regular'
        ELSE 'New'
    END as customer_segment
FROM customer_metrics
ORDER BY total_value DESC;`
  }
];

const categoryIcons = {
  analysis: TrendingUp,
  filter: Filter,
  join: Database,
  aggregate: Code,
  optimization: Sparkles
};

const categoryColors = {
  analysis: 'bg-blue-100 text-blue-800',
  filter: 'bg-green-100 text-green-800',
  join: 'bg-purple-100 text-purple-800',
  aggregate: 'bg-orange-100 text-orange-800',
  optimization: 'bg-pink-100 text-pink-800'
};

const complexityColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800'
};

export default function AiAssistant({ onQuerySuggestion, currentQuery, selectedSourceId, tables }: AiAssistantProps) {
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("");
  const [suggestions, setSuggestions] = useState<QuerySuggestion[]>(mockSuggestions);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = ['all', 'analysis', 'filter', 'join', 'aggregate', 'optimization'];

  const handleNaturalLanguageQuery = async () => {
    if (!naturalLanguageInput.trim()) return;
    
    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const generatedQuery = generateQueryFromNaturalLanguage(naturalLanguageInput);
      onQuerySuggestion(generatedQuery);
      setNaturalLanguageInput("");
      setIsProcessing(false);
    }, 1500);
  };

  const generateQueryFromNaturalLanguage = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('total') && lowerInput.includes('customer')) {
      return `-- Generated from: "${input}"
SELECT 
    c.customer_id,
    c.first_name,
    c.last_name,
    COUNT(t.transaction_id) as total_transactions,
    SUM(t.amount) as total_amount
FROM customers c
LEFT JOIN transactions t ON c.customer_id = t.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name
ORDER BY total_amount DESC;`;
    }
    
    if (lowerInput.includes('monthly') && (lowerInput.includes('revenue') || lowerInput.includes('sales'))) {
      return `-- Generated from: "${input}"
SELECT 
    DATE_TRUNC('month', transaction_date) as month,
    SUM(amount) as monthly_revenue
FROM transactions
GROUP BY DATE_TRUNC('month', transaction_date)
ORDER BY month;`;
    }
    
    if (lowerInput.includes('top') && lowerInput.includes('customers')) {
      return `-- Generated from: "${input}"
SELECT 
    c.customer_id,
    c.first_name,
    c.last_name,
    SUM(t.amount) as total_spent
FROM customers c
INNER JOIN transactions t ON c.customer_id = t.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name
ORDER BY total_spent DESC
LIMIT 10;`;
    }
    
    // Default query structure
    return `-- Generated from: "${input}"
SELECT *
FROM customers
WHERE /* Add your conditions based on: ${input} */
LIMIT 100;`;
  };

  const filteredSuggestions = selectedCategory === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === selectedCategory);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNaturalLanguageQuery();
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-300 flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">AI Query Assistant</h3>
          <Sparkles className="w-4 h-4 text-purple-500" />
        </div>
        
        {/* Natural Language Input */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={naturalLanguageInput}
              onChange={(e) => setNaturalLanguageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe what you want to query..."
              className="flex-1 text-sm"
              disabled={isProcessing}
            />
            <Button 
              size="sm" 
              onClick={handleNaturalLanguageQuery}
              disabled={!naturalLanguageInput.trim() || isProcessing}
              className="px-3"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Try: "Show total revenue by customer" or "Find top 10 customers"
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              className="text-xs h-6 px-2 capitalize"
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All' : category}
            </Button>
          ))}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-3">
          {filteredSuggestions.map((suggestion) => {
            const CategoryIcon = categoryIcons[suggestion.category];
            
            return (
              <Card key={suggestion.id} className="border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium text-gray-900 mb-1">
                        {suggestion.title}
                      </CardTitle>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {suggestion.description}
                      </p>
                    </div>
                    <CategoryIcon className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline" className={`text-xs ${categoryColors[suggestion.category]}`}>
                      {suggestion.category}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${complexityColors[suggestion.complexity]}`}>
                      {suggestion.complexity}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs h-7"
                      onClick={() => onQuerySuggestion(suggestion.query)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Use Query
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 px-2"
                      onClick={() => navigator.clipboard.writeText(suggestion.query)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Context Info */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center justify-between">
            <span>Connected Source:</span>
            <span className="font-medium">{selectedSourceId ? `Database ${selectedSourceId}` : 'None'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Available Tables:</span>
            <span className="font-medium">{tables?.length || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Query Length:</span>
            <span className="font-medium">{currentQuery.length} chars</span>
          </div>
        </div>
      </div>
    </div>
  );
}