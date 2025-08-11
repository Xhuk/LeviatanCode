import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Code2, Terminal, FileEdit, Folder, Play } from 'lucide-react';

interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AgentResponse {
  content?: string;
  tool_calls?: Array<{
    function: {
      name: string;
      arguments: string;
    }
  }>;
}

export function DeveloperAgent() {
  const [instruction, setInstruction] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [lastResponse, setLastResponse] = useState<AgentResponse | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const executeInstruction = async () => {
    if (!instruction.trim()) {
      addLog('Please enter an instruction');
      return;
    }

    setIsRunning(true);
    addLog(`Executing: ${instruction}`);

    try {
      const messages: AgentMessage[] = [
        {
          role: 'system',
          content: 'You are a helpful developer agent. Use tools to read, write, and modify files as needed. Be precise and explain what you are doing.'
        },
        {
          role: 'user',
          content: instruction
        }
      ];

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, model: 'gpt-4o-mini' }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Agent error: ${error}`);
      }

      const result = await response.json();
      setLastResponse(result);
      
      if (result.content) {
        addLog(`Agent response: ${result.content}`);
      }
      
      if (result.tool_calls && result.tool_calls.length > 0) {
        result.tool_calls.forEach((call: any) => {
          addLog(`Used tool: ${call.function.name}`);
        });
      }
      
      addLog('✅ Instruction completed successfully');
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'readFile': return <FileEdit className="w-4 h-4" />;
      case 'writeFile': return <FileEdit className="w-4 h-4" />;
      case 'mkdir': return <Folder className="w-4 h-4" />;
      case 'move': return <FileEdit className="w-4 h-4" />;
      case 'run': return <Terminal className="w-4 h-4" />;
      default: return <Code2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            Developer Agent
            <Badge variant="secondary">AI-Powered</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Instruction</label>
            <Textarea
              placeholder="Enter your development instruction (e.g., 'Create a new utility function for date formatting', 'Fix the import error in App.tsx', 'Add a new React component for user profiles')"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={3}
              data-testid="input-agent-instruction"
            />
          </div>
          
          <Button 
            onClick={executeInstruction}
            disabled={isRunning || !instruction.trim()}
            className="w-full"
            data-testid="button-execute-agent"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Execute Instruction
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Execution Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Execution Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48 w-full rounded-md border p-4">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No logs yet. Execute an instruction to see output.</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Last Response Details */}
      {lastResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              Agent Response
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lastResponse.content && (
              <div>
                <label className="text-sm font-medium">Response:</label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                  {lastResponse.content}
                </p>
              </div>
            )}
            
            {lastResponse.tool_calls && lastResponse.tool_calls.length > 0 && (
              <div>
                <label className="text-sm font-medium">Tools Used:</label>
                <div className="mt-2 space-y-2">
                  {lastResponse.tool_calls.map((call, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      {getToolIcon(call.function.name)}
                      <span className="font-medium">{call.function.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        {call.function.name}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Available Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { name: 'readFile', desc: 'Read file contents' },
              { name: 'writeFile', desc: 'Write/create files' },
              { name: 'mkdir', desc: 'Create directories' },
              { name: 'move', desc: 'Move/rename files' },
              { name: 'run', desc: 'Execute commands' }
            ].map((tool) => (
              <div key={tool.name} className="flex items-center gap-2 p-2 border rounded-md">
                {getToolIcon(tool.name)}
                <div>
                  <div className="text-xs font-medium">{tool.name}</div>
                  <div className="text-xs text-muted-foreground">{tool.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}