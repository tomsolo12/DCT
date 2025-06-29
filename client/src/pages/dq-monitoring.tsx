import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Plus, Play, Pause, Settings, AlertTriangle, CheckCircle, Clock, Filter } from "lucide-react";
import { RuleBuilder } from "@/components/data-quality/rule-builder";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";

export default function DQMonitoring() {
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTable, setFilterTable] = useState<string>('all');
  const [isRunningRules, setIsRunningRules] = useState(false);
  
  const queryClient = useQueryClient();
  
  const { data: rules, isLoading, error } = useQuery({
    queryKey: ["/api/data-quality-rules"],
    queryFn: () => api.getDataQualityRules(),
  });

  const { data: dataSources } = useQuery({
    queryKey: ["/api/data-sources"],
    queryFn: () => api.getDataSources(),
  });

  const { data: scoreCards } = useQuery({
    queryKey: ["/api/data-quality/score-cards"],
    queryFn: () => api.post("/api/data-quality/score-cards"),
  });

  const createRuleMutation = useMutation({
    mutationFn: (ruleData: any) => api.createDataQualityRule(ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-quality-rules"] });
      setShowRuleBuilder(false);
    },
  });

  const executeRuleMutation = useMutation({
    mutationFn: (ruleId: number) => api.post(`/api/data-quality-rules/${ruleId}/execute`),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-quality-rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/data-quality-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/data-quality/score-cards"] });
      console.log('Rule execution result:', result);
    },
  });

  const executeAllRulesMutation = useMutation({
    mutationFn: () => api.post(`/api/data-quality/execute-all`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-quality-rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/data-quality-results"] });
      setIsRunningRules(false);
    },
  });

  // Enhanced mock data with more realistic scenarios
  const mockRules = [
    {
      id: 1,
      name: "Customer Email Format",
      table: "customers",
      field: "email",
      type: "Format Validation",
      expression: "email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'",
      lastRun: "2 hours ago",
      status: "pass",
      passRate: 96.5,
      failCount: 23,
      owner: "John Smith",
      severity: "high",
      enabled: true,
      schedule: "daily"
    },
    {
      id: 2,
      name: "Transaction Amount Range",
      table: "transactions",
      field: "amount",
      type: "Range Check",
      expression: "amount BETWEEN 0.01 AND 999999.99",
      lastRun: "3 hours ago",
      status: "warning",
      passRate: 89.2,
      failCount: 156,
      owner: "Sarah Johnson",
      severity: "medium",
      enabled: true,
      schedule: "hourly"
    },
    {
      id: 3,
      name: "Customer ID Non-Null",
      table: "customers",
      field: "customer_id",
      type: "Non-Null",
      expression: "customer_id IS NOT NULL",
      lastRun: "1 hour ago",
      status: "pass",
      passRate: 100,
      failCount: 0,
      owner: "Mike Davis",
      severity: "critical",
      enabled: true,
      schedule: "real-time"
    },
    {
      id: 4,
      name: "Phone Number Format",
      table: "customers",
      field: "phone",
      type: "Format Validation",
      expression: "phone ~ '^\\+?1?[0-9]{10,15}$'",
      lastRun: "4 hours ago",
      status: "fail",
      passRate: 76.3,
      failCount: 543,
      owner: "Lisa Chen",
      severity: "low",
      enabled: false,
      schedule: "weekly"
    },
    {
      id: 5,
      name: "Order Date Validity",
      table: "orders",
      field: "order_date",
      type: "Date Range",
      expression: "order_date BETWEEN '2020-01-01' AND CURRENT_DATE",
      lastRun: "30 minutes ago",
      status: "warning",
      passRate: 92.1,
      failCount: 89,
      owner: "Tom Wilson",
      severity: "medium",
      enabled: true,
      schedule: "daily"
    }
  ];

  const getStatusBadge = (status: string, passRate: number) => {
    switch (status) {
      case "pass":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Pass</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      case "fail":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Fail</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Unknown</Badge>;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-600";
      case "high": return "text-orange-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  const filteredRules = mockRules.filter(rule => {
    if (filterStatus !== 'all' && rule.status !== filterStatus) return false;
    if (filterTable !== 'all' && rule.table !== filterTable) return false;
    return true;
  });

  const runAllRules = async () => {
    setIsRunningRules(true);
    executeAllRulesMutation.mutate();
  };

  const handleSaveRule = (ruleData: any) => {
    createRuleMutation.mutate(ruleData);
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <ErrorDisplay 
          error={error as Error}
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["/api/data-quality-rules"] })}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Data Quality Monitoring</h1>
          <p className="text-sm text-gray-600">Monitor and manage data quality rules across all sources</p>
        </div>
        <div className="flex items-center space-x-3">
          <PerformanceMonitor 
            isLoading={isLoading || isRunningRules}
            startTime={isRunningRules ? Date.now() : undefined}
          />
          <Button 
            onClick={runAllRules} 
            disabled={isRunningRules}
            variant="outline"
          >
            <Play className="w-4 h-4 mr-2" />
            {isRunningRules ? 'Running...' : 'Run All Rules'}
          </Button>
          <Button onClick={() => setShowRuleBuilder(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <div className="border-b">
          <TabsList className="h-auto p-0">
            <TabsTrigger value="overview" className="px-6 py-3">Overview</TabsTrigger>
            <TabsTrigger value="rules" className="px-6 py-3">Rules Management</TabsTrigger>
            <TabsTrigger value="results" className="px-6 py-3">Execution Results</TabsTrigger>
            <TabsTrigger value="analytics" className="px-6 py-3">Analytics</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="flex-1 p-6 space-y-6">
          {/* Quality Score Cards */}
          {scoreCards && scoreCards.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Table Quality Scores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scoreCards.map((card: any) => (
                  <Card key={card.tableId} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{card.tableName}</CardTitle>
                      <CardDescription className="text-xs">{card.sourceName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-green-600">{card.overallScore}%</span>
                        <Badge variant={card.overallScore >= 90 ? "default" : card.overallScore >= 70 ? "secondary" : "destructive"}>
                          {card.overallScore >= 90 ? "Excellent" : card.overallScore >= 70 ? "Good" : "Needs Attention"}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Rules: {card.passedRules}/{card.ruleCount}</div>
                        <div>Last executed: {card.lastExecuted ? new Date(card.lastExecuted).toLocaleDateString() : 'Never'}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Quality Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredRules.length}</div>
                <div className="text-xs text-gray-600">
                  {mockRules.filter(r => r.enabled).length} active
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Pass Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(mockRules.reduce((acc, rule) => acc + rule.passRate, 0) / mockRules.length).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">across all rules</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {mockRules.reduce((acc, rule) => acc + rule.failCount, 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">need attention</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {mockRules.filter(r => r.severity === 'critical' && r.status !== 'pass').length}
                </div>
                <div className="text-xs text-gray-600">require immediate action</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Rule Executions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Rule Executions</CardTitle>
              <CardDescription>Latest data quality rule execution results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRules.slice(0, 5).map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(rule.status, rule.passRate)}
                      <div>
                        <div className="font-medium text-sm">{rule.name}</div>
                        <div className="text-xs text-gray-600">{rule.table}.{rule.field}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{rule.passRate}% pass rate</div>
                      <div className="text-xs text-gray-600">{rule.lastRun}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="flex-1 p-6 space-y-4">
          {/* Filter Controls */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="fail">Fail</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTable} onValueChange={setFilterTable}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                <SelectItem value="customers">customers</SelectItem>
                <SelectItem value="transactions">transactions</SelectItem>
                <SelectItem value="orders">orders</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600">
              Showing {filteredRules.length} of {mockRules.length} rules
            </div>
          </div>

          {/* Rules Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-medium text-sm">Rule Name</th>
                      <th className="text-left p-4 font-medium text-sm">Table.Field</th>
                      <th className="text-left p-4 font-medium text-sm">Type</th>
                      <th className="text-left p-4 font-medium text-sm">Status</th>
                      <th className="text-left p-4 font-medium text-sm">Pass Rate</th>
                      <th className="text-left p-4 font-medium text-sm">Severity</th>
                      <th className="text-left p-4 font-medium text-sm">Last Run</th>
                      <th className="text-left p-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRules.map(rule => (
                      <tr key={rule.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="font-medium text-sm">{rule.name}</div>
                          <div className="text-xs text-gray-600">by {rule.owner}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-mono">{rule.table}.{rule.field}</div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{rule.type}</Badge>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(rule.status, rule.passRate)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Progress value={rule.passRate} className="w-16 h-2" />
                            <span className="text-sm font-medium">{rule.passRate}%</span>
                          </div>
                          {rule.failCount > 0 && (
                            <div className="text-xs text-red-600">{rule.failCount} failed</div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`text-sm font-medium ${getSeverityColor(rule.severity)}`}>
                            {rule.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600">{rule.lastRun}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => executeRuleMutation.mutate(rule.id)}
                              disabled={executeRuleMutation.isPending}
                              title="Execute Rule"
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" title="Settings">
                              <Settings className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution Results</CardTitle>
              <CardDescription>Detailed results from recent rule executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Select a rule from the Rules Management tab to view detailed execution results
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Quality Analytics</CardTitle>
              <CardDescription>Data quality trends and insights over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Analytics dashboard coming soon - will show quality trends, rule performance, and recommendations
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rule Builder Dialog */}
      <Dialog open={showRuleBuilder} onOpenChange={setShowRuleBuilder}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Data Quality Rule</DialogTitle>
          </DialogHeader>
          <RuleBuilder 
            onSave={handleSaveRule}
            onCancel={() => setShowRuleBuilder(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
