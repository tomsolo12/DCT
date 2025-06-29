import { Table } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DataTable } from "@shared/schema";

interface MetadataTableProps {
  tables?: DataTable[];
  searchQuery: string;
  onTableSelect: (tableId: number) => void;
}

export default function MetadataTable({ tables, searchQuery, onTableSelect }: MetadataTableProps) {
  if (!tables || tables.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">No tables found</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            No data tables available. Try scanning your data sources.
          </div>
        </div>
      </div>
    );
  }

  // Filter tables based on search query
  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock data quality scores for demonstration
  const getMockDQScore = (tableId: number) => {
    const scores = [96, 78, 92, 85, 67];
    return scores[tableId % scores.length];
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-600";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getSourceBadgeColor = (sourceId: number) => {
    const colors = ["bg-blue-100 text-blue-800", "bg-green-100 text-green-800", "bg-red-100 text-red-800"];
    return colors[sourceId % colors.length];
  };

  const formatLastScan = (date: Date | null) => {
    if (!date) return "Never";
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "< 1 hour ago";
    if (diffHours < 24) return `${diffHours} hrs ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filter Bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="flex items-center space-x-4">
          <Select defaultValue="all-sources">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-sources">All Sources</SelectItem>
              <SelectItem value="snowflake">Snowflake</SelectItem>
              <SelectItem value="postgresql">PostgreSQL</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-tables">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-tables">All Tables</SelectItem>
              <SelectItem value="tables">Tables</SelectItem>
              <SelectItem value="views">Views</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-tags">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-tags">All Tags</SelectItem>
              <SelectItem value="pii">PII</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1"></div>
          <span className="text-sm text-gray-600">
            Showing {filteredTables.length} of {tables.length} tables
          </span>
        </div>
      </div>

      {/* Metadata Table */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Scan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fields
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DQ Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTables.map((table) => {
                const dqScore = getMockDQScore(table.id);
                return (
                  <tr key={table.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Table className="w-4 h-4 text-blue-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{table.name}</div>
                          <div className="text-xs text-gray-500">{table.fullName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <Badge className={getSourceBadgeColor(table.sourceId!)}>
                        Source {table.sourceId}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatLastScan(table.lastScanAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{table.fieldCount}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className={`h-2 rounded-full ${getScoreColor(dqScore)}`}
                            style={{ width: `${dqScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{dqScore}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {table.tags && table.tags.length > 0 ? (
                          table.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                          ))
                        ) : (
                          <Badge variant="outline">No tags</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onTableSelect(table.id)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
