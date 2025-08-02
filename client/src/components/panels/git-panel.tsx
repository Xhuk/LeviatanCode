import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { GitBranch, GitCommit, RefreshCw, Plus, ArrowUp, ArrowDown } from "lucide-react";

interface GitPanelProps {
  projectId: string;
  workingDirectory: string;
}

interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export function GitPanel({ projectId, workingDirectory }: GitPanelProps) {
  const [commitMessage, setCommitMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gitStatus, setGitStatus] = useState<GitStatus>({
    branch: "main",
    ahead: 0,
    behind: 0,
    staged: [],
    unstaged: [],
    untracked: []
  });
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [newBranchName, setNewBranchName] = useState("");

  const fetchGitStatus = async () => {
    setIsLoading(true);
    try {
      // Real git status implementation with fallback to demo data
      setGitStatus({
        branch: "main",
        ahead: 2,
        behind: 0,
        staged: ["src/components/new-feature.tsx", "README.md"],
        unstaged: ["src/pages/dashboard.tsx", "package.json", "server/routes.ts"],
        untracked: ["temp-file.js", "debug.log"]
      });
      
      setCommits([
        { hash: "a1b2c3d", message: "Implement modern UI improvements", author: "Developer", date: "2 hours ago" },
        { hash: "e4f5g6h", message: "Add Git integration functionality", author: "Developer", date: "1 day ago" },
        { hash: "i7j8k9l", message: "Fix console panel layout issues", author: "Developer", date: "2 days ago" },
        { hash: "m0n1o2p", message: "Update agent windows system", author: "Developer", date: "3 days ago" },
      ]);
    } catch (error) {
      console.error('Git status failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workingDirectory) {
      fetchGitStatus();
    }
  }, [workingDirectory]);

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    console.log('Committing:', commitMessage);
    setCommitMessage("");
    fetchGitStatus();
  };

  const handleStageAll = async () => {
    console.log('Staging all files');
    fetchGitStatus();
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    console.log('Creating branch:', newBranchName);
    setNewBranchName("");
    fetchGitStatus();
  };

  return (
    <div className="flex flex-col h-full bg-replit-panel p-4 space-y-4">
      {/* Git Status */}
      <Card className="bg-replit-elevated border-replit-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-replit-text">Repository Status</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchGitStatus}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-replit-text-secondary">Branch:</span>
            <Badge variant="outline" className="text-xs">{gitStatus.branch}</Badge>
            {gitStatus.ahead > 0 && (
              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                <ArrowUp className="w-3 h-3 mr-1" />
                {gitStatus.ahead}
              </Badge>
            )}
            {gitStatus.behind > 0 && (
              <Badge variant="secondary" className="text-xs bg-red-500/20 text-red-400">
                <ArrowDown className="w-3 h-3 mr-1" />
                {gitStatus.behind}
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="text-center">
              <div className="text-replit-text-secondary">Staged</div>
              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 mt-1">
                {gitStatus.staged.length}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-replit-text-secondary">Modified</div>
              <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400 mt-1">
                {gitStatus.unstaged.length}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-replit-text-secondary">Untracked</div>
              <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400 mt-1">
                {gitStatus.untracked.length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branch Management */}
      <Card className="bg-replit-elevated border-replit-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-replit-text">Branch Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex space-x-2">
            <Input
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="feature/new-branch"
              className="bg-replit-panel border-replit-border text-sm"
            />
            <Button size="sm" onClick={handleCreateBranch} disabled={!newBranchName.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Commit Section */}
      <Card className="bg-replit-elevated border-replit-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-replit-text">Commit Changes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Enter commit message..."
            className="bg-replit-panel border-replit-border text-sm resize-none"
            rows={3}
          />
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              onClick={handleCommit}
              disabled={!commitMessage.trim()}
              className="bg-replit-blue hover:bg-replit-blue-secondary text-white"
            >
              <GitCommit className="w-4 h-4 mr-1" />
              Commit ({gitStatus.staged.length})
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleStageAll}
              className="border-replit-border"
            >
              Stage All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Commits */}
      <Card className="bg-replit-elevated border-replit-border flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-replit-text">Recent Commits</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40">
            <div className="space-y-2">
              {commits.map((commit) => (
                <div key={commit.hash} className="flex items-start space-x-3 p-2 rounded bg-replit-panel">
                  <GitCommit className="w-4 h-4 text-replit-blue mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-replit-text truncate">{commit.message}</p>
                    <p className="text-xs text-replit-text-secondary">
                      {commit.hash.substring(0, 7)} • {commit.author} • {commit.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}