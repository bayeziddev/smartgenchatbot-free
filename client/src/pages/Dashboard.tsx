import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MessageCircle,
  Zap,
  Activity,
  Smartphone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch data
  const connectionQuery = trpc.whatsapp.getConnection.useQuery();
  const rulesQuery = trpc.rules.list.useQuery();
  const messagesQuery = trpc.messages.list.useQuery({ limit: 10 });
  const activityQuery = trpc.activity.list.useQuery({ limit: 5 });

  const isLoading =
    connectionQuery.isLoading ||
    rulesQuery.isLoading ||
    messagesQuery.isLoading ||
    activityQuery.isLoading;

  const connection = connectionQuery.data;
  const rules = rulesQuery.data || [];
  const messages = messagesQuery.data || [];
  const activities = activityQuery.data || [];

  const enabledRulesCount = rules.filter((r) => r.enabled).length;
  const incomingMessagesCount = messages.filter((m) => m.direction === "incoming").length;
  const recentActivityCount = activities.length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}. Here's your chatbot overview.
          </p>
        </div>

        {/* Status Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* WhatsApp Connection Status */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">WhatsApp Status</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {connection?.status === "connected" ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-2xl font-bold">Connected</span>
                      </>
                    ) : connection?.status === "connecting" ? (
                      <>
                        <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                        <span className="text-2xl font-bold">Connecting</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        <span className="text-2xl font-bold">Disconnected</span>
                      </>
                    )}
                  </div>
                  {connection?.phoneNumber && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {connection.phoneNumber}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Rules */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{enabledRulesCount}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    of {rules.length} total rules
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Messages</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{incomingMessagesCount}</div>
                  <p className="text-xs text-muted-foreground mt-2">incoming messages</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Activity */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Automated Replies</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{recentActivityCount}</div>
                  <p className="text-xs text-muted-foreground mt-2">this session</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Quick Actions */}
          <Card className="md:col-span-2 border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with your chatbot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {connection?.status !== "connected" && (
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setLocation("/whatsapp")}
                >
                  <span>Connect WhatsApp</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setLocation("/rules")}
              >
                <span>Create Automation Rule</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              {connection?.status === "connected" && (
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setLocation("/messages")}
                >
                  <span>Send Message</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Connection Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Connection Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Status</p>
                <Badge
                  variant={
                    connection?.status === "connected"
                      ? "default"
                      : connection?.status === "connecting"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {connection?.status || "disconnected"}
                </Badge>
              </div>
              {connection?.lastConnectedAt && (
                <div>
                  <p className="text-muted-foreground mb-1">Last Connected</p>
                  <p className="font-mono text-xs">
                    {new Date(connection.lastConnectedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {!isLoading && activities.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Automated Replies</CardTitle>
              <CardDescription>Latest automation rule executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start justify-between border-b pb-4 last:border-b-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{activity.matchedKeyword}</p>
                      <p className="text-xs text-muted-foreground">
                        From: {activity.contact}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={activity.status === "success" ? "default" : "destructive"}
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
