import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChatMessage } from "@shared/schema";

export function useAiChat(chatId: string | null) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: (data: { message: string; model: string }) =>
      apiRequest("POST", `/api/ai-chats/${chatId}/messages`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-chats", chatId] });
    }
  });

  const startStreaming = useCallback(async (message: string, model: string = "gpt-4o") => {
    if (!chatId) return;

    setIsStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch(`/api/ai-chats/${chatId}/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, model }),
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                throw new Error(data.error);
              }
              
              if (data.chunk) {
                setStreamingContent(prev => prev + data.chunk);
              }
              
              if (data.done) {
                queryClient.invalidateQueries({ queryKey: ["/api/ai-chats", chatId] });
                setStreamingContent("");
                setIsStreaming(false);
                return;
              }
            } catch (parseError) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setIsStreaming(false);
      setStreamingContent("");
    }
  }, [chatId, queryClient]);

  return {
    sendMessage: sendMessageMutation.mutate,
    sendMessageAsync: sendMessageMutation.mutateAsync,
    isLoading: sendMessageMutation.isPending,
    startStreaming,
    isStreaming,
    streamingContent,
    error: sendMessageMutation.error
  };
}
