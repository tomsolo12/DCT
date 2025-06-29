import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

interface TableDetailModalProps {
  tableId: number;
  onClose: () => void;
}

export default function TableDetailModal({ tableId, onClose }: TableDetailModalProps) {
  const { data: table } = useQuery({
    queryKey: ["/api/data-tables", tableId],
    queryFn: () => api.getDataTable(tableId),
  });

  const { data: fields } = useQuery({
    queryKey: ["/api/data-tables", tableId, "fields"],
    queryFn: () => api.getDataFields(tableId),
    enabled: !!tableId,
  });

  if (!table) {
    return null;
  }

  // Mock additional data
  const mockStats = {
    recordCount: 2847392,
    dqScore: 96,
    lastUpdated: "2 hours ago"
  };

  const getViolationStatus = (fieldName: string) => {
    const violations = {
      "email": { count: 3, status: "warning" },
      "customer_id": { count: 0, status: "clean" },
      "created_date": { count: 0, status: "clean" },
    };
    return violations[fieldName as keyof typeof violations] || { count: 0, status: "clean" };
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">{table.name}</DialogTitle>
              <p className="text-sm text-gray-600">{table.fullName} • Source {table.sourceId}</p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-gray-900 mb-1">Total Records</div>
              <div className="text-2xl font-semibold text-gray-900">{mockStats.recordCount.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-gray-900 mb-1">Data Quality Score</div>
              <div className="text-2xl font-semibold text-green-600">{mockStats.dqScore}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-gray-900 mb-1">Last Updated</div>
              <div className="text-sm text-gray-900">{mockStats.lastUpdated}</div>
            </CardContent>
          </Card>
        </div>

        {/* Business Tags */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Business Tags</h4>
          <div className="flex flex-wrap gap-2 mb-2">
            {table.tags && table.tags.length > 0 ? (
              table.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">{tag}</Badge>
              ))
            ) : (
              <Badge variant="outline">No tags assigned</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm">+ Add Tag</Button>
        </div>

        {/* Schema Fields */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Schema Fields ({fields?.length || 0} fields)
          </h4>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Field Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nullable
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sample Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Violations
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields && fields.length > 0 ? (
                  fields.map((field) => {
                    const violation = getViolationStatus(field.name);
                    return (
                      <tr key={field.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{field.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{field.dataType}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{field.isNullable ? "Yes" : "No"}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{field.sampleValue || "N/A"}</td>
                        <td className="px-4 py-3">
                          {violation.status === "clean" ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              ✓ Clean
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              ⚠ {violation.count} issues
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No fields information available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
