import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import ConnectionWizard from "@/components/data-sources/connection-wizard";
import EnhancedCreationDialog from "@/components/data-sources/enhanced-creation-dialog";
import { 
  Database, 
  Plus, 
  TestTube, 
  Settings, 
  Search, 
  RefreshCw, 
  Check, 
  X, 
  AlertTriangle,
  Edit,
  Trash2,
  Scan,
  Loader2
} from "lucide-react";

interface DataSourceForm {
  name: string;
  type: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  connectionString: string;
  sslEnabled: boolean;
  description: string;
  tags: string[];
  // Manual/File specific fields
  filePath?: string;
  fileName?: string;
  fileType?: string;
  sheetName?: string;
  hasHeaders?: boolean;
  delimiter?: string;
  encoding?: string;
  // Custom source fields
  customType?: string;
  apiEndpoint?: string;
  authMethod?: string;
  apiKey?: string;
  refreshInterval?: string;
  // Manual table fields
  manualSchema?: ManualTableField[];
}

interface ManualTableField {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue?: string;
  description?: string;
}

const DATA_SOURCE_TYPES = [
  // Manual/Custom Sources
  { value: "manual", label: "Manual Table", icon: "📋", category: "Manual", description: "Create custom tables with defined schemas" },
  { value: "custom", label: "Custom Source", icon: "⚙️", category: "Manual", description: "Define your own data source type" },
  
  // File-based Sources  
  { value: "excel", label: "Excel File", icon: "📊", category: "Files", description: "Connect to Excel workbooks (.xlsx, .xls)" },
  { value: "csv", label: "CSV File", icon: "📄", category: "Files", description: "Import from CSV files" },
  { value: "json", label: "JSON File", icon: "📋", category: "Files", description: "Connect to JSON data files" },
  { value: "xml", label: "XML File", icon: "📃", category: "Files", description: "Import from XML files" },
  { value: "parquet", label: "Parquet File", icon: "🗂️", category: "Files", description: "High-performance columnar storage" },
  
  // Cloud Storage
  { value: "s3", label: "Amazon S3", icon: "☁️", category: "Cloud", description: "Connect to S3 buckets" },
  { value: "azure_blob", label: "Azure Blob Storage", icon: "🔷", category: "Cloud", description: "Connect to Azure storage" },
  { value: "gcs", label: "Google Cloud Storage", icon: "☁️", category: "Cloud", description: "Connect to GCS buckets" },
  
  // Traditional Databases
  { value: "postgresql", label: "PostgreSQL", icon: "🐘", category: "Database", defaultPort: "5432" },
  { value: "mysql", label: "MySQL", icon: "🐬", category: "Database", defaultPort: "3306" },
  { value: "sqlserver", label: "SQL Server", icon: "🔷", category: "Database", defaultPort: "1433" },
  { value: "oracle", label: "Oracle", icon: "🔴", category: "Database", defaultPort: "1521" },
  { value: "sqlite", label: "SQLite", icon: "💎", category: "Database", description: "Lightweight database files" },
  
  // Data Warehouses
  { value: "snowflake", label: "Snowflake", icon: "❄️", category: "Warehouse", defaultPort: "443" },
  { value: "bigquery", label: "BigQuery", icon: "☁️", category: "Warehouse", defaultPort: "443" },
  { value: "redshift", label: "Redshift", icon: "🚀", category: "Warehouse", defaultPort: "5439" },
  { value: "databricks", label: "Databricks", icon: "🔶", category: "Warehouse", description: "Unified analytics platform" },
  
  // NoSQL Databases
  { value: "mongodb", label: "MongoDB", icon: "🍃", category: "NoSQL", defaultPort: "27017" },
  { value: "cassandra", label: "Cassandra", icon: "⚡", category: "NoSQL", defaultPort: "9042" },
  { value: "dynamodb", label: "DynamoDB", icon: "⚡", category: "NoSQL", description: "AWS NoSQL database" },
  { value: "redis", label: "Redis", icon: "🔴", category: "NoSQL", defaultPort: "6379" },
  
  // Search & Analytics
  { value: "elasticsearch", label: "Elasticsearch", icon: "🔍", category: "Search", defaultPort: "9200" },
  { value: "solr", label: "Apache Solr", icon: "☀️", category: "Search", defaultPort: "8983" },
  
  // APIs & Web Services
  { value: "rest_api", label: "REST API", icon: "🌐", category: "API", description: "Connect to REST endpoints" },
  { value: "graphql", label: "GraphQL", icon: "📊", category: "API", description: "Connect to GraphQL APIs" },
  { value: "soap", label: "SOAP Web Service", icon: "🧼", category: "API", description: "Connect to SOAP services" },
  
  // Streaming & Real-time
  { value: "kafka", label: "Apache Kafka", icon: "🌊", category: "Streaming", description: "Real-time data streams" },
  { value: "kinesis", label: "AWS Kinesis", icon: "🌊", category: "Streaming", description: "Real-time data processing" },
  { value: "pubsub", label: "Google Pub/Sub", icon: "📡", category: "Streaming", description: "Messaging and streaming" },
];

