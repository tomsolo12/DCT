import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users, Shield, FileText, AlertTriangle, Plus, Search } from "lucide-react";
import { useState } from "react";

export default function Governance() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: sources } = useQuery({
    queryKey: ["/api/data-sources"],
    queryFn: () => api.getDataSources(),
  });

  // Mock governance data for demonstration
  const mockUsers = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@company.com",
      role: "Data Owner",
      department: "Finance",
      lastActive: "2 hours ago",
      status: "active"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      role: "Data Steward",
      department: "Marketing",
      lastActive: "1 day ago",
      status: "active"
    },
    {
      id: 3,
      name: "Mike Davis",
      email: "mike.davis@company.com",
      role: "Data Analyst",
      department: "Operations",
      lastActive: "3 days ago",
      status: "inactive"
    }
  ];

  const mockPolicies = [
    {
      id: 1,
      name: "PII Data Handling Policy",
      description: "Guidelines for handling personally identifiable information",
      category: "Privacy",
      status: "active",
      lastUpdated: "2024-01-15",
      compliance: 95
    },
    {
      id: 2,
      name: "Data Retention Policy",
      description: "Rules for data retention and archival",
      category: "Retention",
      status: "active",
      lastUpdated: "2024-01-10",
      compliance: 87
    },
    {
      id: 3,
      name: "Data Quality Standards",
      description: "Minimum quality requirements for all datasets",
      category: "Quality",
      status: "draft",
      lastUpdated: "2024-01-20",
      compliance: 72
    }
  ];

  const mockViolations = [
    {
      id: 1,
      type: "PII Exposure",
      severity: "high",
      table: "customer_emails",
      description: "Unencrypted PII data detected in production environment",
      reportedBy: "System Scan",
      reportedAt: "2 hours ago",
      status: "open"
    },
    {
      id: 2,
      type: "Data Retention",
      severity: "medium",
      table: "transaction_logs",
      description: "Data retained beyond policy limits (7 years)",
      reportedBy: "Sarah Johnson",
      reportedAt: "1 day ago",
      status: "investigating"
    },
    {
      id: 3,
      type: "Access Control",
      severity: "low",
      table: "employee_data",
      description: "Unusual access pattern detected",
      reportedBy: "Security Monitor",
      reportedAt: "3 days ago",
      status: "resolved"
    }
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Data Owner":
        return "bg-purple-100 text-purple-800";
      case "Data Steward":
        return "bg-blue-100 text-blue-800";
      case "Data Analyst":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">🚨 High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">⚠️ Medium</Badge>;
      case "low":
        return <Badge className="bg-blue-100 text-blue-800">ℹ️ Low</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">✅ Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">⏸️ Inactive</Badge>;
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">📝 Draft</Badge>;
      case "open":
        return <Badge className="bg-red-100 text-red-800">🔴 Open</Badge>;
      case "investigating":
        return <Badge className="bg-yellow-100 text-yellow-800">🔍 Investigating</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">✅ Resolved</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Filter Bar */}
      <div className="bg-gray-50 border-b border-gray-300 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search users, policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 h-7 text-xs pl-8 border-gray-300"
              />
              <Search className="w-3 h-3 text-gray-400 absolute left-2 top-2" />
            </div>
            <Select defaultValue="all-categories">
              <SelectTrigger className="w-32 h-7 text-xs border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-categories">All Categories</SelectItem>
                <SelectItem value="privacy">Privacy</SelectItem>
                <SelectItem value="retention">Retention</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="text-xs h-7">
              <Plus className="w-3 h-3 mr-1" />
              Add Policy
            </Button>
          </div>
          
          <div className="text-xs text-gray-500">
            Compliance Score: 85% | {mockViolations.filter(v => v.status === 'open').length} Open Violations
          </div>
        </div>
      </div>

      {/* Content Area - Multi-pane view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Users & Roles */}
        <div className="w-1/3 border-r border-gray-300 flex flex-col">
          <div className="bg-gray-100 border-b border-gray-300 px-3 py-1 text-xs font-medium text-gray-700">
            USERS & ROLES
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="bg-gray-100 border-b border-gray-300 grid grid-cols-4 text-xs font-medium text-gray-700">
              <div className="px-3 py-2 border-r border-gray-300">Name</div>
              <div className="px-3 py-2 border-r border-gray-300">Role</div>
              <div className="px-3 py-2 border-r border-gray-300">Department</div>
              <div className="px-3 py-2">Status</div>
            </div>
            {mockUsers.map((user) => (
              <div key={user.id} className="grid grid-cols-4 text-sm border-b border-gray-200 hover:bg-gray-50">
                <div className="px-3 py-2 border-r border-gray-300">
                  <div className="font-medium text-blue-600">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                <div className="px-3 py-2 border-r border-gray-300 text-gray-600 uppercase text-xs">
                  {user.role}
                </div>
                <div className="px-3 py-2 border-r border-gray-300 text-gray-600">
                  {user.department}
                </div>
                <div className="px-3 py-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Panel: Data Policies */}
        <div className="w-1/3 border-r border-gray-300 flex flex-col">
          <div className="bg-gray-100 border-b border-gray-300 px-3 py-1 text-xs font-medium text-gray-700">
            DATA POLICIES
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="bg-gray-100 border-b border-gray-300 grid grid-cols-3 text-xs font-medium text-gray-700">
              <div className="px-3 py-2 border-r border-gray-300">Policy Name</div>
              <div className="px-3 py-2 border-r border-gray-300">Category</div>
              <div className="px-3 py-2">Compliance</div>
            </div>
            {mockPolicies.map((policy) => (
              <div key={policy.id} className="grid grid-cols-3 text-sm border-b border-gray-200 hover:bg-gray-50">
                <div className="px-3 py-2 border-r border-gray-300">
                  <div className="font-medium text-blue-600">{policy.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{policy.description}</div>
                  <div className="text-xs text-gray-400 mt-1">Updated: {policy.lastUpdated}</div>
                </div>
                <div className="px-3 py-2 border-r border-gray-300">
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 uppercase">
                    {policy.category}
                  </span>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded ${
                      policy.status === 'active' ? 'bg-green-100 text-green-800' : 
                      policy.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {policy.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="px-3 py-2 text-right">
                  <span className={`px-2 py-1 text-xs rounded font-mono ${
                    policy.compliance >= 90 ? 'bg-green-100 text-green-800' :
                    policy.compliance >= 70 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {policy.compliance}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Policy Violations */}
        <div className="w-1/3 flex flex-col">
          <div className="bg-gray-100 border-b border-gray-300 px-3 py-1 text-xs font-medium text-gray-700">
            POLICY VIOLATIONS
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="bg-gray-100 border-b border-gray-300 grid grid-cols-3 text-xs font-medium text-gray-700">
              <div className="px-3 py-2 border-r border-gray-300">Violation Type</div>
              <div className="px-3 py-2 border-r border-gray-300">Severity</div>
              <div className="px-3 py-2">Status</div>
            </div>
            {mockViolations.map((violation) => (
              <div key={violation.id} className="grid grid-cols-3 text-sm border-b border-gray-200 hover:bg-gray-50">
                <div className="px-3 py-2 border-r border-gray-300">
                  <div className="font-medium text-red-600">{violation.type}</div>
                  <div className="text-xs text-gray-500 mt-1">{violation.description}</div>
                  <div className="text-xs text-gray-400 mt-1">Table: {violation.table}</div>
                  <div className="text-xs text-gray-400">By: {violation.reportedBy}</div>
                </div>
                <div className="px-3 py-2 border-r border-gray-300">
                  <span className={`px-2 py-1 text-xs rounded uppercase ${
                    violation.severity === 'high' ? 'bg-red-100 text-red-800' :
                    violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {violation.severity}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">{violation.reportedAt}</div>
                </div>
                <div className="px-3 py-2">
                  <span className={`px-2 py-1 text-xs rounded uppercase ${
                    violation.status === 'open' ? 'bg-red-100 text-red-800' :
                    violation.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {violation.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Panel: Compliance Summary */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2">
        <div className="grid grid-cols-3 gap-6 text-xs">
          <div className="flex items-center space-x-3">
            <span className="font-medium text-gray-700">PII PROTECTION:</span>
            <div className="flex-1 bg-gray-200 rounded h-2">
              <div className="bg-green-600 h-2 rounded" style={{ width: "95%" }}></div>
            </div>
            <span className="font-mono text-gray-600">95%</span>
            <span className="text-gray-500">(12/13 systems)</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="font-medium text-gray-700">DATA RETENTION:</span>
            <div className="flex-1 bg-gray-200 rounded h-2">
              <div className="bg-yellow-500 h-2 rounded" style={{ width: "87%" }}></div>
            </div>
            <span className="font-mono text-gray-600">87%</span>
            <span className="text-gray-500">(15/17 policies)</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="font-medium text-gray-700">ACCESS CONTROL:</span>
            <div className="flex-1 bg-gray-200 rounded h-2">
              <div className="bg-red-500 h-2 rounded" style={{ width: "72%" }}></div>
            </div>
            <span className="font-mono text-gray-600">72%</span>
            <span className="text-gray-500">(8/11 controls)</span>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 border-t border-gray-300 px-4 py-1 text-xs text-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Users: {mockUsers.length}</span>
          <span>|</span>
          <span>Policies: {mockPolicies.length}</span>
          <span>|</span>
          <span>Violations: {mockViolations.length}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Overall Compliance: 85%</span>
          <span>|</span>
          <span>Last Updated: 2 hours ago</span>
        </div>
      </div>
    </div>
  );
}