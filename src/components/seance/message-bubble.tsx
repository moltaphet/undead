import { cn } from "@/lib/cn";
import type { SeanceMessage } from "@/lib/schemas";

export function MessageBubble({ message, typing }: { message: SeanceMessage; typing: boolean }) {
  const ghost = message.role === "assistant";
  return (
    <div className={cn("flex", ghost ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] px-4 py-3 leading-relaxed whitespace-pre-wrap sm:max-w-[75%]",
          ghost
            ? "rounded-2xl rounded-tl-sm border border-primary/20 bg-surface/80 font-display text-lg text-foreground shadow-[0_0_32px_-10px_rgb(124_255_178/0.45)] ring-4 ring-primary/[0.03] backdrop-blur-sm"
            : "rounded-2xl rounded-tr-sm bg-border/70 text-foreground",
        )}
      >
        <span className="sr-only">{ghost ? "The ghost: " : "You: "}</span>
        {message.content}
        {typing && <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-primary/70 motion-safe:animate-pulse" />}
      </div>
    </div>
  );
}
