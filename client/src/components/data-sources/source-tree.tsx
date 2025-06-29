import { ChevronRight, ChevronDown, Database, Table, Folder } from "lucide-react";
import { useState } from "react";

interface SourceTreeProps {
  sources?: Array<{
    id: number;
    name: string;
    type: string;
    isActive: boolean | null;
  }>;
}

export default function SourceTree({ sources = [] }: SourceTreeProps) {
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());

  const toggleSource = (sourceId: number) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId);
    } else {
      newExpanded.add(sourceId);
    }
    setExpandedSources(newExpanded);
  };

  const toggleSchema = (schemaKey: string) => {
    const newExpanded = new Set(expandedSchemas);
    if (newExpanded.has(schemaKey)) {
      newExpanded.delete(schemaKey);
    } else {
      newExpanded.add(schemaKey);
    }
    setExpandedSchemas(newExpanded);
  };

  const getSourceIcon = (type: string) => {
    return <Database className="w-3 h-3" />;
  };

  return (
    <div className="p-2 text-xs overflow-y-auto">
      {sources.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          No data sources configured
        </div>
      ) : (
        sources.map((source) => {
          const isExpanded = expandedSources.has(source.id);
          
          return (
            <div key={source.id} className="mb-1">
              <div
                className="flex items-center py-1 px-2 hover:bg-gray-200 cursor-pointer rounded"
                onClick={() => toggleSource(source.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-500 mr-1" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-500 mr-1" />
                )}
                {getSourceIcon(source.type)}
                <span className="ml-2 flex-1 text-gray-800 font-medium truncate">
                  {source.name}
                </span>
                <div className={`w-2 h-2 rounded-full ml-1 ${
                  source.isActive ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              </div>
              
              {isExpanded && (
                <div className="ml-4 border-l border-gray-300 pl-2">
                  <div className="flex items-center py-1 px-2 text-gray-600">
                    <Folder className="w-3 h-3 mr-2" />
                    <span>Schemas</span>
                  </div>
                  
                  {/* Mock schema structure */}
                  <div className="ml-4">
                    <div className="flex items-center py-1 px-2 hover:bg-gray-200 cursor-pointer rounded">
                      <ChevronRight className="w-3 h-3 text-gray-500 mr-1" />
                      <Folder className="w-3 h-3 mr-2" />
                      <span className="text-gray-700">public</span>
                    </div>
                    
                    <div className="flex items-center py-1 px-2 hover:bg-gray-200 cursor-pointer rounded">
                      <ChevronRight className="w-3 h-3 text-gray-500 mr-1" />
                      <Folder className="w-3 h-3 mr-2" />
                      <span className="text-gray-700">analytics</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}