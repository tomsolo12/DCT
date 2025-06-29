import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, 
  Trash2, 
  Upload, 
  FileSpreadsheet, 
  Database, 
  Settings, 
  Globe, 
  Cloud,
  Table,
  Zap
} from "lucide-react";

interface EnhancedCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  sourceTypes: any[];
}

interface ManualField {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue: string;
  description: string;
}

const DATA_TYPES = [
  "VARCHAR(255)", "TEXT", "INTEGER", "BIGINT", "DECIMAL", "FLOAT", "DOUBLE",
  "BOOLEAN", "DATE", "DATETIME", "TIMESTAMP", "JSON", "UUID"
];

const FILE_ENCODINGS = ["utf-8", "utf-16", "iso-8859-1", "windows-1252"];
const AUTH_METHODS = ["none", "basic", "bearer", "api_key", "oauth2"];
const REFRESH_INTERVALS = ["real-time", "5min", "15min", "hourly", "daily", "weekly"];

export default function EnhancedCreationDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  sourceTypes 
}: EnhancedCreationDialogProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedType, setSelectedType] = useState("");
  const [formData, setFormData] = useState({
    // Basic fields
    name: "",
    description: "",
    type: "",
    
    // Database fields
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
    sslEnabled: true,
    
    // File fields
    filePath: "",
    fileName: "",
    sheetName: "",
    hasHeaders: true,
    delimiter: ",",
    encoding: "utf-8",
    
    // API fields
    apiEndpoint: "",
    authMethod: "none",
    apiKey: "",
    refreshInterval: "daily",
    
    // Custom fields
    customType: "",
    connectionString: "",
    
    // Manual table schema
    manualFields: [] as ManualField[]
  });

  const selectedTypeInfo = sourceTypes.find(t => t.value === selectedType);
  const category = selectedTypeInfo?.category || "";

  const addManualField = () => {
    setFormData({
      ...formData,
      manualFields: [...formData.manualFields, {
        name: "",
        dataType: "VARCHAR(255)",
        nullable: true,
        defaultValue: "",
        description: ""
      }]
    });
  };

  const updateManualField = (index: number, field: Partial<ManualField>) => {
    const updatedFields = [...formData.manualFields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setFormData({ ...formData, manualFields: updatedFields });
  };

  const removeManualField = (index: number) => {
    setFormData({
      ...formData,
      manualFields: formData.manualFields.filter((_, i) => i !== index)
    });
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    const typeInfo = sourceTypes.find(t => t.value === type);
    setFormData({
      ...formData,
      type,
      port: typeInfo?.defaultPort || ""
    });
  };

  const handleSubmit = () => {
    const submissionData = {
      ...formData,
      connectionString: buildConnectionString()
    };
    onSubmit(submissionData);
  };

  const buildConnectionString = () => {
    if (formData.connectionString) return formData.connectionString;
    
    switch (selectedType) {
      case "manual":
        return `manual://table/${formData.name}`;
      case "excel":
        return `excel://${formData.filePath}${formData.sheetName ? `?sheet=${formData.sheetName}` : ''}`;
      case "csv":
        return `csv://${formData.filePath}?delimiter=${formData.delimiter}&encoding=${formData.encoding}`;
      case "rest_api":
        return formData.apiEndpoint;
      case "postgresql":
        return `postgresql://${formData.username}:${formData.password}@${formData.host}:${formData.port}/${formData.database}`;
      default:
        return formData.connectionString;
    }
  };

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case "Manual": return <Table className="w-4 h-4" />;
      case "Files": return <FileSpreadsheet className="w-4 h-4" />;
      case "Database": return <Database className="w-4 h-4" />;
      case "Cloud": return <Cloud className="w-4 h-4" />;
      case "API": return <Globe className="w-4 h-4" />;
      case "Streaming": return <Zap className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Data Source</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Data Source Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Select Data Source Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {Object.entries(
                sourceTypes.reduce((acc, type) => {
                  const category = type.category || 'Other';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(type);
                  return acc;
                }, {} as Record<string, any[]>)
              ).map(([category, types]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    {renderCategoryIcon(category)}
                    <span>{category}</span>
                  </div>
                  {types.map((type) => (
                    <Card 
                      key={type.value}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedType === type.value 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleTypeChange(type.value)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{type.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{type.label}</div>
                            {type.description && (
                              <div className="text-xs text-gray-500 truncate">{type.description}</div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {selectedType && (
            <>
              <Separator />
              
              {/* Configuration Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="connection">Connection</TabsTrigger>
                  {selectedType === "manual" && <TabsTrigger value="schema">Table Schema</TabsTrigger>}
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Data Source Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="My Data Source"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Selected Type</Label>
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <span>{selectedTypeInfo?.icon}</span>
                        <span className="font-medium">{selectedTypeInfo?.label}</span>
                        <Badge variant="outline">{selectedTypeInfo?.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe this data source..."
                      rows={3}
                    />
                  </div>
                </TabsContent>

                {/* Connection Configuration Tab */}
                <TabsContent value="connection" className="space-y-4">
                  {/* Database Connection Fields */}
                  {category === "Database" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="host">Host *</Label>
                        <Input
                          id="host"
                          value={formData.host}
                          onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                          placeholder="localhost"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="port">Port</Label>
                        <Input
                          id="port"
                          value={formData.port}
                          onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                          placeholder={selectedTypeInfo?.defaultPort}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="database">Database *</Label>
                        <Input
                          id="database"
                          value={formData.database}
                          onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                          placeholder="database_name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          placeholder="username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="password"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="sslEnabled"
                          checked={formData.sslEnabled}
                          onCheckedChange={(checked) => setFormData({ ...formData, sslEnabled: checked })}
                        />
                        <Label htmlFor="sslEnabled">Enable SSL</Label>
                      </div>
                    </div>
                  )}

                  {/* File Connection Fields */}
                  {category === "Files" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="filePath">File Path *</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="filePath"
                            value={formData.filePath}
                            onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                            placeholder="/path/to/file.xlsx"
                          />
                          <Button variant="outline" size="icon">
                            <Upload className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {selectedType === "excel" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="sheetName">Sheet Name</Label>
                            <Input
                              id="sheetName"
                              value={formData.sheetName}
                              onChange={(e) => setFormData({ ...formData, sheetName: e.target.value })}
                              placeholder="Sheet1"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="hasHeaders"
                              checked={formData.hasHeaders}
                              onCheckedChange={(checked) => setFormData({ ...formData, hasHeaders: checked })}
                            />
                            <Label htmlFor="hasHeaders">First row contains headers</Label>
                          </div>
                        </div>
                      )}
                      
                      {selectedType === "csv" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="delimiter">Delimiter</Label>
                            <Select value={formData.delimiter} onValueChange={(value) => setFormData({ ...formData, delimiter: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value=",">,</SelectItem>
                                <SelectItem value=";">;</SelectItem>
                                <SelectItem value="\t">Tab</SelectItem>
                                <SelectItem value="|">|</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="encoding">Encoding</Label>
                            <Select value={formData.encoding} onValueChange={(value) => setFormData({ ...formData, encoding: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FILE_ENCODINGS.map(enc => (
                                  <SelectItem key={enc} value={enc}>{enc}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="hasHeaders"
                              checked={formData.hasHeaders}
                              onCheckedChange={(checked) => setFormData({ ...formData, hasHeaders: checked })}
                            />
                            <Label htmlFor="hasHeaders">Has headers</Label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* API Connection Fields */}
                  {category === "API" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="apiEndpoint">API Endpoint *</Label>
                        <Input
                          id="apiEndpoint"
                          value={formData.apiEndpoint}
                          onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                          placeholder="https://api.example.com/data"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="authMethod">Authentication Method</Label>
                          <Select value={formData.authMethod} onValueChange={(value) => setFormData({ ...formData, authMethod: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AUTH_METHODS.map(method => (
                                <SelectItem key={method} value={method}>
                                  {method.replace('_', ' ').toUpperCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.authMethod !== "none" && (
                          <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key / Token</Label>
                            <Input
                              id="apiKey"
                              type="password"
                              value={formData.apiKey}
                              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                              placeholder="your-api-key"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Custom Connection String */}
                  {(selectedType === "custom" || !["Database", "Files", "API", "Manual"].includes(category)) && (
                    <div className="space-y-4">
                      {selectedType === "custom" && (
                        <div className="space-y-2">
                          <Label htmlFor="customType">Custom Type Name</Label>
                          <Input
                            id="customType"
                            value={formData.customType}
                            onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                            placeholder="my-custom-source"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="connectionString">Connection String *</Label>
                        <Textarea
                          id="connectionString"
                          value={formData.connectionString}
                          onChange={(e) => setFormData({ ...formData, connectionString: e.target.value })}
                          placeholder="protocol://connection-string"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Manual Table Schema Tab */}
                {selectedType === "manual" && (
                  <TabsContent value="schema" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Table Schema Definition</h3>
                        <p className="text-sm text-gray-600">Define the structure of your manual table</p>
                      </div>
                      <Button onClick={addManualField} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                      </Button>
                    </div>
                    
                    {formData.manualFields.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Table className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No fields defined yet. Click "Add Field" to start building your table schema.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.manualFields.map((field, index) => (
                          <Card key={index} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                              <div className="space-y-2">
                                <Label>Field Name *</Label>
                                <Input
                                  value={field.name}
                                  onChange={(e) => updateManualField(index, { name: e.target.value })}
                                  placeholder="field_name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Data Type *</Label>
                                <Select 
                                  value={field.dataType} 
                                  onValueChange={(value) => updateManualField(index, { dataType: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DATA_TYPES.map(type => (
                                      <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Default Value</Label>
                                <Input
                                  value={field.defaultValue}
                                  onChange={(e) => updateManualField(index, { defaultValue: e.target.value })}
                                  placeholder="NULL"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                  value={field.description}
                                  onChange={(e) => updateManualField(index, { description: e.target.value })}
                                  placeholder="Field description"
                                />
                              </div>
                              <div className="flex items-end space-x-2">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={field.nullable}
                                    onCheckedChange={(checked) => updateManualField(index, { nullable: checked })}
                                  />
                                  <Label className="text-xs">Nullable</Label>
                                </div>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => removeManualField(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                )}

                {/* Advanced Configuration Tab */}
                <TabsContent value="advanced" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="refreshInterval">Refresh Interval</Label>
                      <Select value={formData.refreshInterval} onValueChange={(value) => setFormData({ ...formData, refreshInterval: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REFRESH_INTERVALS.map(interval => (
                            <SelectItem key={interval} value={interval}>
                              {interval.replace('-', ' ').replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Generated Connection String</Label>
                    <div className="p-3 bg-gray-50 rounded border">
                      <code className="text-sm text-gray-700">
                        {buildConnectionString() || "Configuration incomplete"}
                      </code>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.name || !selectedType}
                >
                  Create Data Source
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}