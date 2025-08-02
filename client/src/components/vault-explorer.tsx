import { useState, useEffect } from "react";
import { Eye, EyeOff, Copy, Plus, Edit, Trash2, Key, Database, GitBranch, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VaultSecret {
  id: string;
  workspace: string;
  name: string;
  value?: string;
  encryptedValue: string;
  description?: string | null;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface VaultExplorerProps {
  workspace: string;
}

const CATEGORY_ICONS = {
  git: GitBranch,
  database: Database,
  api: Key,
  general: Settings,
};

const CATEGORY_COLORS = {
  git: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  database: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  api: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  general: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export function VaultExplorer({ workspace }: VaultExplorerProps) {
  const [secrets, setSecrets] = useState<VaultSecret[]>([]);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [editingSecret, setEditingSecret] = useState<VaultSecret | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // New secret form
  const [newSecret, setNewSecret] = useState({
    name: "",
    value: "",
    description: "",
    category: "general",
  });

  useEffect(() => {
    loadSecrets();
  }, [workspace]);

  const loadSecrets = async () => {
    if (!workspace) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/vault/${workspace}/secrets`);
      if (response.ok) {
        const data = await response.json();
        setSecrets(data);
      } else {
        throw new Error("Failed to load secrets");
      }
    } catch (error) {
      console.error("Error loading vault secrets:", error);
      toast({
        title: "Error",
        description: "Failed to load vault secrets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSecretVisibility = async (secretId: string) => {
    if (visibleSecrets.has(secretId)) {
      // Hide secret
      setVisibleSecrets(prev => {
        const newSet = new Set(prev);
        newSet.delete(secretId);
        return newSet;
      });
    } else {
      // Show secret - fetch decrypted value
      try {
        const response = await fetch(`/api/vault/${workspace}/secrets/${secretId}/decrypt`);
        if (response.ok) {
          const data = await response.json();
          setSecrets(prev => prev.map(s => 
            s.id === secretId ? { ...s, value: data.value } : s
          ));
          setVisibleSecrets(prev => new Set([...Array.from(prev), secretId]));
        } else {
          throw new Error("Failed to decrypt secret");
        }
      } catch (error) {
        console.error("Error decrypting secret:", error);
        toast({
          title: "Error",
          description: "Failed to decrypt secret",
          variant: "destructive",
        });
      }
    }
  };

  const copyToClipboard = async (text: string, name: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: `${name} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleAddSecret = async () => {
    if (!newSecret.name || !newSecret.value) {
      toast({
        title: "Error",
        description: "Name and value are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/vault/${workspace}/secrets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSecret),
      });

      if (response.ok) {
        await loadSecrets();
        setShowAddDialog(false);
        setNewSecret({ name: "", value: "", description: "", category: "general" });
        toast({
          title: "Success",
          description: "Secret added successfully",
        });
      } else {
        throw new Error("Failed to add secret");
      }
    } catch (error) {
      console.error("Error adding secret:", error);
      toast({
        title: "Error",
        description: "Failed to add secret",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSecret = async (secretId: string) => {
    if (!confirm("Are you sure you want to delete this secret?")) return;

    try {
      const response = await fetch(`/api/vault/${workspace}/secrets/${secretId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadSecrets();
        toast({
          title: "Success",
          description: "Secret deleted successfully",
        });
      } else {
        throw new Error("Failed to delete secret");
      }
    } catch (error) {
      console.error("Error deleting secret:", error);
      toast({
        title: "Error",
        description: "Failed to delete secret",
        variant: "destructive",
      });
    }
  };

  if (!workspace) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Vault Explorer
          </CardTitle>
          <CardDescription>
            Select a workspace to manage secure credentials and secrets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No workspace selected. Please select a workspace from the dropdown above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Vault Explorer
              </CardTitle>
              <CardDescription>
                Secure credential management for {workspace}
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Secret
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Secret</DialogTitle>
                  <DialogDescription>
                    Store a new secure credential or API key
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="secret-name">Name</Label>
                    <Input
                      id="secret-name"
                      placeholder="e.g., GITHUB_TOKEN, DATABASE_URL"
                      value={newSecret.name}
                      onChange={(e) => setNewSecret(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secret-value">Value</Label>
                    <Textarea
                      id="secret-value"
                      placeholder="Enter the secret value..."
                      value={newSecret.value}
                      onChange={(e) => setNewSecret(prev => ({ ...prev, value: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secret-description">Description (optional)</Label>
                    <Input
                      id="secret-description"
                      placeholder="Brief description of this secret"
                      value={newSecret.description}
                      onChange={(e) => setNewSecret(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secret-category">Category</Label>
                    <Select value={newSecret.category} onValueChange={(value) => setNewSecret(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="git">Git</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="api">API</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSecret}>
                      Add Secret
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading secrets...</p>
          ) : secrets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No secrets stored for this workspace. Click "Add Secret" to get started.
            </p>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {secrets.map((secret) => {
                  const CategoryIcon = CATEGORY_ICONS[secret.category as keyof typeof CATEGORY_ICONS] || Settings;
                  const categoryColor = CATEGORY_COLORS[secret.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.general;
                  const isVisible = visibleSecrets.has(secret.id);
                  
                  return (
                    <Card key={secret.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CategoryIcon className="h-4 w-4" />
                              <span className="font-medium">{secret.name}</span>
                              <Badge className={categoryColor}>
                                {secret.category}
                              </Badge>
                            </div>
                            {secret.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {secret.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 font-mono text-sm bg-muted p-2 rounded">
                                {isVisible ? secret.value : secret.value}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleSecretVisibility(secret.id)}
                              >
                                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(isVisible ? secret.value! : secret.value!, secret.name)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingSecret(secret)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSecret(secret.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}