import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, DollarSign, Zap } from 'lucide-react';

interface OllamaCrashConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (useChatGPT: boolean) => void;
  ollamaStatus: {
    status: string;
    needsFallback: boolean;
  };
  estimatedCost: number;
  taskComplexity: 'simple' | 'medium' | 'complex';
  recommendedModel: string;
}

export function OllamaCrashConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  ollamaStatus,
  estimatedCost,
  taskComplexity,
  recommendedModel
}: OllamaCrashConfirmDialogProps) {
  const getStatusMessage = () => {
    switch (ollamaStatus.status) {
      case 'disconnected':
        return 'Ollama service has disconnected after multiple failures';
      case 'service_unavailable':
        return 'Ollama service is currently unavailable';
      case 'network_error':
        return 'Cannot connect to Ollama service';
      default:
        return 'Ollama service is experiencing issues';
    }
  };

  const getComplexityColor = () => {
    switch (taskComplexity) {
      case 'complex': return 'destructive';
      case 'medium': return 'default';
      case 'simple': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Ollama Service Issue Detected
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="text-sm">
              {getStatusMessage()}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Task complexity:</span>
                <Badge variant={getComplexityColor()} className="text-xs">
                  {taskComplexity}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Recommended fallback:</span>
                <Badge variant="outline" className="text-xs">
                  {recommendedModel}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-xs">
                <DollarSign className="w-3 h-3 text-green-500" />
                <span className="text-muted-foreground">Estimated cost:</span>
                <span className="font-medium">
                  {estimatedCost === 0 ? 'FREE' : `$${estimatedCost.toFixed(4)}`}
                </span>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-xs">
              <div className="flex items-center gap-1 mb-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="font-medium">Options:</span>
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Wait & Retry:</strong> Give Ollama another chance (may fail again)</li>
                <li>• <strong>Use ChatGPT:</strong> Reliable but costs ${estimatedCost.toFixed(4)}</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onConfirm(false)}
            className="w-full sm:w-auto"
          >
            Wait & Retry Ollama
          </Button>
          <Button
            onClick={() => onConfirm(true)}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
          >
            Use ChatGPT (${estimatedCost.toFixed(4)})
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}