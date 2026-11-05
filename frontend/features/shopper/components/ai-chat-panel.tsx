import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Rendered under an assistant reply — e.g. the suggested outfit. */
  attachment?: React.ReactNode;
}

export interface AiChatPanelProps {
  messages: ChatMessage[];
  isPending: boolean;
  emptyStateText: string;
  /** The page-specific input form — rendered below the message log. */
  children: React.ReactNode;
}

/**
 * The message-log chrome shared identically by StylistView and
 * ShoppingView (previously hand-duplicated in both) — a small assistant
 * avatar distinguishes replies from a plain ChatGPT-style bubble pair.
 * Purely presentational: each caller still owns its own `messages` state,
 * `useForm`, and mutation call — this only renders the log and pending
 * state, plus whatever form is passed as `children`.
 */
function AiChatPanel({ messages, isPending, emptyStateText, children }: AiChatPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div
        role="log"
        aria-live="polite"
        className="flex min-h-48 flex-col gap-3 rounded-lg border bg-muted/30 p-4"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyStateText}</p>
        ) : (
          messages.map((message) => <ChatBubble key={message.id} message={message} />)
        )}
        {isPending && (
          <div className="mr-auto flex max-w-[80%] items-center gap-2">
            <AssistantAvatar />
            <div className="rounded-lg bg-surface px-3 py-2 text-sm text-muted-foreground shadow-xs">
              Thinking…
            </div>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function AssistantAvatar() {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent">
      <Sparkles className="size-3.5 text-accent-foreground" aria-hidden="true" />
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="ml-auto max-w-[80%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
        {message.content}
      </div>
    );
  }

  return (
    <div className="mr-auto flex max-w-[80%] items-start gap-2">
      <AssistantAvatar />
      <div className="flex flex-col gap-2">
        <div className="rounded-lg bg-surface px-3 py-2 text-sm shadow-xs">{message.content}</div>
        {message.attachment}
      </div>
    </div>
  );
}

export interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
  className?: string;
}

/** Tappable prompt chips — the "combine conversation with suggested styling prompts" surface, using no data beyond static copy. */
function SuggestedPrompts({ prompts, onSelect, className }: SuggestedPromptsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}

export { AiChatPanel, SuggestedPrompts };
