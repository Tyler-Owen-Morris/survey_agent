import { Message } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export function MessageItem({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[80%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <div className={cn(
          "prose prose-sm dark:prose-invert max-w-none",
          isUser ? "text-primary-foreground" : "text-foreground"
        )}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}