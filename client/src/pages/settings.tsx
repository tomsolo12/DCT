import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, Database, Bell, Shield, Trash2, Plus } from "lucide-react";

export default function Settings() {
  const [selectedCategory, setSelectedCategory] = useState("general");

  const [generalSettings, setGeneralSettings] = useState({
    organizationName: "Enterprise Corp",
    timezone: "UTC-8",
    defaultQueryLimit: "1000",
    autoRefreshInterval: "30",
    enableNotifications: true,
    enableDataProfiling: true,
    enableAutoDiscovery: false,
    dateFormat: "YYYY-MM-DD",
    numberFormat: "US",
    defaultLanguage: "en"
  });

  const [dataSourceSettings, setDataSourceSettings] = useState({
    defaultConnectionTimeout: "30",
    maxConcurrentConnections: "10",
    enableSSL: true,
    enableQueryLogging: true,
    connectionRetries: "3",
    queryTimeout: "300",
    enableConnectionPooling: true,
    poolSize: "20",
    enableCache: true,
    cacheTimeout: "600"
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    qualityThresholdAlerts: true,
    policyViolationAlerts: true,
    systemMaintenanceAlerts: false,
    weeklyReports: true,
    emailAddress: "admin@company.com",
    slackWebhook: "",
    teamsWebhook: "",
    alertFrequency: "immediate",
    reportFrequency: "weekly"
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: "480",
    enableTwoFactor: false,
    enableAuditLogging: true,
    enableEncryption: true,
    passwordPolicy: "strong",
    maxLoginAttempts: "5",
    accountLockoutDuration: "30",
    enableIPWhitelist: false,
    trustedIPs: "",
    enableSSO: false,
    ssoProvider: "none"
  });

  const [performanceSettings, setPerformanceSettings] = useState({
    enableQueryCache: true,
    queryCacheSize: "1000",
    enableResultStreaming: true,
    maxResultRows: "10000",
    enableCompression: true,
    compressionLevel: "6",
    enableParallelQueries: true,
    maxParallelQueries: "5",
    enableIndexing: true,
    backgroundScanInterval: "24"
  });

  // Mock API endpoints for demonstration
  const mockApiEndpoints = [
    { id: 1, name: "Production Database", url: "postgresql://prod.db.company.com:5432", status: "active", lastTested: "2 hours ago" },
    { id: 2, name: "Analytics Warehouse", url: "snowflake://analytics.company.snowflakecomputing.com", status: "active", lastTested: "1 hour ago" },
    { id: 3, name: "Customer MySQL", url: "mysql://customer.db.company.com:3306", status: "inactive", lastTested: "1 day ago" }
  ];

  const handleSaveSettings = () => {
    console.log("Saving settings...", { 
      generalSettings, 
      dataSourceSettings, 
      notificationSettings, 
      securitySettings, 
      performanceSettings 
    });
  };

  const settingsCategories = [
    { id: "general", name: "General Settings", icon: "⚙️" },
    { id: "datasources", name: "Data Sources", icon: "🗄️" },
    { id: "notifications", name: "Notifications", icon: "🔔" },
    { id: "security", name: "Security", icon: "🔒" },
    { id: "performance", name: "Performance", icon: "⚡" },
    { id: "api", name: "API Endpoints", icon: "🔗" }
  ];

  const handleTestConnection = (endpointId: number) => {
    console.log(`Testing connection for endpoint ${endpointId}`);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleSaveSettings}>
              <Save className="w-3 h-3 mr-1" />
              Save Changes
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-7">
              <Database className="w-3 h-3 mr-1" />
              Test Connections
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-7">
              Export Config
            </Button>
          </div>
          
          <div className="text-xs text-gray-500">
            Last Updated: 2 hours ago | Auto-save: Enabled
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Settings Categories */}
        <div className="w-1/4 border-r border-gray-300 flex flex-col">
          <div className="bg-gray-100 border-b border-gray-300 px-3 py-1 text-xs font-medium text-gray-700">
            SETTINGS CATEGORIES
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {settingsCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 text-sm border rounded transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'hover:bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel: Settings Form */}
        <div className="w-1/2 border-r border-gray-300 flex flex-col">
          <div className="bg-gray-100 border-b border-gray-300 px-3 py-1 text-xs font-medium text-gray-700">
            {settingsCategories.find(c => c.id === selectedCategory)?.icon} {settingsCategories.find(c => c.id === selectedCategory)?.name.toUpperCase()}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedCategory === "general" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Organization Name</label>
                    <Input
                      value={generalSettings.organizationName}
                      onChange={(e) => setGeneralSettings({...generalSettings, organizationName: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Timezone</label>
                    <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings({...generalSettings, timezone: value})}>
                      <SelectTrigger className="h-7 text-xs border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC-8">UTC-8 (Pacific)</SelectItem>
                        <SelectItem value="UTC-5">UTC-5 (Eastern)</SelectItem>
                        <SelectItem value="UTC">UTC (Greenwich)</SelectItem>
                        <SelectItem value="UTC+1">UTC+1 (Central European)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Default Query Limit</label>
                    <Input
                      value={generalSettings.defaultQueryLimit}
                      onChange={(e) => setGeneralSettings({...generalSettings, defaultQueryLimit: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Auto Refresh (seconds)</label>
                    <Input
                      value={generalSettings.autoRefreshInterval}
                      onChange={(e) => setGeneralSettings({...generalSettings, autoRefreshInterval: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date Format</label>
                    <Select value={generalSettings.dateFormat} onValueChange={(value) => setGeneralSettings({...generalSettings, dateFormat: value})}>
                      <SelectTrigger className="h-7 text-xs border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Number Format</label>
                    <Select value={generalSettings.numberFormat} onValueChange={(value) => setGeneralSettings({...generalSettings, numberFormat: value})}>
                      <SelectTrigger className="h-7 text-xs border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">US (1,234.56)</SelectItem>
                        <SelectItem value="EU">EU (1.234,56)</SelectItem>
                        <SelectItem value="IN">IN (1,23,456.78)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable Notifications</label>
                      <div className="text-xs text-gray-500">Receive system alerts and updates</div>
                    </div>
                    <Switch
                      checked={generalSettings.enableNotifications}
                      onCheckedChange={(checked) => setGeneralSettings({...generalSettings, enableNotifications: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable Data Profiling</label>
                      <div className="text-xs text-gray-500">Automatically analyze data quality</div>
                    </div>
                    <Switch
                      checked={generalSettings.enableDataProfiling}
                      onCheckedChange={(checked) => setGeneralSettings({...generalSettings, enableDataProfiling: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable Auto Discovery</label>
                      <div className="text-xs text-gray-500">Scan for new data sources automatically</div>
                    </div>
                    <Switch
                      checked={generalSettings.enableAutoDiscovery}
                      onCheckedChange={(checked) => setGeneralSettings({...generalSettings, enableAutoDiscovery: checked})}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === "datasources" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Connection Timeout (seconds)</label>
                    <Input
                      value={dataSourceSettings.defaultConnectionTimeout}
                      onChange={(e) => setDataSourceSettings({...dataSourceSettings, defaultConnectionTimeout: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Concurrent Connections</label>
                    <Input
                      value={dataSourceSettings.maxConcurrentConnections}
                      onChange={(e) => setDataSourceSettings({...dataSourceSettings, maxConcurrentConnections: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Connection Retries</label>
                    <Input
                      value={dataSourceSettings.connectionRetries}
                      onChange={(e) => setDataSourceSettings({...dataSourceSettings, connectionRetries: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Query Timeout (seconds)</label>
                    <Input
                      value={dataSourceSettings.queryTimeout}
                      onChange={(e) => setDataSourceSettings({...dataSourceSettings, queryTimeout: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Connection Pool Size</label>
                    <Input
                      value={dataSourceSettings.poolSize}
                      onChange={(e) => setDataSourceSettings({...dataSourceSettings, poolSize: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Cache Timeout (seconds)</label>
                    <Input
                      value={dataSourceSettings.cacheTimeout}
                      onChange={(e) => setDataSourceSettings({...dataSourceSettings, cacheTimeout: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable SSL by Default</label>
                      <div className="text-xs text-gray-500">Use SSL for new connections</div>
                    </div>
                    <Switch
                      checked={dataSourceSettings.enableSSL}
                      onCheckedChange={(checked) => setDataSourceSettings({...dataSourceSettings, enableSSL: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable Query Logging</label>
                      <div className="text-xs text-gray-500">Log all executed queries</div>
                    </div>
                    <Switch
                      checked={dataSourceSettings.enableQueryLogging}
                      onCheckedChange={(checked) => setDataSourceSettings({...dataSourceSettings, enableQueryLogging: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable Connection Pooling</label>
                      <div className="text-xs text-gray-500">Pool connections for better performance</div>
                    </div>
                    <Switch
                      checked={dataSourceSettings.enableConnectionPooling}
                      onCheckedChange={(checked) => setDataSourceSettings({...dataSourceSettings, enableConnectionPooling: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable Result Cache</label>
                      <div className="text-xs text-gray-500">Cache query results for faster retrieval</div>
                    </div>
                    <Switch
                      checked={dataSourceSettings.enableCache}
                      onCheckedChange={(checked) => setDataSourceSettings({...dataSourceSettings, enableCache: checked})}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === "notifications" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                    <Input
                      value={notificationSettings.emailAddress}
                      onChange={(e) => setNotificationSettings({...notificationSettings, emailAddress: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                      placeholder="admin@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Alert Frequency</label>
                    <Select value={notificationSettings.alertFrequency} onValueChange={(value) => setNotificationSettings({...notificationSettings, alertFrequency: value})}>
                      <SelectTrigger className="h-7 text-xs border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly Digest</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Slack Webhook URL</label>
                    <Input
                      value={notificationSettings.slackWebhook}
                      onChange={(e) => setNotificationSettings({...notificationSettings, slackWebhook: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                      placeholder="https://hooks.slack.com/services/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Microsoft Teams Webhook URL</label>
                    <Input
                      value={notificationSettings.teamsWebhook}
                      onChange={(e) => setNotificationSettings({...notificationSettings, teamsWebhook: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                      placeholder="https://outlook.office.com/webhook/..."
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Email Alerts</label>
                      <div className="text-xs text-gray-500">Send notifications via email</div>
                    </div>
                    <Switch
                      checked={notificationSettings.emailAlerts}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailAlerts: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Quality Threshold Alerts</label>
                      <div className="text-xs text-gray-500">Alert when data quality drops</div>
                    </div>
                    <Switch
                      checked={notificationSettings.qualityThresholdAlerts}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, qualityThresholdAlerts: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Policy Violation Alerts</label>
                      <div className="text-xs text-gray-500">Alert on governance violations</div>
                    </div>
                    <Switch
                      checked={notificationSettings.policyViolationAlerts}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, policyViolationAlerts: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">System Maintenance Alerts</label>
                      <div className="text-xs text-gray-500">Notify about system updates</div>
                    </div>
                    <Switch
                      checked={notificationSettings.systemMaintenanceAlerts}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, systemMaintenanceAlerts: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Weekly Reports</label>
                      <div className="text-xs text-gray-500">Send weekly summary reports</div>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyReports}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, weeklyReports: checked})}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === "security" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                    <Input
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Login Attempts</label>
                    <Input
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Account Lockout (minutes)</label>
                    <Input
                      value={securitySettings.accountLockoutDuration}
                      onChange={(e) => setSecuritySettings({...securitySettings, accountLockoutDuration: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Password Policy</label>
                    <Select value={securitySettings.passwordPolicy} onValueChange={(value) => setSecuritySettings({...securitySettings, passwordPolicy: value})}>
                      <SelectTrigger className="h-7 text-xs border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic (8+ chars)</SelectItem>
                        <SelectItem value="strong">Strong (12+ chars, mixed)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (16+ chars, complex)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Trusted IP Addresses (comma-separated)</label>
                    <Input
                      value={securitySettings.trustedIPs}
                      onChange={(e) => setSecuritySettings({...securitySettings, trustedIPs: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                      placeholder="192.168.1.0/24, 10.0.0.0/8"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable Two-Factor Authentication</label>
                      <div className="text-xs text-gray-500">Require 2FA for all users</div>
                    </div>
                    <Switch
                      checked={securitySettings.enableTwoFactor}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enableTwoFactor: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable Audit Logging</label>
                      <div className="text-xs text-gray-500">Log all user activities</div>
                    </div>
                    <Switch
                      checked={securitySettings.enableAuditLogging}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enableAuditLogging: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable Data Encryption</label>
                      <div className="text-xs text-gray-500">Encrypt sensitive data at rest</div>
                    </div>
                    <Switch
                      checked={securitySettings.enableEncryption}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enableEncryption: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable IP Whitelist</label>
                      <div className="text-xs text-gray-500">Restrict access to trusted IPs</div>
                    </div>
                    <Switch
                      checked={securitySettings.enableIPWhitelist}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enableIPWhitelist: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable Single Sign-On</label>
                      <div className="text-xs text-gray-500">Use SSO for authentication</div>
                    </div>
                    <Switch
                      checked={securitySettings.enableSSO}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enableSSO: checked})}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === "performance" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Query Cache Size (MB)</label>
                    <Input
                      value={performanceSettings.queryCacheSize}
                      onChange={(e) => setPerformanceSettings({...performanceSettings, queryCacheSize: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Result Rows</label>
                    <Input
                      value={performanceSettings.maxResultRows}
                      onChange={(e) => setPerformanceSettings({...performanceSettings, maxResultRows: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Compression Level (1-9)</label>
                    <Input
                      value={performanceSettings.compressionLevel}
                      onChange={(e) => setPerformanceSettings({...performanceSettings, compressionLevel: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Parallel Queries</label>
                    <Input
                      value={performanceSettings.maxParallelQueries}
                      onChange={(e) => setPerformanceSettings({...performanceSettings, maxParallelQueries: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Background Scan Interval (hours)</label>
                    <Input
                      value={performanceSettings.backgroundScanInterval}
                      onChange={(e) => setPerformanceSettings({...performanceSettings, backgroundScanInterval: e.target.value})}
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable Query Cache</label>
                      <div className="text-xs text-gray-500">Cache frequently used queries</div>
                    </div>
                    <Switch
                      checked={performanceSettings.enableQueryCache}
                      onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, enableQueryCache: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable Result Streaming</label>
                      <div className="text-xs text-gray-500">Stream large result sets</div>
                    </div>
                    <Switch
                      checked={performanceSettings.enableResultStreaming}
                      onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, enableResultStreaming: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable Compression</label>
                      <div className="text-xs text-gray-500">Compress data transfers</div>
                    </div>
                    <Switch
                      checked={performanceSettings.enableCompression}
                      onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, enableCompression: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable Parallel Queries</label>
                      <div className="text-xs text-gray-500">Execute multiple queries simultaneously</div>
                    </div>
                    <Switch
                      checked={performanceSettings.enableParallelQueries}
                      onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, enableParallelQueries: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable Auto Indexing</label>
                      <div className="text-xs text-gray-500">Automatically create performance indexes</div>
                    </div>
                    <Switch
                      checked={performanceSettings.enableIndexing}
                      onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, enableIndexing: checked})}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === "api" && (
              <div className="space-y-4">
                <div className="text-xs text-gray-600 mb-4">
                  Manage API endpoints and external integrations. See the right panel for current endpoints.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">API Rate Limit (requests/hour)</label>
                    <Input
                      defaultValue="1000"
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">API Timeout (seconds)</label>
                    <Input
                      defaultValue="30"
                      className="h-7 text-xs border-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable API Authentication</label>
                      <div className="text-xs text-gray-500">Require API keys for external access</div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable CORS</label>
                      <div className="text-xs text-gray-500">Allow cross-origin requests</div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Enable API Logging</label>
                      <div className="text-xs text-gray-500">Log all API requests and responses</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-700 mb-2">API Documentation</div>
                  <div className="text-xs text-gray-500 mb-2">
                    Access interactive API documentation and testing interface.
                  </div>
                  <Button variant="outline" size="sm" className="text-xs h-7">
                    Open API Docs
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: API Endpoints */}
        <div className="w-1/4 flex flex-col">
          <div className="bg-gray-100 border-b border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 flex items-center justify-between">
            <span>API ENDPOINTS</span>
            <Button variant="ghost" size="sm" className="h-5 px-1">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {mockApiEndpoints.map((endpoint) => (
              <div key={endpoint.id} className="border-b border-gray-200 p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-xs text-blue-600">{endpoint.name}</div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    endpoint.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {endpoint.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2 font-mono break-all">{endpoint.url}</div>
                <div className="text-xs text-gray-400 mb-2">Last tested: {endpoint.lastTested}</div>
                <div className="flex space-x-1">
                  <Button variant="outline" size="sm" className="text-xs h-6 px-2" onClick={() => handleTestConnection(endpoint.id)}>
                    Test
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-6 px-2">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-6 px-1 text-red-600 hover:bg-red-50">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 border-t border-gray-300 px-4 py-1 text-xs text-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Settings: 12 categories</span>
          <span>|</span>
          <span>API Endpoints: {mockApiEndpoints.length}</span>
          <span>|</span>
          <span>Active Connections: {mockApiEndpoints.filter(e => e.status === 'active').length}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Configuration: Valid</span>
          <span>|</span>
          <span>Last Sync: 2 hours ago</span>
        </div>
      </div>
    </div>
  );
}