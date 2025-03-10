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

  const generateSurveyMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest("POST", "/api/surveys/generate", { prompt });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({
        title: "Survey Generated",
        description: "Your survey has been created in Qualtrics",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    generateSurvey: generateSurveyMutation.mutate,
    isGenerating: generateSurveyMutation.isPending,
  };
}
