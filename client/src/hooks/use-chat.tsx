import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatState {
  messages: Message[];
  isGenerating: boolean;
}

export function useChat() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendToAI = async (prompt: string) => {
    try {
      const response = await apiRequest("POST", "/api/openai/send", { prompt });
      return response.json();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to communicate with AI",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    sendToAI,
    isGenerating: false, // Update this based on your logic
  };
}
