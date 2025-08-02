import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { GitBranch, GitCommit, GitPullRequest, Plus, RefreshCw, Upload } from "lucide-react";

interface GitPanelProps {
  projectId: string;
  workingDirectory: string;
}

export function GitPanel({ projectId, workingDirectory }: GitPanelProps) {
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [commitMessage, setCommitMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchGitStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/git/status`);
      const data = await response.json();
      setGitStatus(data);
    } catch (error) {
      console.error("Failed to fetch git status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    
    try {
      await fetch(`/api/projects/${projectId}/git/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commitMessage })
      });
      setCommitMessage("");
      fetchGitStatus();
    } catch (error) {
      console.error("Commit failed:", error);
    }
  };

  const handleStageFile = async (filePath: string) => {
    try {
      await fetch(`/api/projects/${projectId}/git/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [filePath] })
      });
      fetchGitStatus();
    } catch (error) {
      console.error("Stage failed:", error);
    }
  };

  useEffect(() => {
    fetchGitStatus();
  }, [projectId]);

  return (
    <div className="h-full flex flex-col replit-panel">
      <div className="p-3 border-b border-replit-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-replit-text">Git Version Control</h3>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={fetchGitStatus}
            disabled={isLoading}
            className="border-replit-border hover:bg-replit-elevated"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {gitStatus?.branch && (
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4 text-replit-blue" />
            <span className="text-sm text-replit-text">{gitStatus.branch}</span>
            {gitStatus.ahead > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{gitStatus.ahead}
              </Badge>
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-3">
        {/* Changed Files */}
        {gitStatus?.changes && gitStatus.changes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-replit-text mb-2">Changes</h4>
            {gitStatus.changes.map((file: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-1 px-2 rounded hover:bg-replit-elevated group">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-2 h-2 rounded-full ${
                    file.status === 'M' ? 'bg-yellow-400' :
                    file.status === 'A' ? 'bg-green-400' :
                    file.status === 'D' ? 'bg-red-400' : 'bg-gray-400'
                  }`} />
                  <span className="text-sm text-replit-text-secondary truncate">{file.path}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleStageFile(file.path)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Staged Files */}
        {gitStatus?.staged && gitStatus.staged.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-replit-text mb-2">Staged</h4>
            {gitStatus.staged.map((file: any, index: number) => (
              <div key={index} className="flex items-center gap-2 py-1 px-2 rounded bg-replit-elevated">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm text-replit-text">{file.path}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recent Commits */}
        {gitStatus?.commits && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-replit-text mb-2">Recent Commits</h4>
            {gitStatus.commits.slice(0, 5).map((commit: any, index: number) => (
              <div key={index} className="py-2 px-2 rounded hover:bg-replit-elevated">
                <div className="flex items-center gap-2 mb-1">
                  <GitCommit className="w-3 h-3 text-replit-blue" />
                  <span className="text-xs text-replit-text-secondary font-mono">
                    {commit.hash?.substring(0, 7)}
                  </span>
                </div>
                <p className="text-sm text-replit-text">{commit.message}</p>
                <p className="text-xs text-replit-text-muted">{commit.author} • {commit.date}</p>
              </div>
            ))}
          </div>
        )}

        {!gitStatus && !isLoading && (
          <div className="text-center py-8">
            <GitBranch className="w-8 h-8 text-replit-text-muted mx-auto mb-2" />
            <p className="text-sm text-replit-text-muted">No git repository found</p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2 border-replit-border hover:bg-replit-elevated"
              onClick={() => {
                // Initialize git repository
                fetch(`/api/projects/${projectId}/git/init`, { method: "POST" })
                  .then(() => fetchGitStatus());
              }}
            >
              Initialize Git
            </Button>
          </div>
        )}
      </ScrollArea>

      {/* Commit Section */}
      {gitStatus?.staged && gitStatus.staged.length > 0 && (
        <div className="border-t border-replit-border p-3">
          <Input
            placeholder="Commit message..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            className="mb-2 bg-replit-elevated border-replit-border"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && commitMessage.trim()) {
                handleCommit();
              }
            }}
          />
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleCommit}
              disabled={!commitMessage.trim()}
              className="bg-replit-blue hover:bg-replit-blue-secondary flex-1"
            >
              <GitCommit className="w-3 h-3 mr-1" />
              Commit
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="border-replit-border hover:bg-replit-elevated"
              onClick={() => {
                // Push to remote
                fetch(`/api/projects/${projectId}/git/push`, { method: "POST" })
                  .then(() => fetchGitStatus());
              }}
            >
              <Upload className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}