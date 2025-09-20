import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Bug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

interface AdminInfo {
  isAdmin: boolean;
  userId: string;
  role: string;
  tier: string;
}

export function AdminDebugPanel() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    try {
      // Test 1: Check if user is admin
      try {
        const user = await apiRequest("GET", "/api/user");
        setAdminInfo({
          isAdmin: user.role === 'admin',
          userId: user.id,
          role: user.role,
          tier: user.tier
        });

        if (user.role === 'admin') {
          results.push({
            name: "Admin Authentication",
            status: "pass",
            message: "User has admin privileges",
            details: { role: user.role, tier: user.tier }
          });
        } else {
          results.push({
            name: "Admin Authentication",
            status: "fail",
            message: `User role is '${user.role}', expected 'admin'`,
            details: user
          });
        }
      } catch (error: any) {
        results.push({
          name: "Admin Authentication",
          status: "fail",
          message: "Failed to get user info",
          details: error.message
        });
      }

      // Test 2: Check admin stats endpoint
      try {
        await apiRequest("GET", "/api/admin/stats");
        results.push({
          name: "Admin Stats API",
          status: "pass",
          message: "Stats endpoint is accessible"
        });
      } catch (error: any) {
        results.push({
          name: "Admin Stats API",
          status: "fail",
          message: `Stats endpoint failed: ${error.message}`,
          details: error
        });
      }

      // Test 3: Check admin users endpoint
      try {
        const users = await apiRequest("GET", "/api/admin/users");
        results.push({
          name: "Admin Users API",
          status: "pass",
          message: `Retrieved ${Array.isArray(users) ? users.length : 0} users`,
          details: { userCount: Array.isArray(users) ? users.length : 0 }
        });
      } catch (error: any) {
        results.push({
          name: "Admin Users API",
          status: "fail",
          message: `Users endpoint failed: ${error.message}`,
          details: error
        });
      }

      // Test 4: Check admin transactions endpoint
      try {
        await apiRequest("GET", "/api/admin/transactions");
        results.push({
          name: "Admin Transactions API",
          status: "pass",
          message: "Transactions endpoint is accessible"
        });
      } catch (error: any) {
        results.push({
          name: "Admin Transactions API",
          status: "fail",
          message: `Transactions endpoint failed: ${error.message}`,
          details: error
        });
      }

      // Test 5: Test user update functionality
      if (adminInfo?.isAdmin) {
        try {
          // Try to update user with dummy data (should validate but not actually update)
          await apiRequest("PATCH", `/api/admin/users/test-user-id`, {
            firstName: "Test"
          });
        } catch (error: any) {
          if (error.message.includes("not found")) {
            results.push({
              name: "User Update API",
              status: "pass",
              message: "Update endpoint is working (404 expected for test)"
            });
          } else {
            results.push({
              name: "User Update API",
              status: "warning",
              message: `Update endpoint response: ${error.message}`,
              details: error
            });
          }
        }
      }

      setDiagnostics(results);

      // Summary toast
      const passed = results.filter(r => r.status === 'pass').length;
      const failed = results.filter(r => r.status === 'fail').length;
      const warnings = results.filter(r => r.status === 'warning').length;

      toast({
        title: "Diagnostics Complete",
        description: `${passed} passed, ${failed} failed, ${warnings} warnings`,
        variant: failed > 0 ? "destructive" : "default"
      });

    } catch (error: any) {
      toast({
        title: "Diagnostics Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return "bg-green-100 text-green-800 border-green-200";
      case 'fail': return "bg-red-100 text-red-800 border-red-200";
      case 'warning': return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  useEffect(() => {
    // Auto-run diagnostics on component mount
    runDiagnostics();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            <div>
              <CardTitle>Admin Panel Diagnostics</CardTitle>
              <CardDescription>
                Debug admin panel functionality and identify issues
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            variant="outline"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Diagnostics
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Admin Info */}
        {adminInfo && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Current User Info</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Role:</span>
                <Badge className={adminInfo.role === 'admin' ? 'ml-2 bg-green-500' : 'ml-2 bg-red-500'}>
                  {adminInfo.role}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">Tier:</span>
                <Badge variant="outline" className="ml-2">{adminInfo.tier}</Badge>
              </div>
              <div>
                <span className="text-gray-500">Admin Access:</span>
                <Badge className={adminInfo.isAdmin ? 'ml-2 bg-green-500' : 'ml-2 bg-red-500'}>
                  {adminInfo.isAdmin ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">User ID:</span>
                <code className="ml-2 text-xs bg-gray-200 px-1 rounded">
                  {adminInfo.userId.slice(0, 8)}...
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic Results */}
        <div>
          <h3 className="text-sm font-medium mb-4">Test Results</h3>
          <div className="space-y-3">
            {diagnostics.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No diagnostics run yet. Click "Run Diagnostics" to start.
              </div>
            ) : (
              diagnostics.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  {getStatusIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {result.status}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                          Show details
                        </summary>
                        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Fixes */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-2 text-blue-900">Common Solutions</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Ensure you're logged in as an admin user</p>
            <p>• Clear browser cache and cookies</p>
            <p>• Check browser console for JavaScript errors</p>
            <p>• Verify database constraints are up to date</p>
            <p>• Try refreshing the page</p>
          </div>
        </div>

        {/* Summary */}
        {diagnostics.length > 0 && (
          <div className="flex items-center gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">
                {diagnostics.filter(r => r.status === 'pass').length} Passed
              </span>
            </div>
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">
                {diagnostics.filter(r => r.status === 'fail').length} Failed
              </span>
            </div>
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                {diagnostics.filter(r => r.status === 'warning').length} Warnings
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}