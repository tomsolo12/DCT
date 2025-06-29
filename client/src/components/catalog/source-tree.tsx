import { useState } from "react";
import { ChevronRight, ChevronDown, Database, Folder, Table } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataSource } from "@shared/schema";
import { cn } from "@/lib/utils";

interface SourceTreeProps {
  sources?: DataSource[];
}

export default function SourceTree({ sources }: SourceTreeProps) {
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());

  const toggleSource = (sourceId: number) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sourceId)) {
        newSet.delete(sourceId);
      } else {
        newSet.add(sourceId);
      }
      return newSet;
    });
  };

  const getSourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "snowflake":
        return "text-blue-600";
      case "postgresql":
        return "text-green-600";
      case "sqlserver":
        return "text-red-600";
      case "mysql":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const mockDatabases = {
    1: [{ name: "Finance_DB", tables: 47 }, { name: "Marketing_DB", tables: 23 }],
    2: [{ name: "Operations_DB", tables: 15 }],
  };

  const mockTables = [
    { name: "customers", status: "high" },
    { name: "transactions", status: "medium" },
    { name: "accounts", status: "high" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "high":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (!sources || sources.length === 0) {
    return (
      <aside className="w-80 bg-white border-r border-gray-200">
        <Card className="m-4">
          <CardHeader>
            <CardTitle className="text-sm">Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              No data sources available
            </div>
          </CardContent>
        </Card>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Data Sources</h3>
        <div className="space-y-2">
          {sources.map((source) => {
            const isExpanded = expandedSources.has(source.id);
            return (
              <div key={source.id} className="space-y-1">
                <div 
                  className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => toggleSource(source.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400 mr-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                  )}
                  <Database className={cn("w-4 h-4 mr-2", getSourceIcon(source.type))} />
                  <span className="text-sm font-medium text-gray-900">{source.name}</span>
                  <span className="ml-auto text-xs text-gray-500">
                    {mockDatabases[source.id as keyof typeof mockDatabases]?.length || 0} DBs
                  </span>
                </div>
                
                {isExpanded && mockDatabases[source.id as keyof typeof mockDatabases] && (
                  <div className="ml-6 space-y-1">
                    {mockDatabases[source.id as keyof typeof mockDatabases].map((db, dbIndex) => (
                      <div key={dbIndex}>
                        <div className="flex items-center py-1 px-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <ChevronDown className="w-4 h-4 text-gray-400 mr-2" />
                          <Folder className="w-4 h-4 text-amber-600 mr-2" />
                          <span className="text-sm text-gray-700">{db.name}</span>
                          <span className="ml-auto text-xs text-gray-500">{db.tables} tables</span>
                        </div>
                        
                        <div className="ml-6 space-y-1">
                          {mockTables.map((table, tableIndex) => (
                            <div key={tableIndex} className="flex items-center py-1 px-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                              <Table className="w-4 h-4 text-blue-600 mr-2" />
                              <span className="text-sm text-gray-700">{table.name}</span>
                              <span className={`ml-auto w-2 h-2 ${getStatusColor(table.status)} rounded-full`}></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-2">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center text-xs text-gray-600">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            High Quality (90%+)
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
            Medium Quality (70-89%)
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            Low Quality (&lt;70%)
          </div>
        </div>
      </div>
    </aside>
  );
}
