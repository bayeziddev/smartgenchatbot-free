import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Zap, Plus, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function RulesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    keyword: "",
    response: "",
    matchType: "contains" as const,
  });

  const rulesQuery = trpc.rules.list.useQuery();
  const createMutation = trpc.rules.create.useMutation();
  const updateMutation = trpc.rules.update.useMutation();
  const deleteMutation = trpc.rules.delete.useMutation();

  const rules = rulesQuery.data || [];

  const handleCreate = async () => {
    if (!formData.name || !formData.keyword || !formData.response) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: formData.name,
        keyword: formData.keyword,
        response: formData.response,
        matchType: formData.matchType,
      });
      setFormData({ name: "", keyword: "", response: "", matchType: "contains" });
      setIsOpen(false);
      await rulesQuery.refetch();
      toast.success("Rule created successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create rule");
    }
  };

  const handleToggle = async (ruleId: number, enabled: boolean) => {
    try {
      await updateMutation.mutateAsync({
        id: ruleId,
        enabled: !enabled,
      });
      await rulesQuery.refetch();
      toast.success("Rule updated successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update rule");
    }
  };

  const handleDelete = async (ruleId: number) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      await deleteMutation.mutateAsync({ id: ruleId });
      await rulesQuery.refetch();
      toast.success("Rule deleted successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete rule");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Automation Rules</h1>
          <p className="text-muted-foreground">
            Create and manage keyword-based automation rules for your chatbot.
          </p>
        </div>

        {/* Create Rule Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
              <DialogDescription>
                Set up a keyword trigger and automated response
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Greeting Bot"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="keyword">Keyword/Trigger</Label>
                <Input
                  id="keyword"
                  placeholder="e.g., hello, hi, hey"
                  value={formData.keyword}
                  onChange={(e) =>
                    setFormData({ ...formData, keyword: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="matchType">Match Type</Label>
                <Select
                  value={formData.matchType}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, matchType: value })
                  }
                >
                  <SelectTrigger id="matchType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exact">Exact Match</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="startsWith">Starts With</SelectItem>
                    <SelectItem value="endsWith">Ends With</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="response">Automated Response</Label>
                <Textarea
                  id="response"
                  placeholder="e.g., Hello! Thanks for reaching out. How can I help?"
                  value={formData.response}
                  onChange={(e) =>
                    setFormData({ ...formData, response: e.target.value })
                  }
                  rows={4}
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? "Creating..." : "Create Rule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rules List */}
        {rulesQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No rules yet</p>
              <p className="text-muted-foreground text-center mb-6">
                Create your first automation rule to get started.
              </p>
              <Button onClick={() => setIsOpen(true)}>Create Rule</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Trigger: <span className="font-mono text-foreground">{rule.keyword}</span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={rule.matchType === "contains" ? "default" : "secondary"}
                      >
                        {rule.matchType}
                      </Badge>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => handleToggle(rule.id, rule.enabled)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Response:</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{rule.response}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={updateMutation.isPending}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(rule.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
