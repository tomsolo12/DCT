import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Database, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  Copy,
  Eye,
  EyeOff
} from "lucide-react";

interface ConnectionWizardProps {
  onComplete: (connectionData: any) => void;
  onCancel: () => void;
}

const DATA_SOURCE_TYPES = [
  {
    value: "postgresql",
    label: "PostgreSQL",
    icon: "🐘",
    defaultPort: "5432",
    description: "Open source relational database",
    connectionStringTemplate: "postgresql://username:password@host:port/database",
    commonPorts: ["5432", "5433"],
    features: ["ACID compliant", "JSON support", "Advanced indexing"]
  },
  {
    value: "mysql",
    label: "MySQL",
    icon: "🐬",
    defaultPort: "3306",
    description: "Popular open source database",
    connectionStringTemplate: "mysql://username:password@host:port/database",
    commonPorts: ["3306", "3307"],
    features: ["High performance", "Replication", "Partitioning"]
  },
  {
    value: "sqlserver",
    label: "SQL Server",
    icon: "🔷",
    defaultPort: "1433",
    description: "Microsoft's enterprise database",
    connectionStringTemplate: "sqlserver://username:password@host:port/database",
    commonPorts: ["1433", "1434"],
    features: ["Enterprise security", "Analysis services", "Reporting"]
  },
  {
    value: "snowflake",
    label: "Snowflake",
    icon: "❄️",
    defaultPort: "443",
    description: "Cloud data warehouse",
    connectionStringTemplate: "snowflake://username:password@account.snowflakecomputing.com/database",
    commonPorts: ["443"],
    features: ["Auto-scaling", "Zero-copy cloning", "Time travel"]
  },
  {
    value: "bigquery",
    label: "Google BigQuery",
    icon: "☁️",
    defaultPort: "443",
    description: "Google's data warehouse",
    connectionStringTemplate: "bigquery://project-id/dataset",
    commonPorts: ["443"],
    features: ["Serverless", "Machine learning", "Streaming analytics"]
  },
  {
    value: "redshift",
    label: "Amazon Redshift",
    icon: "🚀",
    defaultPort: "5439",
    description: "AWS data warehouse",
    connectionStringTemplate: "redshift://username:password@cluster.region.redshift.amazonaws.com:5439/database",
    commonPorts: ["5439"],
    features: ["Columnar storage", "Massively parallel", "S3 integration"]
  }
];

