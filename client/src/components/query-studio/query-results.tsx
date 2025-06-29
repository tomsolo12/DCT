import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { QueryResult } from "@/lib/api";

interface QueryResultsProps {
  results?: QueryResult | null;
  isLoading: boolean;
}

export default function QueryResults({ results, isLoading }: QueryResultsProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : results ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-max">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {results.columns.map((column) => (
                    <th key={column} className="px-4 py-2 text-left font-medium text-gray-900 border-b border-gray-200 whitespace-nowrap">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {results.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-gray-100 hover:bg-gray-50">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2 text-gray-900 whitespace-nowrap max-w-xs truncate" title={String(cell)}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Run a query to see results
          </div>
        )}
      </div>

      {/* DQ Warnings Tab - would be populated with real data quality warnings */}
      {results && (
        <div className="border-t border-gray-200 bg-yellow-50 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <h4 className="text-sm font-medium text-yellow-800">Data Quality Warnings</h4>
          </div>
          <div className="text-xs text-yellow-700">
            • Field 'email' has 3 formatting violations in the result set<br />
            • Field 'created_date' contains 1 future date anomaly
          </div>
        </div>
      )}
    </div>
  );
}
