import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function DQScoreChart() {
  const { data: sources } = useQuery({
    queryKey: ["/api/data-sources"],
    queryFn: () => api.getDataSources(),
  });

  // Mock data quality scores for demonstration
  const mockScores = [
    { name: "Snowflake - Finance DB", score: 96, color: "bg-blue-600" },
    { name: "PostgreSQL - Marketing DB", score: 89, color: "bg-green-600" },
    { name: "SQL Server - Operations DB", score: 72, color: "bg-purple-600" },
    { name: "MySQL - Legacy System", score: 58, color: "bg-red-600" },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-600";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Data Quality Score by Source</CardTitle>
          <Select defaultValue="7days">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockScores.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getScoreColor(item.score)}`}
                    style={{ width: `${item.score}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 w-12">{item.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
