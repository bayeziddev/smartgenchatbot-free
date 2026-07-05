import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Activity, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ActivityPage() {
  const activityQuery = trpc.activity.list.useQuery({ limit: 100 });

  const activities = activityQuery.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">
            View all automated replies and rule executions.
          </p>
        </div>

        {/* Activity Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activities.length}</div>
              <p className="text-xs text-muted-foreground mt-2">automated replies</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activities.filter((a) => a.status === "success").length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">replies sent</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activities.filter((a) => a.status === "failed").length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">errors</p>
            </CardContent>
          </Card>
        </div>

        {/* Activity List */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>Chronological record of all automated replies</CardDescription>
          </CardHeader>
          <CardContent>
            {activityQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No activity yet</p>
                <p className="text-muted-foreground text-center">
                  Automated replies will appear here as they are triggered.
                </p>
              </div>
            ) : (
              <div className="space-y-0 divide-y">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="py-4 first:pt-0 last:pb-0 hover:bg-muted/30 transition-colors px-3 -mx-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-sm">
                            {activity.matchedKeyword}
                          </p>
                          <Badge
                            variant={
                              activity.status === "success" ? "default" : "destructive"
                            }
                            className="text-xs"
                          >
                            {activity.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          From: <span className="font-mono">{activity.contact}</span>
                        </p>
                        <div className="bg-muted p-2 rounded text-sm mb-2">
                          <p className="text-xs text-muted-foreground mb-1">Response:</p>
                          <p className="text-foreground break-words">
                            {activity.sentResponse}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                        {activity.errorMessage && (
                          <p className="text-xs text-destructive mt-2">
                            Error: {activity.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
