import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  Database, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Lightbulb,
  Zap,
  Eye,
  Timer
} from "lucide-react";

interface QueryMetrics {
  queryId: string;
  executionTime: number;
  rowsReturned: number;
  rowsScanned: number;
  memoryUsage: number;
  cpuTime: number;
  ioOperations: number;
  cacheHits: number;
  indexesUsed: string[];
  warnings: string[];
  suggestions: string[];
}

interface QueryPlan {
  nodeType: string;
  operation: string;
  cost: number;
  rows: number;
  width: number;
  actualTime: number;
  actualRows: number;
  actualLoops: number;
  children?: QueryPlan[];
  indexName?: string;
  filter?: string;
  joinType?: string;
}

interface PerformanceData {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: QueryMetrics;
  suggestions: string[];
  executionPlan?: QueryPlan;
}

interface PerformanceMonitorProps {
  performanceData: PerformanceData | null;
  isVisible: boolean;
  onToggle: () => void;
}

export default function PerformanceMonitor({ performanceData, isVisible, onToggle }: PerformanceMonitorProps) {
  const [activeTab, setActiveTab] = useState("metrics");

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="text-xs h-8 px-3"
        title="Show Performance Monitor"
      >
        <BarChart3 className="w-3 h-3 mr-1" />
        Performance
      </Button>
    );
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-50 border-green-200';
      case 'B': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'D': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'F': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes.toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} GB`;
  };

  const renderExecutionPlan = (plan: QueryPlan, depth = 0) => {
    const indent = depth * 20;
    
    return (
      <div key={`${plan.nodeType}-${depth}`} className="mb-2">
        <div 
          className="flex items-center space-x-2 py-2 px-3 bg-gray-50 rounded border text-sm"
          style={{ marginLeft: indent }}
        >
          <div className="flex-1">
            <div className="font-medium">{plan.nodeType}</div>
            <div className="text-xs text-gray-600">{plan.operation}</div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <div>Cost: {plan.cost.toFixed(2)}</div>
            <div>Rows: {plan.actualRows}</div>
            <div>Time: {plan.actualTime.toFixed(2)}ms</div>
          </div>
        </div>
        {plan.children?.map((child, index) => (
          <div key={index}>
            {renderExecutionPlan(child, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="border-t border-gray-300">
      <div className="bg-gray-100 border-b border-gray-300 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-gray-600" />
          <span className="text-xs font-medium text-gray-700">PERFORMANCE MONITOR</span>
          {performanceData && (
            <Badge className={`text-xs ${getGradeColor(performanceData.grade)}`}>
              Grade {performanceData.grade}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="text-xs h-6 px-2"
        >
          <XCircle className="w-3 h-3" />
        </Button>
      </div>

      <div className="p-3 max-h-96 overflow-y-auto">
        {!performanceData ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Execute a query to see performance metrics</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 text-xs h-8">
              <TabsTrigger value="metrics" className="text-xs">Metrics</TabsTrigger>
              <TabsTrigger value="suggestions" className="text-xs">Tips</TabsTrigger>
              <TabsTrigger value="plan" className="text-xs">Plan</TabsTrigger>
              <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Timer className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium">Execution Time</span>
                    </div>
                    <span className="text-sm font-bold">{formatTime(performanceData.metrics.executionTime)}</span>
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-medium">Rows Returned</span>
                    </div>
                    <span className="text-sm font-bold">{performanceData.metrics.rowsReturned.toLocaleString()}</span>
                  </div>
                </Card>

                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-medium">Rows Scanned</span>
                    </div>
                    <span className="text-sm font-bold">{performanceData.metrics.rowsScanned.toLocaleString()}</span>
                  </div>
                </Card>

                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-medium">Memory Usage</span>
                    </div>
                    <span className="text-sm font-bold">{formatBytes(performanceData.metrics.memoryUsage)}</span>
                  </div>
                </Card>
              </div>

              {/* Efficiency Ratio */}
              <Card className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Scan Efficiency</span>
                  <span className="text-xs text-gray-500">
                    {Math.round((performanceData.metrics.rowsReturned / performanceData.metrics.rowsScanned) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(performanceData.metrics.rowsReturned / performanceData.metrics.rowsScanned) * 100} 
                  className="h-2"
                />
              </Card>

              {/* Indexes Used */}
              {performanceData.metrics.indexesUsed.length > 0 && (
                <Card className="p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-medium">Indexes Used</span>
                  </div>
                  <div className="space-y-1">
                    {performanceData.metrics.indexesUsed.map((index, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {index}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="suggestions" className="mt-3 space-y-2">
              {performanceData.suggestions.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">Query looks optimized! No suggestions at this time.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {performanceData.suggestions.map((suggestion, index) => (
                    <Card key={index} className="p-3 border-l-4 border-l-yellow-400">
                      <div className="flex items-start space-x-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-700">{suggestion}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {performanceData.metrics.warnings.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Warnings
                  </h4>
                  <div className="space-y-2">
                    {performanceData.metrics.warnings.map((warning, index) => (
                      <Card key={index} className="p-3 border-l-4 border-l-red-400">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-700">{warning}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="plan" className="mt-3">
              {performanceData.executionPlan ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium">Query Execution Plan</span>
                  </div>
                  {renderExecutionPlan(performanceData.executionPlan)}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Execution plan not available</p>
                  <p className="text-xs text-gray-400">Run query with EXPLAIN option to see plan</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-3">
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Query history coming soon</p>
                <p className="text-xs text-gray-400">Track performance trends over time</p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}