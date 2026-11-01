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
import {
  AiChatPanel,
  type ChatMessage,
  SuggestedPrompts,
} from "@/features/shopper/components/ai-chat-panel";
import { useStylistSuggestion } from "@/features/shopper/hooks/use-stylist-suggestion";
import { type StylistRequestFormValues, stylistRequestSchema } from "@/features/shopper/schemas";

const SUGGESTED_SCENARIOS: { label: string; occasion: string; weather: string }[] = [
  { label: "Wedding guest", occasion: "Wedding guest", weather: "Warm" },
  { label: "Job interview", occasion: "Job interview", weather: "" },
  { label: "Weekend brunch", occasion: "Weekend brunch", weather: "Mild" },
  { label: "Date night", occasion: "Date night", weather: "" },
];

/**
 * AI Stylist chat UI, wired to features/shopper/hooks/use-stylist-
 * suggestion.ts -> api/shopper/stylist.ts -> the backend's rule-based
 * `POST /stylist/suggestions` (outfits built from the shopper's own
 * wardrobe). Badged "Beta" until a model-backed stylist replaces the
 * rules behind the same contract.
 */
function StylistView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const suggestionMutation = useStylistSuggestion();

  const { register, handleSubmit, reset, setValue } = useForm<StylistRequestFormValues>({
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
        <Badge variant="secondary">Beta</Badge>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Wand2 className="size-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-base">Ask for an outfit</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AiChatPanel
            messages={messages}
            isPending={suggestionMutation.isPending}
            emptyStateText='Ask something like "What should I wear to a summer wedding?"'
          >
            <SuggestedPrompts
              prompts={SUGGESTED_SCENARIOS.map((scenario) => scenario.label)}
              onSelect={(label) => {
                const scenario = SUGGESTED_SCENARIOS.find((item) => item.label === label);
                if (!scenario) return;
                setValue("occasion", scenario.occasion);
                setValue("weather", scenario.weather);
              }}
            />

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
          </AiChatPanel>

          <p className="text-xs text-muted-foreground">
            Outfits are built from items in your wardrobe — add more pieces for more variety.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export { StylistView };
