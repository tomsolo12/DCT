import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import KPICards from "@/components/dashboard/kpi-cards";
import DQScoreChart from "@/components/dashboard/dq-score-chart";
import RecentActivity from "@/components/dashboard/recent-activity";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    queryFn: () => api.getDashboardMetrics(),
  });

  const { data: activityLogs } = useQuery({
    queryKey: ["/api/activity-logs"],
    queryFn: () => api.getActivityLogs(10),
  });

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Grid Area */}
        <div className="h-full bg-white border border-gray-300">
          {/* Column Headers */}
          <div className="bg-gray-100 border-b border-gray-300 grid grid-cols-6 text-xs font-medium text-gray-700">
            <div className="px-3 py-2 border-r border-gray-300">Metric</div>
            <div className="px-3 py-2 border-r border-gray-300">Current Value</div>
            <div className="px-3 py-2 border-r border-gray-300">Previous</div>
            <div className="px-3 py-2 border-r border-gray-300">Change</div>
            <div className="px-3 py-2 border-r border-gray-300">Status</div>
            <div className="px-3 py-2">Last Updated</div>
          </div>

          {/* Data Rows */}
          <div className="overflow-y-auto">
            {/* KPI Metrics as Rows */}
            <div className="grid grid-cols-6 text-sm border-b border-gray-200 hover:bg-gray-50">
              <div className="px-3 py-2 border-r border-gray-300 font-medium">Data Sources</div>
              <div className="px-3 py-2 border-r border-gray-300">{metrics?.totalSources || 0}</div>
              <div className="px-3 py-2 border-r border-gray-300">0</div>
              <div className="px-3 py-2 border-r border-gray-300 text-green-600">+{metrics?.totalSources || 0}</div>
              <div className="px-3 py-2 border-r border-gray-300">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Active</span>
              </div>
              <div className="px-3 py-2 text-gray-500">Just now</div>
            </div>

            <div className="grid grid-cols-6 text-sm border-b border-gray-200 hover:bg-gray-50">
              <div className="px-3 py-2 border-r border-gray-300 font-medium">Tables Cataloged</div>
              <div className="px-3 py-2 border-r border-gray-300">{metrics?.totalTables?.toLocaleString() || 0}</div>
              <div className="px-3 py-2 border-r border-gray-300">0</div>
              <div className="px-3 py-2 border-r border-gray-300 text-green-600">+{metrics?.totalTables || 0}</div>
              <div className="px-3 py-2 border-r border-gray-300">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Synced</span>
              </div>
              <div className="px-3 py-2 text-gray-500">2 min ago</div>
            </div>

            <div className="grid grid-cols-6 text-sm border-b border-gray-200 hover:bg-gray-50">
              <div className="px-3 py-2 border-r border-gray-300 font-medium">DQ Rules</div>
              <div className="px-3 py-2 border-r border-gray-300">{metrics?.totalRules || 0}</div>
              <div className="px-3 py-2 border-r border-gray-300">0</div>
              <div className="px-3 py-2 border-r border-gray-300 text-green-600">+{metrics?.totalRules || 0}</div>
              <div className="px-3 py-2 border-r border-gray-300">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Configured</span>
              </div>
              <div className="px-3 py-2 text-gray-500">5 min ago</div>
            </div>

            <div className="grid grid-cols-6 text-sm border-b border-gray-200 hover:bg-gray-50">
              <div className="px-3 py-2 border-r border-gray-300 font-medium">DQ Pass Rate</div>
              <div className="px-3 py-2 border-r border-gray-300">{metrics?.avgQualityScore?.toFixed(1) || 0}%</div>
              <div className="px-3 py-2 border-r border-gray-300">0%</div>
              <div className="px-3 py-2 border-r border-gray-300 text-green-600">+{metrics?.avgQualityScore?.toFixed(1) || 0}%</div>
              <div className="px-3 py-2 border-r border-gray-300">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Good</span>
              </div>
              <div className="px-3 py-2 text-gray-500">1 hour ago</div>
            </div>

            {/* Recent Activity Section */}
            <div className="border-t-4 border-gray-400 mt-4">
              <div className="bg-gray-100 border-b border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">
                RECENT ACTIVITY LOG
              </div>
              <div className="grid grid-cols-4 text-xs font-medium text-gray-700 bg-gray-50 border-b border-gray-300">
                <div className="px-3 py-2 border-r border-gray-300">Timestamp</div>
                <div className="px-3 py-2 border-r border-gray-300">Event Type</div>
                <div className="px-3 py-2 border-r border-gray-300">Description</div>
                <div className="px-3 py-2">Status</div>
              </div>
              
              {activityLogs && activityLogs.length > 0 ? (
                activityLogs.slice(0, 10).map((log, index) => (
                  <div key={log.id} className="grid grid-cols-4 text-sm border-b border-gray-200 hover:bg-gray-50">
                    <div className="px-3 py-2 border-r border-gray-300 text-gray-600 font-mono">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                    </div>
                    <div className="px-3 py-2 border-r border-gray-300 font-medium">
                      {log.type.toUpperCase()}
                    </div>
                    <div className="px-3 py-2 border-r border-gray-300">
                      {log.description}
                    </div>
                    <div className="px-3 py-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">COMPLETED</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-4 text-sm border-b border-gray-200">
                  <div className="px-3 py-8 col-span-4 text-center text-gray-500">
                    No activity logs available
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 border-t border-gray-300 px-4 py-1 text-xs text-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Row 1 of {4 + (activityLogs?.length || 0)}</span>
          <span>|</span>
          <span>Ready</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Last Refresh: {new Date().toLocaleTimeString()}</span>
          <span>|</span>
          <span>Zoom: 100%</span>
        </div>
      </div>
    </div>
  );
}