export default function ConnectionWizard({ onComplete, onCancel }: ConnectionWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const [formData, setFormData] = useState({
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
    // Advanced options
    connectionTimeout: "30",
    maxConnections: "10",
    enableCompression: false,
    customProperties: ""
  });

  const selectedSourceType = DATA_SOURCE_TYPES.find(t => t.value === selectedType);

  const handleTypeSelection = (type: string) => {
    const sourceType = DATA_SOURCE_TYPES.find(t => t.value === type);
    setSelectedType(type);
    setFormData({
      ...formData,
      type,
      port: sourceType?.defaultPort || "",
      name: sourceType ? `${sourceType.label} Connection` : ""
    });
    setCurrentStep(2);
  };

  const generateConnectionString = () => {
    if (!selectedSourceType) return "";
    
    let template = selectedSourceType.connectionStringTemplate;
    template = template.replace("username", formData.username || "username");
    template = template.replace("password", formData.password || "password");
    template = template.replace("host", formData.host || "host");
    template = template.replace("port", formData.port || selectedSourceType.defaultPort);
    template = template.replace("database", formData.database || "database");
    
    return template;
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      const isSuccess = Math.random() > 0.3; // 70% success rate
      
      setTestResult({
        success: isSuccess,
        message: isSuccess ? "Connection successful!" : "Connection failed - check credentials",
        latency: isSuccess ? Math.floor(Math.random() * 100) + 20 : null,
        details: isSuccess ? "Database accessible, schema readable" : "Authentication error or host unreachable"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleComplete = () => {
    const connectionString = formData.connectionString || generateConnectionString();
    onComplete({
      ...formData,
      connectionString,
      type: selectedType
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 4 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-2">
          <div className="text-xs text-gray-500">
            {currentStep === 1 && "Choose Database Type"}
            {currentStep === 2 && "Connection Details"}
            {currentStep === 3 && "Test & Verify"}
            {currentStep === 4 && "Review & Complete"}
          </div>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Choose Your Database Type</h2>
          <div className="grid grid-cols-2 gap-4">
            {DATA_SOURCE_TYPES.map((type) => (
              <Card
                key={type.value}
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
                onClick={() => handleTypeSelection(type.value)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <CardTitle className="text-sm">{type.label}</CardTitle>
                      <CardDescription className="text-xs">{type.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">Features:</div>
                    <div className="flex flex-wrap gap-1">
                      {type.features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {currentStep === 2 && selectedSourceType && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-xl">{selectedSourceType.icon}</span>
            <h2 className="text-lg font-semibold">{selectedSourceType.label} Connection</h2>
          </div>

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Basic Configuration</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
              <TabsTrigger value="connection-string">Connection String</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Connection Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="My Production Database"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Database/Schema</label>
                  <Input
                    value={formData.database}
                    onChange={(e) => setFormData({...formData, database: e.target.value})}
                    placeholder="database_name"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Host/Server</label>
                  <Input
                    value={formData.host}
                    onChange={(e) => setFormData({...formData, host: e.target.value})}
                    placeholder="db.company.com"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Port</label>
                  <Select value={formData.port} onValueChange={(value) => setFormData({...formData, port: value})}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select port" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedSourceType.commonPorts.map(port => (
                        <SelectItem key={port} value={port}>{port}</SelectItem>
                      ))}
                      <SelectItem value="custom">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="username"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="password"
                      className="h-8 text-xs pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Switch
                  checked={formData.sslEnabled}
                  onCheckedChange={(checked) => setFormData({...formData, sslEnabled: checked})}
                />
                <label className="text-xs text-gray-700">Enable SSL/TLS encryption</label>
                <Info className="w-3 h-3 text-gray-400" />
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Connection Timeout (seconds)</label>
                  <Input
                    value={formData.connectionTimeout}
                    onChange={(e) => setFormData({...formData, connectionTimeout: e.target.value})}
                    placeholder="30"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Connections</label>
                  <Input
                    value={formData.maxConnections}
                    onChange={(e) => setFormData({...formData, maxConnections: e.target.value})}
                    placeholder="10"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.enableCompression}
                  onCheckedChange={(checked) => setFormData({...formData, enableCompression: checked})}
                />
                <label className="text-xs text-gray-700">Enable compression</label>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Custom Connection Properties</label>
                <Textarea
                  value={formData.customProperties}
                  onChange={(e) => setFormData({...formData, customProperties: e.target.value})}
                  placeholder="key1=value1;key2=value2"
                  className="h-20 text-xs font-mono"
                />
              </div>
            </TabsContent>

            <TabsContent value="connection-string" className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Connection String</label>
                <div className="relative">
                  <Textarea
                    value={formData.connectionString || generateConnectionString()}
                    onChange={(e) => setFormData({...formData, connectionString: e.target.value})}
                    placeholder={selectedSourceType.connectionStringTemplate}
                    className="h-20 text-xs font-mono pr-10"
                  />
                  <button
                    onClick={() => copyToClipboard(formData.connectionString || generateConnectionString())}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  You can manually edit the connection string or use the form fields above
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button 
              onClick={() => setCurrentStep(3)}
              disabled={!formData.name || !formData.host || !formData.username}
            >
              Next: Test Connection
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Test Your Connection</h2>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">Connection Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Name:</strong> {formData.name}</div>
                <div><strong>Type:</strong> {selectedSourceType?.label}</div>
                <div><strong>Host:</strong> {formData.host}</div>
                <div><strong>Port:</strong> {formData.port}</div>
                <div><strong>Database:</strong> {formData.database}</div>
                <div><strong>SSL:</strong> {formData.sslEnabled ? 'Enabled' : 'Disabled'}</div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-y-4">
            <Button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="w-48"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {isTesting ? 'Testing Connection...' : 'Test Connection'}
            </Button>

            {testResult && (
              <Card className={`max-w-md mx-auto ${
                testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium text-sm ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.message}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {testResult.details}
                  </div>
                  {testResult.latency && (
                    <div className="text-xs text-gray-500 mt-1">
                      Response time: {testResult.latency}ms
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Back
            </Button>
            <Button 
              onClick={() => setCurrentStep(4)}
              disabled={!testResult?.success}
            >
              Complete Setup
            </Button>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Review & Complete</h2>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Connection Ready</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><strong>Name:</strong> {formData.name}</div>
                <div><strong>Type:</strong> {selectedSourceType?.label}</div>
                <div><strong>Host:</strong> {formData.host}:{formData.port}</div>
                <div><strong>Database:</strong> {formData.database}</div>
                <div><strong>Connection Status:</strong> <Badge className="bg-green-100 text-green-800">Verified</Badge></div>
                <div><strong>SSL Enabled:</strong> {formData.sslEnabled ? 'Yes' : 'No'}</div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="text-xs text-gray-600 mb-2">
                  <strong>What happens next:</strong>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Connection will be saved to your data sources</li>
                  <li>• Automatic schema discovery will begin</li>
                  <li>• Tables and metadata will be cataloged</li>
                  <li>• You can start querying immediately</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(3)}>
              Back
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleComplete}>
                Create Data Source
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}