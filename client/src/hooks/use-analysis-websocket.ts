import { useEffect, useRef, useState } from 'react';

export interface AnalysisUpdate {
  type: 'analysis_update';
  projectId: string;
  status: 'started' | 'loaded_existing' | 'scanning' | 'scanning_complete' | 'analyzing_files' | 'completed' | 'script_created' | 'insights_saved' | 'error';
  message: string;
  workingDirectory?: string;
  generateScript?: boolean;
  fileCount?: number;
  totalAnalyzed?: number;
  technologies?: string[];
  insights?: string[];
  recommendations?: string[];
  scriptPath?: string;
  insightsPath?: string;
}

export function useAnalysisWebSocket(projectId: string) {
  const [updates, setUpdates] = useState<AnalysisUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host || 'localhost:5005';
    const wsUrl = `${protocol}//${host}/ws`;
    
    console.log('📡 Connecting to WebSocket for analysis updates:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('📡 WebSocket connected for analysis updates');
      setIsConnected(true);
      
      // Subscribe to analysis updates for this project
      ws.send(JSON.stringify({
        type: 'subscribe_analysis',
        projectId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AnalysisUpdate;
        if (data.type === 'analysis_update' && data.projectId === projectId) {
          console.log('📡 Received analysis update:', data);
          setUpdates(prev => [...prev, data]);
          setCurrentStatus(data.message);
        }
      } catch (e) {
        console.warn('Failed to parse WebSocket message:', e);
      }
    };

    ws.onclose = () => {
      console.log('📡 WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('📡 WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [projectId]);

  const clearUpdates = () => {
    setUpdates([]);
    setCurrentStatus('');
  };

  return {
    updates,
    isConnected,
    currentStatus,
    clearUpdates,
    latestUpdate: updates[updates.length - 1] || null
  };
}