"use client";

import { CheckCircle2, Inbox, Mail, RotateCcw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import {
  useContactMessages,
  useSetContactMessageResolved,
} from "@/features/admin/hooks/use-contact-messages";

function SupportInboxView() {
  return (
    <AdminGuard>
      <SupportInboxContent />
    </AdminGuard>
  );
}

/**
 * Contact-form messages (`POST /contact`) — the open queue, and what's
 * been handled. Replying happens by email (each message was also
 * forwarded to the support address with the sender as Reply-To).
 */
function SupportInboxContent() {
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const isResolved = tab === "resolved";
  const { data: messages, isLoading, isError, refetch } = useContactMessages(isResolved);
  const resolveMutation = useSetContactMessageResolved();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Support inbox</h1>
        <p className="text-sm text-muted-foreground">Messages sent through the contact form.</p>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as "open" | "resolved")}>
        <TabsList>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState
          description="We couldn't load the support inbox. Please try again."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && messages?.length === 0 && (
        <EmptyState
          icon={Inbox}
          title={isResolved ? "Nothing resolved yet" : "Inbox zero"}
          description={isResolved ? undefined : "No open messages right now."}
        />
      )}

      {!isLoading && !isError && messages && messages.length > 0 && (
        <ul className="flex flex-col gap-3">
          {messages.map((message) => (
            <li key={message.id}>
              <Card>
                <CardContent className="flex flex-col gap-3 pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{message.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {message.email} · {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={`mailto:${message.email}?subject=${encodeURIComponent("Re: your message to FitMirror")}`}
                        >
                          <Mail className="size-3.5" /> Reply
                        </a>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={isResolved ? "ghost" : "default"}
                        isLoading={
                          resolveMutation.isPending && resolveMutation.variables?.id === message.id
                        }
                        onClick={() =>
                          resolveMutation.mutate({ id: message.id, isResolved: !isResolved })
                        }
                      >
                        {isResolved ? (
                          <>
                            <RotateCcw className="size-3.5" /> Reopen
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="size-3.5" /> Mark resolved
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="whitespace-pre-line text-sm">{message.message}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { SupportInboxView };
