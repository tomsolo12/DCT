import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Database, ExternalLink, GitBranch, Loader2, Plus, Trash2, BarChart3, FileText, Monitor, RefreshCw, Settings, Link, Network, Target, Eye, MapPin } from "lucide-react";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";
import { api } from "@/lib/api";

interface BiConnection {
  id: number;
  name: string;
  type: string;
  connectionString: string;
  workspaceId?: string;
  isActive: boolean;
  lastSync?: string;
  createdAt: string;
}

interface BiAsset {
  id: number;
  biConnectionId: number;
  assetId: string;
  name: string;
  type: string;
  description?: string;
  createdBy?: string;
  lastModified?: string;
  metadata?: any;
}

interface LineageGraph {
  nodes: Array<{ id: string; type: string; label: string; metadata: any }>;
  edges: Array<{ source: string; target: string; type: string; confidence: number }>;
}

export default function BiIntegration() {
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const [isLineageDialogOpen, setIsLineageDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<BiConnection | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<BiAsset | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lineageGraphData, setLineageGraphData] = useState<LineageGraph | null>(null);
  
  const [newConnection, setNewConnection] = useState({
    name: "",
    type: "powerbi",
    connectionString: "",
    workspaceId: "",
  });

  const queryClient = useQueryClient();

  // Mock data for demonstration (in production, these would come from real APIs)
  const mockConnections: BiConnection[] = [
    {
      id: 1,
      name: "Production Power BI",
      type: "powerbi",
      connectionString: "powerbi://app.powerbi.com/workspaces/...",
      workspaceId: "12345678-1234-1234-1234-123456789012",
      isActive: true,
      lastSync: "2 hours ago",
      createdAt: "2024-01-15T08:00:00Z",
    },
    {
      id: 2,
      name: "Analytics Tableau Server",
      type: "tableau",
      connectionString: "https://tableau.company.com/",
      isActive: true,
      lastSync: "1 day ago", 
      createdAt: "2024-01-10T09:30:00Z",
    },
    {
      id: 3,
      name: "Dev Power BI Workspace",
      type: "powerbi",
      connectionString: "powerbi://app.powerbi.com/workspaces/...",
      workspaceId: "87654321-4321-4321-4321-210987654321",
      isActive: false,
      lastSync: "5 days ago",
      createdAt: "2024-01-05T14:15:00Z",
    },
  ];

  const mockAssets: BiAsset[] = [
    {
      id: 1,
      biConnectionId: 1,
      assetId: "report-001",
      name: "Sales Performance Dashboard",
      type: "report",
      description: "Monthly sales performance metrics across all regions",
      createdBy: "john.smith@company.com",
      lastModified: "2024-01-20T10:30:00Z",
      metadata: { pages: 5, visuals: 12, datasetId: "ds-001" },
    },
    {
      id: 2,
      biConnectionId: 1,
      assetId: "dataset-001",
      name: "Customer Analytics Dataset",
      type: "dataset",
      description: "Consolidated customer data with demographics and behavior",
      createdBy: "sarah.jones@company.com",
      lastModified: "2024-01-19T14:45:00Z",
      metadata: { tables: 8, rowCount: 2500000, refreshFrequency: "daily" },
    },
    {
      id: 3,
      biConnectionId: 2,
      assetId: "workbook-001",
      name: "Financial Analysis Workbook",
      type: "workbook",
      description: "Comprehensive financial reporting and analysis",
      createdBy: "mike.davis@company.com",
      lastModified: "2024-01-18T16:20:00Z",
      metadata: { sheets: 6, dataConnections: 3, size: "45MB" },
    },
  ];

  const mockLineageGraph: LineageGraph = {
    nodes: [
      { id: "db-customers", type: "table", label: "customers", metadata: { source: "PostgreSQL" } },
      { id: "db-orders", type: "table", label: "orders", metadata: { source: "PostgreSQL" } },
      { id: "ds-001", type: "dataset", label: "Customer Analytics Dataset", metadata: { tool: "Power BI" } },
      { id: "report-001", type: "report", label: "Sales Performance Dashboard", metadata: { tool: "Power BI" } },
      { id: "workbook-001", type: "workbook", label: "Financial Analysis Workbook", metadata: { tool: "Tableau" } },
    ],
    edges: [
      { source: "db-customers", target: "ds-001", type: "feeds", confidence: 0.95 },
      { source: "db-orders", target: "ds-001", type: "feeds", confidence: 0.90 },
      { source: "ds-001", target: "report-001", type: "powers", confidence: 0.85 },
      { source: "db-orders", target: "workbook-001", type: "feeds", confidence: 0.80 },
    ],
  };

  // Mutations for connection management
  const createConnectionMutation = useMutation({
    mutationFn: (connectionData: any) => Promise.resolve({ id: Date.now(), ...connectionData }),
    onSuccess: () => {
      setIsConnectionDialogOpen(false);
      setNewConnection({ name: "", type: "powerbi", connectionString: "", workspaceId: "" });
    },
  });

  const syncAssetsMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      setIsSyncing(true);
      setSyncProgress(0);
      
      // Simulate sync progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setSyncProgress(i);
      }
      
      setIsSyncing(false);
      return { synced: 15, errors: [] };
    },
  });

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case "powerbi": return <BarChart3 className="w-4 h-4 text-yellow-600" />;
      case "tableau": return <Monitor className="w-4 h-4 text-blue-600" />;
      default: return <Database className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "report": return <FileText className="w-4 h-4 text-green-600" />;
      case "dataset": return <Database className="w-4 h-4 text-blue-600" />;
      case "workbook": return <BarChart3 className="w-4 h-4 text-purple-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleCreateConnection = () => {
    createConnectionMutation.mutate(newConnection);
  };

  const handleSyncAssets = (connectionId: number) => {
    syncAssetsMutation.mutate(connectionId);
  };

  const viewLineageGraph = (asset?: BiAsset) => {
    setSelectedAsset(asset || null);
    setLineageGraphData(mockLineageGraph);
    setIsLineageDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">BI Tool Integration</h1>
          <p className="text-sm text-gray-600">Connect and manage Power BI, Tableau, and other BI platforms</p>
        </div>
        <div className="flex items-center space-x-3">
          <PerformanceMonitor isLoading={false} />
          <Dialog open={isConnectionDialogOpen} onOpenChange={setIsConnectionDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Connection
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New BI Connection</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Connection Name</Label>
                  <Input
                    id="name"
                    value={newConnection.name}
                    onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                    placeholder="Production Power BI"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">BI Tool Type</Label>
                  <Select value={newConnection.type} onValueChange={(value) => setNewConnection({ ...newConnection, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="powerbi">Power BI</SelectItem>
                      <SelectItem value="tableau">Tableau</SelectItem>
                      <SelectItem value="looker">Looker</SelectItem>
                      <SelectItem value="qlik">QlikSense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="connectionString">Connection String</Label>
                  <Textarea
                    id="connectionString"
                    value={newConnection.connectionString}
                    onChange={(e) => setNewConnection({ ...newConnection, connectionString: e.target.value })}
                    placeholder="Enter connection string or URL"
                    rows={3}
                  />
                </div>
                {newConnection.type === "powerbi" && (
                  <div className="space-y-2">
                    <Label htmlFor="workspaceId">Workspace ID (optional)</Label>
                    <Input
                      id="workspaceId"
                      value={newConnection.workspaceId}
                      onChange={(e) => setNewConnection({ ...newConnection, workspaceId: e.target.value })}
                      placeholder="12345678-1234-1234-1234-123456789012"
                    />
                  </div>
                )}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsConnectionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateConnection} disabled={createConnectionMutation.isPending}>
                    {createConnectionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Connection
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <Tabs defaultValue="connections" className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="assets">BI Assets</TabsTrigger>
            <TabsTrigger value="lineage">Data Lineage</TabsTrigger>
            <TabsTrigger value="mapping">Lineage Mapping</TabsTrigger>
          </TabsList>

          {/* Connections Tab */}
          <TabsContent value="connections" className="mt-6">
            <div className="grid gap-4">
              {mockConnections.map((connection) => (
                <Card key={connection.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getConnectionIcon(connection.type)}
                        <div>
                          <CardTitle className="text-lg">{connection.name}</CardTitle>
                          <CardDescription className="flex items-center space-x-2">
                            <Badge variant={connection.isActive ? "default" : "secondary"}>
                              {connection.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <span>•</span>
                            <span>Last sync: {connection.lastSync}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleSyncAssets(connection.id)}>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Sync
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Connection Type:</span>
                        <span className="font-medium capitalize">{connection.type}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Workspace ID:</span>
                        <span className="font-mono text-xs">{connection.workspaceId || "N/A"}</span>
                      </div>
                      {isSyncing && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Syncing assets...</span>
                            <span>{syncProgress}%</span>
                          </div>
                          <Progress value={syncProgress} className="h-2" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* BI Assets Tab */}
          <TabsContent value="assets" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">BI Assets</h3>
                  <p className="text-sm text-gray-600">Reports, datasets, and workbooks from connected BI tools</p>
                </div>
                <Button variant="outline" onClick={() => viewLineageGraph()}>
                  <Network className="w-4 h-4 mr-2" />
                  View Lineage Graph
                </Button>
              </div>
              
              <div className="grid gap-4">
                {mockAssets.map((asset) => (
                  <Card key={asset.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getAssetIcon(asset.type)}
                          <div>
                            <CardTitle className="text-base">{asset.name}</CardTitle>
                            <CardDescription>{asset.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => viewLineageGraph(asset)}>
                            <GitBranch className="w-4 h-4 mr-1" />
                            Lineage
                          </Button>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <span className="ml-2 font-medium capitalize">{asset.type}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Created by:</span>
                          <span className="ml-2 font-medium">{asset.createdBy}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Last modified:</span>
                          <span className="ml-2 font-medium">{new Date(asset.lastModified!).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Asset ID:</span>
                          <span className="ml-2 font-mono text-xs">{asset.assetId}</span>
                        </div>
                      </div>
                      {asset.metadata && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(asset.metadata).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Data Lineage Tab */}
          <TabsContent value="lineage" className="mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Data Lineage Overview</h3>
                <p className="text-sm text-gray-600">Track data flow from sources to BI assets</p>
              </div>
              
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Network className="w-5 h-5 mr-2" />
                      Lineage Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">12</div>
                        <div className="text-sm text-gray-600">Data Sources</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">34</div>
                        <div className="text-sm text-gray-600">Tables</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">18</div>
                        <div className="text-sm text-gray-600">BI Assets</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">56</div>
                        <div className="text-sm text-gray-600">Connections</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Lineage Updates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { asset: "Sales Performance Dashboard", source: "customers table", type: "mapping added", time: "2 hours ago" },
                        { asset: "Customer Analytics Dataset", source: "orders table", type: "mapping updated", time: "4 hours ago" },
                        { asset: "Financial Analysis Workbook", source: "transactions table", type: "mapping verified", time: "1 day ago" },
                      ].map((update, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div>
                              <div className="font-medium">{update.asset}</div>
                              <div className="text-sm text-gray-600">{update.source} • {update.type}</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">{update.time}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Lineage Mapping Tab */}
          <TabsContent value="mapping" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Lineage Mapping</h3>
                  <p className="text-sm text-gray-600">Create and manage data lineage mappings between sources and BI assets</p>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <MapPin className="w-4 h-4 mr-2" />
                  Create Mapping
                </Button>
              </div>

              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Mapping Configuration</CardTitle>
                    <CardDescription>Configure how data flows from sources to BI assets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Source Table</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source table" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customers">customers</SelectItem>
                              <SelectItem value="orders">orders</SelectItem>
                              <SelectItem value="products">products</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Target BI Asset</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select BI asset" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="report-001">Sales Performance Dashboard</SelectItem>
                              <SelectItem value="dataset-001">Customer Analytics Dataset</SelectItem>
                              <SelectItem value="workbook-001">Financial Analysis Workbook</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Mapping Type</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mapping type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="direct">Direct Feed</SelectItem>
                            <SelectItem value="transformed">Transformed</SelectItem>
                            <SelectItem value="aggregated">Aggregated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Confidence Level</Label>
                        <div className="flex items-center space-x-4">
                          <input type="range" min="0" max="100" defaultValue="85" className="flex-1" />
                          <span className="text-sm font-medium">85%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Existing Mappings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockLineageGraph.edges.map((edge, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <Database className="w-4 h-4 text-blue-600" />
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{edge.source}</span>
                              <span className="text-gray-400">→</span>
                              <span className="font-medium">{edge.target}</span>
                            </div>
                            <Badge variant="outline">{edge.type}</Badge>
                            <Badge variant="secondary">{Math.round(edge.confidence * 100)}% confidence</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Lineage Graph Dialog */}
      <Dialog open={isLineageDialogOpen} onOpenChange={setIsLineageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedAsset ? `Lineage for ${selectedAsset.name}` : "Data Lineage Graph"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-4">
            {lineageGraphData && (
              <div className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Lineage Graph</h3>
                  <p className="text-gray-600 mb-4">Visual representation of data flow from sources to BI assets</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Nodes:</strong> {lineageGraphData.nodes.length}
                    </div>
                    <div>
                      <strong>Connections:</strong> {lineageGraphData.edges.length}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Source Tables</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {lineageGraphData.nodes.filter(n => n.type === 'table').map(node => (
                          <div key={node.id} className="flex items-center space-x-2">
                            <Database className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{node.label}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">BI Assets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {lineageGraphData.nodes.filter(n => n.type !== 'table').map(node => (
                          <div key={node.id} className="flex items-center space-x-2">
                            {getAssetIcon(node.type)}
                            <span className="font-medium">{node.label}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}