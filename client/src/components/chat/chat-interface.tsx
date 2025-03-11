import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Message } from "@/hooks/use-chat";
import { MessageItem } from "./message-item";
import { useChat } from "@/hooks/use-chat";
import { Loader2, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { sendMessage, isLoading } = useChat();
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    sendMessage(newMessages, {
      onSuccess: (data) => {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.message },
        ]);

        // If token balance is provided, show warning when low
        if (data.tokenBalance !== undefined && data.tokenBalance < 1000) {
          toast({
            title: "Low Token Balance",
            description: "You're running low on tokens. Consider purchasing more or subscribing.",
            variant: "warning",
          });
        }
      },
      onError: (error: Error) => {
        // Check if error is due to insufficient tokens
        if (error.message.includes("Insufficient tokens")) {
          toast({
            title: "Out of Tokens",
            description: "You've run out of tokens. Please purchase more or subscribe to continue.",
            variant: "destructive",
          });
        }
        // Remove the last user message since it failed
        setMessages(messages);
      },
    });
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Survey Design Assistant</CardTitle>
        {/* Display token balance */}
        <div className="text-sm text-muted-foreground">
          Available Tokens: {user?.tokenBalance || 0}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4 h-[400px] overflow-y-auto">
          {messages.map((message, i) => (
            <MessageItem key={i} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Describe your survey needs and our AI assistant will help you design it... (Press Enter to send)"
              disabled={isLoading || (user?.tokenBalance || 0) <= 0}
              className="min-h-[80px]"
            />
            <Button 
              type="submit" 
              disabled={isLoading || (user?.tokenBalance || 0) <= 0} 
              className="px-3"
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}