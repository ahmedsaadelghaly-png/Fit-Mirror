"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AiChatPanel,
  type ChatMessage,
  SuggestedPrompts,
} from "@/features/shopper/components/ai-chat-panel";
import { useShoppingAsk } from "@/features/shopper/hooks/use-shopping-ask";
import { type ShoppingAskFormValues, shoppingAskSchema } from "@/features/shopper/schemas";

const SUGGESTED_QUESTIONS = [
  "Do you have this in my size?",
  "What pairs well with jeans?",
  "Anything under $50?",
];

/**
 * PLACEHOLDER page, clearly marked as planned — `POST /shopping/ask`
 * returns `501` on the backend today (see docs/API_CONTRACTS.md "AI
 * Stylist, Size Recommendation, Shopping Assistant"). Wired to
 * features/shopper/hooks/use-shopping-ask.ts, which calls the documented
 * placeholder in api/shopper/shopping.ts.
 */
function ShoppingView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const askMutation = useShoppingAsk();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ShoppingAskFormValues>({
    resolver: zodResolver(shoppingAskSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    const userMessageId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: userMessageId, role: "user", content: values.query }]);
    reset();
    const response = await askMutation.mutateAsync(values);
    setMessages((prev) => [
      ...prev,
      { id: `${userMessageId}-reply`, role: "assistant", content: response.reply },
    ]);
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold">Shopping Assistant</h1>
          <p className="text-sm text-muted-foreground">
            Ask questions and get product matches from the catalog.
          </p>
        </div>
        <Badge variant="secondary">Planned feature</Badge>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <MessageCircle className="size-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-base">Ask a question</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AiChatPanel
            messages={messages}
            isPending={askMutation.isPending}
            emptyStateText='Ask something like "Do you have this jacket in navy?"'
          >
            <SuggestedPrompts
              prompts={SUGGESTED_QUESTIONS}
              onSelect={(prompt) => setValue("query", prompt)}
            />

            <form
              onSubmit={onSubmit}
              noValidate
              className="flex flex-col gap-2 sm:flex-row sm:items-start"
            >
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="query" className="sr-only">
                  Your question
                </Label>
                <Input id="query" placeholder="Ask about a product…" {...register("query")} />
                {errors.query && <p className="text-sm text-destructive">{errors.query.message}</p>}
              </div>
              <Button type="submit" isLoading={askMutation.isPending}>
                <Send className="size-4" /> Ask
              </Button>
            </form>
          </AiChatPanel>

          <p className="text-xs text-muted-foreground">
            Answers are simulated while this feature is in development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export { ShoppingView };
