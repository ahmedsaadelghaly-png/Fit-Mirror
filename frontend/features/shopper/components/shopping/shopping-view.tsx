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
import { useShoppingAsk } from "@/features/shopper/hooks/use-shopping-ask";
import { type ShoppingAskFormValues, shoppingAskSchema } from "@/features/shopper/schemas";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

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
          <div
            role="log"
            aria-live="polite"
            className="flex min-h-40 flex-col gap-3 rounded-lg border bg-muted/30 p-4"
          >
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ask something like &ldquo;Do you have this jacket in navy?&rdquo;
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[80%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "mr-auto max-w-[80%] rounded-lg bg-surface px-3 py-2 text-sm shadow-xs"
                  }
                >
                  {message.content}
                </div>
              ))
            )}
            {askMutation.isPending && (
              <div className="mr-auto max-w-[80%] rounded-lg bg-surface px-3 py-2 text-sm text-muted-foreground shadow-xs">
                Thinking…
              </div>
            )}
          </div>

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
        </CardContent>
      </Card>
    </div>
  );
}

export { ShoppingView };
