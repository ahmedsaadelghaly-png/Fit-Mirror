"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Wand2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStylistSuggestion } from "@/features/shopper/hooks/use-stylist-suggestion";
import { type StylistRequestFormValues, stylistRequestSchema } from "@/features/shopper/schemas";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/**
 * PLACEHOLDER page, clearly marked as planned — `POST /stylist/suggestions`
 * returns `501` on the backend today (see docs/API_CONTRACTS.md "AI
 * Stylist, Size Recommendation, Shopping Assistant"). The chat-like UI and
 * request form are fully wired to features/shopper/hooks/use-stylist-
 * suggestion.ts, which calls the documented placeholder in
 * api/shopper/stylist.ts — swapping in the real backend call later
 * requires no changes here.
 */
function StylistView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const suggestionMutation = useStylistSuggestion();

  const { register, handleSubmit, reset } = useForm<StylistRequestFormValues>({
    resolver: zodResolver(stylistRequestSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    const summary = [values.occasion, values.weather].filter(Boolean).join(" · ");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: summary || "Suggest an outfit for me" },
    ]);
    reset();
    const response = await suggestionMutation.mutateAsync(values);
    setMessages((prev) => [
      ...prev,
      { id: response.suggestion_id, role: "assistant", content: response.rationale },
    ]);
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold">AI Stylist</h1>
          <p className="text-sm text-muted-foreground">
            Outfit suggestions built from your wardrobe and style profile.
          </p>
        </div>
        <Badge variant="secondary">Planned feature</Badge>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Wand2 className="size-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-base">Ask for an outfit</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div
            role="log"
            aria-live="polite"
            className="flex min-h-40 flex-col gap-3 rounded-lg border bg-muted/30 p-4"
          >
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ask something like &ldquo;What should I wear to a summer wedding?&rdquo;
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
            {suggestionMutation.isPending && (
              <div className="mr-auto max-w-[80%] rounded-lg bg-surface px-3 py-2 text-sm text-muted-foreground shadow-xs">
                Thinking…
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="occasion" className="sr-only">
                Occasion
              </Label>
              <Input
                id="occasion"
                placeholder="Occasion (e.g. wedding, work)"
                {...register("occasion")}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="weather" className="sr-only">
                Weather
              </Label>
              <Input
                id="weather"
                placeholder="Weather (e.g. warm, rainy)"
                {...register("weather")}
              />
            </div>
            <Button type="submit" isLoading={suggestionMutation.isPending}>
              <Send className="size-4" /> Ask
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export { StylistView };
