import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { MessageCircle, Send, AlertCircle, Search, X } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function MessagesPageEnhanced() {
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDirection, setFilterDirection] = useState<"all" | "incoming" | "outgoing">("all");

  const messagesQuery = trpc.messages.list.useQuery({ limit: 100 });
  const sendMutation = trpc.whatsapp.sendMessage.useMutation();

  const messages = messagesQuery.data || [];

  // Filter and search messages
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const matchesDirection = filterDirection === "all" || msg.direction === filterDirection;
      const matchesSearch =
        searchQuery === "" ||
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.senderName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDirection && matchesSearch;
    });
  }, [messages, searchQuery, filterDirection]);

  const handleSendMessage = async () => {
    if (!recipient || !message) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await sendMutation.mutateAsync({
        recipient,
        message,
      });
      setMessage("");
      await messagesQuery.refetch();
      toast.success("Message sent successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    }
  };

  const incomingMessages = messages.filter((m) => m.direction === "incoming");
  const outgoingMessages = messages.filter((m) => m.direction === "outgoing");

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            Send messages and view your message history.
          </p>
        </div>

        {/* Send Message Panel */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
            <CardDescription>Send a message to any WhatsApp contact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="recipient">Recipient Phone Number</Label>
              <Input
                id="recipient"
                placeholder="e.g., +1234567890 or group ID"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Include country code (e.g., +1 for USA)
              </p>
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={sendMutation.isPending}
              size="lg"
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendMutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </CardContent>
        </Card>

        {/* Message Statistics */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incoming Messages</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{incomingMessages.length}</div>
              <p className="text-xs text-muted-foreground mt-2">messages received</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outgoing Messages</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{outgoingMessages.length}</div>
              <p className="text-xs text-muted-foreground mt-2">messages sent</p>
            </CardContent>
          </Card>
        </div>

        {/* Message History with Search and Filter */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Message History</CardTitle>
            <CardDescription>Recent incoming and outgoing messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages by content or sender..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterDirection === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterDirection("all")}
                >
                  All ({messages.length})
                </Button>
                <Button
                  variant={filterDirection === "incoming" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterDirection("incoming")}
                >
                  Incoming ({incomingMessages.length})
                </Button>
                <Button
                  variant={filterDirection === "outgoing" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterDirection("outgoing")}
                >
                  Outgoing ({outgoingMessages.length})
                </Button>
              </div>
            </div>

            {/* Messages List */}
            {messagesQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  {messages.length === 0 ? "No messages yet" : "No matching messages"}
                </p>
                <p className="text-muted-foreground text-center">
                  {messages.length === 0
                    ? "Messages will appear here as they are sent and received."
                    : "Try adjusting your search or filter criteria."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={msg.direction === "incoming" ? "default" : "secondary"}
                        >
                          {msg.direction === "incoming" ? "Incoming" : "Outgoing"}
                        </Badge>
                        {msg.isAutomated && (
                          <Badge variant="outline" className="text-xs">
                            Automated
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium mb-1">
                        {msg.senderName || msg.sender}
                      </p>
                      <p className="text-sm text-foreground break-words">{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(msg.timestamp).toLocaleString()}
                      </p>
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
