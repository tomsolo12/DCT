import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  ShieldCheck, 
  Code, 
  Users, 
  Settings, 
  Database,
  GitBranch,
  Download,
  Upload,
  RefreshCw,
  Filter,
  Search,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Data Catalog", href: "/catalog", icon: BookOpen },
  { name: "Data Sources", href: "/data-sources", icon: Database },
  { name: "DQ Monitoring", href: "/dq-monitoring", icon: ShieldCheck },
  { name: "Query Studio", href: "/query-studio", icon: Code },
  { name: "BI Integration", href: "/bi-integration", icon: GitBranch },
  { name: "System Health", href: "/system-dashboard", icon: Activity },
  { name: "Governance", href: "/governance", icon: Users },
];

const toolbarActions = [
  { name: "Import", icon: Upload },
  { name: "Export", icon: Download },
  { name: "Refresh", icon: RefreshCw },
  { name: "Filter", icon: Filter },
  { name: "Search", icon: Search },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const handleImport = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv,.xlsx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('Importing file:', file.name);
        // In a real implementation, this would parse and upload the file
        alert(`Import functionality triggered for: ${file.name}`);
      }
    };
    input.click();
  };

  const handleExport = () => {
    // Export current data based on active page
    const timestamp = new Date().toISOString().slice(0, 10);
    let exportData = {};
    let filename = '';

    switch (location) {
      case '/catalog':
        exportData = { type: 'catalog', timestamp };
        filename = `data_catalog_${timestamp}.json`;
        break;
      case '/data-sources':
        exportData = { type: 'data-sources', timestamp };
        filename = `data_sources_${timestamp}.json`;
        break;
      case '/dq-monitoring':
        exportData = { type: 'quality-rules', timestamp };
        filename = `quality_rules_${timestamp}.json`;
        break;
      default:
        exportData = { type: 'general', timestamp };
        filename = `export_${timestamp}.json`;
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate all queries to force refresh
      await queryClient.invalidateQueries();
      console.log('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFilter = () => {
    setShowFilter(!showFilter);
    console.log('Filter panel toggled:', !showFilter);
  };

  const handleSearch = () => {
    setShowSearch(!showSearch);
    console.log('Search panel toggled:', !showSearch);
  };

  return (
    <div className="bg-gray-50 border-b border-gray-300 flex flex-col">
      {/* Title Bar */}
      <div className="bg-white px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">Data Control Tower</span>
          <span className="text-xs text-gray-500">- Enterprise Data Platform</span>
        </div>
        <div className="flex items-center space-x-1">
          <button className="p-1 hover:bg-gray-100 rounded">
            <div className="w-3 h-3 border border-gray-400"></div>
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <div className="w-3 h-3 border border-gray-400"></div>
          </button>
          <button className="p-1 hover:bg-gray-100 rounded text-red-500">×</button>
        </div>
      </div>

      {/* Combined Tab Bar and Ribbon Toolbar */}
      <div className="bg-white border-b border-gray-300">
        <div className="flex items-center justify-between px-4 h-10">
          {/* Left side: Navigation Tabs */}
          <div className="flex items-center h-full">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "px-4 py-2 text-xs font-medium cursor-pointer transition-colors border-b-2 h-full flex items-center",
                    isActive 
                      ? "border-blue-600 text-blue-600 bg-blue-50" 
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}>
                    {item.name}
                  </div>
                </Link>
              );
            })}
            <Link href="/settings">
              <div className={cn(
                "px-4 py-2 text-xs font-medium cursor-pointer transition-colors border-b-2 h-full flex items-center",
                location === "/settings"
                  ? "border-blue-600 text-blue-600 bg-blue-50" 
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}>
                Settings
              </div>
            </Link>
          </div>

          {/* Right side: Toolbar Actions and Status */}
          <div className="flex items-center space-x-6 h-full">
            {/* File Group */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-700 tracking-wide">FILE</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleImport}
                  className="flex items-center space-x-1 px-3 py-1.5 hover:bg-gray-100 rounded text-xs text-gray-600 hover:text-gray-900 transition-colors border border-transparent hover:border-gray-300"
                >
                  <Upload className="w-3 h-3" />
                  <span className="font-medium">Import</span>
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-1 px-3 py-1.5 hover:bg-gray-100 rounded text-xs text-gray-600 hover:text-gray-900 transition-colors border border-transparent hover:border-gray-300"
                >
                  <Download className="w-3 h-3" />
                  <span className="font-medium">Export</span>
                </button>
              </div>
            </div>

            <div className="w-px h-6 bg-gray-300"></div>

            {/* Data Group */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-700 tracking-wide">DATA</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center space-x-1 px-3 py-1.5 hover:bg-gray-100 rounded text-xs text-gray-600 hover:text-gray-900 transition-colors border border-transparent hover:border-gray-300 disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
                  <span className="font-medium">Refresh</span>
                </button>
                <button
                  onClick={handleFilter}
                  className={cn(
                    "flex items-center space-x-1 px-3 py-1.5 rounded text-xs transition-colors border",
                    showFilter 
                      ? "bg-blue-100 text-blue-700 border-blue-300" 
                      : "hover:bg-gray-100 text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300"
                  )}
                >
                  <Filter className="w-3 h-3" />
                  <span className="font-medium">Filter</span>
                </button>
                <button
                  onClick={handleSearch}
                  className={cn(
                    "flex items-center space-x-1 px-3 py-1.5 rounded text-xs transition-colors border",
                    showSearch 
                      ? "bg-blue-100 text-blue-700 border-blue-300" 
                      : "hover:bg-gray-100 text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300"
                  )}
                >
                  <Search className="w-3 h-3" />
                  <span className="font-medium">Search</span>
                </button>
              </div>
            </div>

            <div className="w-px h-6 bg-gray-300"></div>

            {/* Status Info */}
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <span className="font-medium">Ready</span>
              <span className="text-gray-300">|</span>
              <span className="whitespace-nowrap">Connected to 3 sources</span>
              <span className="text-gray-300">|</span>
              <span className="whitespace-nowrap">Last updated: 2 min ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Panel */}
      {showSearch && (
        <div className="bg-white border-b border-gray-300 px-4 py-3">
          <div className="flex items-center space-x-3">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search across all data assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={() => setSearchQuery("")}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              Clear
            </button>
          </div>
          {searchQuery && (
            <div className="mt-2 text-xs text-gray-500">
              Press Enter to search for "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Filter Panel */}
      {showFilter && (
        <div className="bg-white border-b border-gray-300 px-4 py-3">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-700">Source Type:</span>
              <select className="text-xs border border-gray-300 rounded px-2 py-1">
                <option value="">All</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="snowflake">Snowflake</option>
                <option value="sqlserver">SQL Server</option>
                <option value="mysql">MySQL</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-700">Status:</span>
              <select className="text-xs border border-gray-300 rounded px-2 py-1">
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
              </select>
            </div>
            <button
              onClick={() => setShowFilter(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