export default function DataSources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState<number | null>(null);
  const [isEnhancedDialogOpen, setIsEnhancedDialogOpen] = useState(false);
  const [scanningSource, setScanningSource] = useState<number | null>(null);
  const [isScanningAll, setIsScanningAll] = useState(false);
  
  const [formData, setFormData] = useState<DataSourceForm>({
    name: "",
    type: "",
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
    connectionString: "",
    sslEnabled: true,
    description: "",
    tags: []
  });

  const queryClient = useQueryClient();

  const { data: dataSources, isLoading } = useQuery({
    queryKey: ["/api/data-sources"],
    queryFn: () => api.getDataSources(),
  });

  const scanDataSourceMutation = useMutation({
    mutationFn: (sourceId: number) => api.scanDataSource(sourceId),
    onSuccess: (result, sourceId) => {
      console.log('Schema scan completed:', result);
      queryClient.invalidateQueries({ queryKey: ["/api/data-tables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/data-sources"] });
      setScanningSource(null);
    },
    onError: (error, sourceId) => {
      console.error('Schema scan failed:', error);
      setScanningSource(null);
    }
  });

  const scanAllSourcesMutation = useMutation({
    mutationFn: () => api.scanAllSources(),
    onSuccess: (result) => {
      console.log('Bulk schema scan completed:', result);
      queryClient.invalidateQueries({ queryKey: ["/api/data-tables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/data-sources"] });
      setIsScanningAll(false);
    },
    onError: (error) => {
      console.error('Bulk schema scan failed:', error);
      setIsScanningAll(false);
    }
  });

  const createDataSourceMutation = useMutation({
    mutationFn: (data: any) => {
      console.log("Sending data source creation request:", data);
      return api.createDataSource(data);
    },
    onSuccess: (result) => {
      console.log("Data source created successfully:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/data-sources"] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Failed to create data source:", error);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      host: "",
      port: "",
      database: "",
      username: "",
      password: "",
      connectionString: "",
      sslEnabled: true,
      description: "",
      tags: [],
      filePath: "",
      fileName: "",
      fileType: "",
      sheetName: "",
      hasHeaders: true,
      delimiter: ",",
      encoding: "utf-8",
      customType: "",
      apiEndpoint: "",
      authMethod: "none",
      apiKey: "",
      refreshInterval: "daily",
      manualSchema: []
    });
  };

  const handleTypeChange = (type: string) => {
    const sourceType = DATA_SOURCE_TYPES.find(t => t.value === type);
    setFormData({
      ...formData,
      type,
      port: sourceType?.defaultPort || ""
    });
  };

  const handleSubmit = (connectionData: any) => {
    console.log("Creating data source with:", connectionData);
    
    createDataSourceMutation.mutate({
      name: connectionData.name,
      type: connectionData.type,
      connectionString: connectionData.connectionString,
      isActive: true
    });
  };

  const handleEnhancedSubmit = (data: any) => {
    console.log("Creating enhanced data source with:", data);
    
    // Prepare submission data based on type
    const submissionData: any = {
      name: data.name,
      type: data.type,
      connectionString: data.connectionString,
      isActive: true,
      description: data.description,
    };

    // Add type-specific metadata
    switch (data.type) {
      case "manual":
        submissionData.metadata = {
          manualSchema: data.manualFields,
          fieldCount: data.manualFields.length,
          schemaDefinition: data.manualFields.map((field: any) => ({
            name: field.name,
            type: field.dataType,
            nullable: field.nullable,
            defaultValue: field.defaultValue,
            description: field.description
          }))
        };
        // Create the table structure in the system
        console.log("Creating manual table with schema:", submissionData.metadata);
        break;
        
      case "excel":
        submissionData.metadata = {
          filePath: data.filePath,
          sheetName: data.sheetName,
          hasHeaders: data.hasHeaders,
          encoding: data.encoding
        };
        break;
        
      case "csv":
        submissionData.metadata = {
          filePath: data.filePath,
          delimiter: data.delimiter,
          encoding: data.encoding,
          hasHeaders: data.hasHeaders
        };
        break;
        
      case "rest_api":
        submissionData.metadata = {
          endpoint: data.apiEndpoint,
          authMethod: data.authMethod,
          apiKey: data.apiKey,
          refreshInterval: data.refreshInterval
        };
        break;
        
      case "custom":
        submissionData.metadata = {
          customType: data.customType,
          refreshInterval: data.refreshInterval,
          customProperties: {
            userDefined: true,
            originalConnectionString: data.connectionString
          }
        };
        break;
        
      default:
        // For database and other standard types
        if (data.host) {
          submissionData.metadata = {
            host: data.host,
            port: data.port,
            database: data.database,
            username: data.username,
            sslEnabled: data.sslEnabled
          };
        }
        break;
    }

    createDataSourceMutation.mutate(submissionData);
    setIsEnhancedDialogOpen(false);
  };

  const handleTestConnection = async (sourceId: number) => {
    setIsTestingConnection(sourceId);
    try {
      const result = await api.testDataSourceConnection(sourceId);
      console.log(`Connection test result for source ${sourceId}:`, result);
      // You could show a toast notification here with the result
    } catch (error) {
      console.error(`Connection test failed for source ${sourceId}:`, error);
    } finally {
      setIsTestingConnection(null);
    }
  };

  // Transform database sources to include display properties  
  const transformedSources = Array.isArray(dataSources) ? dataSources.map((source: any) => ({
    ...source,
    lastConnection: "Recently",
    tableCount: Math.floor(Math.random() * 50) + 10, // Mock table count for now
    status: source.isActive ? "connected" : "disconnected"
  })) : [];

  // Add mock data sources if no real ones exist (for demonstration)
  const allSources = transformedSources.length > 0 ? transformedSources : [
    {
      id: 1,
      name: "Production PostgreSQL",
      type: "postgresql",
      connectionString: "postgresql://prod.db.company.com:5432/main",
      isActive: true,
      createdAt: new Date("2024-01-15"),
      lastConnection: "2 hours ago",
      tableCount: 45,
      status: "connected"
    },
    {
      id: 2,
      name: "Analytics Snowflake",
      type: "snowflake", 
      connectionString: "snowflake://analytics.company.snowflakecomputing.com",
      isActive: true,
      createdAt: new Date("2024-01-10"),
      lastConnection: "1 hour ago",
      tableCount: 128,
      status: "connected"
    },
    {
      id: 3,
      name: "Customer MySQL",
      type: "mysql",
      connectionString: "mysql://customer.db.company.com:3306/customers",
      isActive: false,
      createdAt: new Date("2024-01-20"),
      lastConnection: "1 day ago",
      tableCount: 23,
      status: "disconnected"
    }
  ];

  const filteredSources = allSources.filter((source: any) => {
    const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         source.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || source.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800">CONNECTED</Badge>;
      case "disconnected":
        return <Badge className="bg-red-100 text-red-800">DISCONNECTED</Badge>;
      case "testing":
        return <Badge className="bg-yellow-100 text-yellow-800">TESTING</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">UNKNOWN</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    const sourceType = DATA_SOURCE_TYPES.find(t => t.value === type);
    return sourceType?.icon || "🗄️";
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search data sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 h-7 text-xs pl-8 border-gray-300"
              />
              <Search className="w-3 h-3 text-gray-400 absolute left-2 top-2" />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-32 h-7 text-xs border-gray-300">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {DATA_SOURCE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={() => setIsEnhancedDialogOpen(true)}
              className="text-xs h-7 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Data Source
            </Button>

            <Button variant="outline" size="sm" className="text-xs h-7">
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-7 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
              onClick={() => {
                setIsScanningAll(true);
                scanAllSourcesMutation.mutate();
              }}
              disabled={isScanningAll || scanAllSourcesMutation.isPending}
            >
              {isScanningAll || scanAllSourcesMutation.isPending ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Scan className="w-3 h-3 mr-1" />
              )}
              {isScanningAll || scanAllSourcesMutation.isPending ? "Scanning..." : "Scan All Schemas"}
            </Button>
          </div>
          
          <div className="text-xs text-gray-500">
            {filteredSources.length} sources | {filteredSources.filter((s: any) => s.status === 'connected').length} connected
            {createDataSourceMutation.isPending && " | Creating..."}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="bg-gray-100 border-b border-gray-300 grid grid-cols-6 text-xs font-medium text-gray-700">
          <div className="px-3 py-2 border-r border-gray-300">Name & Type</div>
          <div className="px-3 py-2 border-r border-gray-300">Connection Details</div>
          <div className="px-3 py-2 border-r border-gray-300">Status</div>
          <div className="px-3 py-2 border-r border-gray-300">Last Connected</div>
          <div className="px-3 py-2 border-r border-gray-300">Tables</div>
          <div className="px-3 py-2">Actions</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading data sources...</div>
            </div>
          ) : filteredSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Database className="w-12 h-12 mb-4 text-gray-300" />
              <div className="text-lg font-medium mb-2">No data sources found</div>
              <div className="text-sm mb-4">Get started by connecting your first data source</div>
              <Button onClick={() => setIsEnhancedDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Data Source
              </Button>
            </div>
          ) : (
            filteredSources.map((source) => (
              <div key={source.id} className="grid grid-cols-6 text-sm border-b border-gray-200 hover:bg-gray-50">
                <div className="px-3 py-3 border-r border-gray-300">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getTypeIcon(source.type)}</span>
                    <div>
                      <div className="font-medium text-blue-600">{source.name}</div>
                      <div className="text-xs text-gray-500 uppercase">{source.type}</div>
                    </div>
                  </div>
                </div>
                
                <div className="px-3 py-3 border-r border-gray-300">
                  <div className="text-xs font-mono text-gray-600 break-all">
                    {source.connectionString.replace(/:[^:@]*@/, ':***@')}
                  </div>
                </div>
                
                <div className="px-3 py-3 border-r border-gray-300">
                  {getStatusBadge(isTestingConnection === source.id ? "testing" : source.status)}
                </div>
                
                <div className="px-3 py-3 border-r border-gray-300 text-gray-600">
                  {source.lastConnection}
                </div>
                
                <div className="px-3 py-3 border-r border-gray-300 text-right">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                    {source.tableCount}
                  </span>
                </div>
                
                <div className="px-3 py-3">
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => handleTestConnection(source.id)}
                      disabled={isTestingConnection === source.id}
                    >
                      {isTestingConnection === source.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <TestTube className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-6 px-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                      onClick={() => {
                        setScanningSource(source.id);
                        scanDataSourceMutation.mutate(source.id);
                      }}
                      disabled={scanningSource === source.id}
                    >
                      {scanningSource === source.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Scan className="w-3 h-3" />
                      )}
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-6 px-2">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-6 px-2">
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-6 px-1 text-red-600 hover:bg-red-50">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 border-t border-gray-300 px-4 py-1 text-xs text-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Total Sources: {allSources.length}</span>
          <span>|</span>
          <span>Connected: {allSources.filter((s: any) => s.status === 'connected').length}</span>
          <span>|</span>
          <span>Total Tables: {allSources.reduce((sum: number, s: any) => sum + s.tableCount, 0)}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Auto-discovery: Enabled</span>
          <span>|</span>
          <span>Last scan: 2 hours ago</span>
        </div>
      </div>

      {/* Enhanced Creation Dialog */}
      <EnhancedCreationDialog
        isOpen={isEnhancedDialogOpen}
        onClose={() => setIsEnhancedDialogOpen(false)}
        onSubmit={handleEnhancedSubmit}
        sourceTypes={DATA_SOURCE_TYPES}
      />
    </div>
  );
}