import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export function useChat() {
  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: async (messages: Message[]) => {
      const res = await apiRequest("POST", "/api/chat", { messages });
      return res.json();
    },
    onSuccess: (data) => {
      // Update the user's token balance in the auth context
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        tokenBalance: data.tokenBalance,
      }));
    },
    onError: (error: Error) => {
      toast({
        title: "Message Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    sendMessage: sendMessageMutation.mutate,
    isLoading: sendMessageMutation.isPending,
  };
}