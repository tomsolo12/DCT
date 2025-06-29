import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X, Database, FileText, CheckCircle, AlertCircle, Key, Hash } from "lucide-react";

interface TableDetailModalProps {
  tableId: number;
  onClose: () => void;
}

export default function TableDetailModal({ tableId, onClose }: TableDetailModalProps) {
  const { data: table, isLoading } = useQuery({
    queryKey: [`/api/data-tables/${tableId}`],
    enabled: !!tableId,
  });

  const { data: fields } = useQuery({
    queryKey: [`/api/data-tables/${tableId}/fields`],
    enabled: !!tableId,
  });

  const { data: qualityResults } = useQuery({
    queryKey: [`/api/data-tables/${tableId}/quality-results`],
    enabled: !!tableId,
  });

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading table details...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!table) {
    return null;
  }

  const getDataTypeIcon = (dataType: string) => {
    if (dataType.toLowerCase().includes('char') || dataType.toLowerCase().includes('text')) {
      return <FileText className="w-4 h-4 text-blue-500" />;
    }
    if (dataType.toLowerCase().includes('int') || dataType.toLowerCase().includes('decimal') || dataType.toLowerCase().includes('float')) {
      return <Hash className="w-4 h-4 text-green-500" />;
    }
    return <Database className="w-4 h-4 text-gray-500" />;
  };

  const getFieldBadges = (field: any) => {
    const badges = [];
    if (field.isPrimaryKey) badges.push(<Badge key="pk" variant="destructive" className="text-xs">PK</Badge>);
    if (field.isUnique) badges.push(<Badge key="unique" variant="outline" className="text-xs">UNIQUE</Badge>);
    if (!field.nullable) badges.push(<Badge key="nn" variant="secondary" className="text-xs">NOT NULL</Badge>);
    return badges;
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                {table.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                {table.schema} • Source: {table.sourceId} • Last Scan: {table.lastScanAt ? new Date(table.lastScanAt).toLocaleDateString() : 'Never'}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="fields" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fields">Fields ({fields?.length || 0})</TabsTrigger>
            <TabsTrigger value="quality">Data Quality</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Constraints</TableHead>
                    <TableHead>Max Length</TableHead>
                    <TableHead>Default Value</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields?.map((field: any, index: number) => (
                    <TableRow key={field.id} className="hover:bg-gray-50">
                      <TableCell className="text-center text-xs text-gray-500">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium flex items-center gap-2">
                        {getDataTypeIcon(field.dataType)}
                        {field.name}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {field.dataType}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {getFieldBadges(field)}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 font-mono text-xs">
                        {field.maxLength || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600 font-mono text-xs">
                        {field.defaultValue || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600 text-xs max-w-xs">
                        {field.description || '-'}
                      </TableCell>
                    </TableRow>
                  )) || []}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="quality" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {qualityResults?.length ? (
                  qualityResults.map((result: any) => (
                    <div key={result.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.passed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                          <span className="font-medium">{result.ruleName || 'Quality Rule'}</span>
                        </div>
                        <Badge variant={result.passed ? "default" : "destructive"}>
                          {result.passed ? 'PASSED' : 'FAILED'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Score: {result.score}% ({result.violationCount} violations out of {result.totalCount} records)
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            result.score >= 90 ? 'bg-green-500' :
                            result.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${result.score}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No quality rules have been executed for this table.
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="metadata" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Basic Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Table Name:</span>
                        <span className="font-mono">{table.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Schema:</span>
                        <span className="font-mono">{table.schema}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Full Name:</span>
                        <span className="font-mono">{table.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Source ID:</span>
                        <span>{table.sourceId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Field Count:</span>
                        <span>{table.fieldCount || fields?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Scan Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Scan:</span>
                        <span>{table.lastScanAt ? new Date(table.lastScanAt).toLocaleString() : 'Never'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span>{table.createdAt ? new Date(table.createdAt).toLocaleString() : 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {table.tags?.length ? (
                      table.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No tags assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}