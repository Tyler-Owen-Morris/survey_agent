import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Message } from "@/hooks/use-chat";
import { MessageItem } from "./message-item";
import { useChat } from "@/hooks/use-chat";
import { Loader2 } from "lucide-react";
import { SurveyGenerationResponse } from "@server/openai";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { sendToAI, isGenerating } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");

    try {
      const aiResponse = await sendToAI(input) as SurveyGenerationResponse;
      console.log("AI response:", aiResponse.choices[0]);
      if (aiResponse && aiResponse.choices && aiResponse.choices[0].message) {
        const aiMessage: Message = { role: "assistant", content: aiResponse.choices[0].message.content };
        setMessages((prevMessages) => [...prevMessages, aiMessage]);
      }
    } catch (error) {
      console.error("Failed to get response from AI:", error);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Survey Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4 h-[400px] overflow-y-auto">
          {messages.map((message, i) => (
            <MessageItem key={i} message={message} />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Describe the survey you want to create..."
            disabled={isGenerating}
          />
          <Button type="submit" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Send"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
