import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Smartphone, AlertCircle, CheckCircle2, LogOut } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

export default function WhatsAppPage() {
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);

  const connectionQuery = trpc.whatsapp.getConnection.useQuery();
  const initMutation = trpc.whatsapp.initConnection.useMutation();
  const disconnectMutation = trpc.whatsapp.disconnect.useMutation();

  const connection = connectionQuery.data;
  const isLoading = connectionQuery.isLoading;
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for connection status updates
  useEffect(() => {
    if (connection?.status === "connected" || !isConnecting) return;

    pollIntervalRef.current = setInterval(async () => {
      await connectionQuery.refetch();
    }, 2000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isConnecting, connection?.status, connectionQuery]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await initMutation.mutateAsync();
      toast.success("QR code generated. Scan with WhatsApp to connect.");
      // Start polling for connection updates
      const pollInterval = setInterval(async () => {
        const result = await connectionQuery.refetch();
        if (result.data?.status === "connected") {
          clearInterval(pollInterval);
          setQrCode("");
          setIsConnecting(false);
          toast.success("WhatsApp connected successfully!");
        } else if (result.data?.qrCode && !qrCode) {
          setQrCode(result.data.qrCode);
        }
      }, 2000);
      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsConnecting(false);
      }, 300000);
    } catch (error) {
      setIsConnecting(false);
      toast.error(
        error instanceof Error ? error.message : "Failed to initialize connection"
      );
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync();
      setQrCode("");
      await connectionQuery.refetch();
      toast.success("WhatsApp disconnected successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to disconnect"
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Connection</h1>
          <p className="text-muted-foreground">
            Connect your WhatsApp account to enable message automation.
          </p>
        </div>

        {/* Connection Status Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>Current WhatsApp connection state</CardDescription>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <Badge
                  variant={
                    connection?.status === "connected"
                      ? "default"
                      : connection?.status === "connecting"
                        ? "secondary"
                        : "outline"
                  }
                  className="text-base px-3 py-1"
                >
                  {connection?.status || "disconnected"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : connection?.status === "connected" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Connected</p>
                    <p className="text-sm text-green-700">
                      {connection.phoneNumber || "WhatsApp account linked"}
                    </p>
                  </div>
                </div>
                {connection.lastConnectedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last connected: {new Date(connection.lastConnectedAt).toLocaleString()}
                  </p>
                )}
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
                </Button>
              </div>
            ) : connection?.status === "error" ? (
              <div className="space-y-3">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {connection.errorMessage || "Connection failed"}
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || initMutation.isPending}
                  className="w-full"
                >
                  {isConnecting || initMutation.isPending ? "Connecting..." : "Try Again"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Click the button below to generate a QR code. Scan it with your WhatsApp to connect.
                </p>
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || initMutation.isPending}
                  size="lg"
                  className="w-full"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  {isConnecting || initMutation.isPending ? "Generating QR..." : "Generate QR Code"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Display */}
        {(qrCode || connection?.qrCode) && connection?.status !== "connected" && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>
                Use WhatsApp on your phone to scan this code
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border">
                <img
                  src={qrCode || connection?.qrCode || ""}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="border-0 shadow-sm bg-blue-50 border border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">How to Connect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800">
            <ol className="list-decimal list-inside space-y-2">
              <li>Click "Generate QR Code" button above</li>
              <li>Open WhatsApp on your phone</li>
              <li>Go to Settings â Linked Devices</li>
              <li>Tap "Link a device" and scan the QR code</li>
              <li>Your account will be connected automatically</li>
            </ol>
            <p className="mt-4 text-xs font-medium">
              ð¡ Keep your phone connected to the internet during the process.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
