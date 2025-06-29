import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, UserPlus, AlertTriangle, Code } from "lucide-react";
import type { ActivityLog } from "@shared/schema";

interface RecentActivityProps {
  logs?: ActivityLog[];
}

export default function RecentActivity({ logs }: RecentActivityProps) {
  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            No recent activity to display
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "scan":
        return <Check className="w-4 h-4 text-green-600" />;
      case "rule_created":
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case "issue_detected":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "query_executed":
        return <Code className="w-4 h-4 text-purple-600" />;
      default:
        return <Check className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityIconBg = (type: string) => {
    switch (type) {
      case "scan":
        return "bg-green-100";
      case "rule_created":
        return "bg-blue-100";
      case "issue_detected":
        return "bg-red-100";
      case "query_executed":
        return "bg-purple-100";
      default:
        return "bg-gray-100";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return "< 1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.slice(0, 4).map((log) => (
            <div key={log.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 ${getActivityIconBg(log.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                {getActivityIcon(log.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{log.description}</p>
                <p className="text-xs text-gray-500">{formatTimeAgo(log.createdAt!)}</p>
              </div>
            </div>
          ))}
        </div>

        {logs.length > 4 && (
          <div className="mt-6">
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              View all activity →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
