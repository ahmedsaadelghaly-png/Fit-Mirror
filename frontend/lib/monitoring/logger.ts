/**
 * Structured client-side logging utility — see
 * docs/frontend/OBSERVABILITY.md. Every call is a real, structured
 * `console.*` call today (level, message, context object, ISO timestamp),
 * not a no-op — but funneled through one module so swapping the sink
 * (e.g. forwarding to a real log-ingestion endpoint or Sentry breadcrumbs)
 * is a one-file change. Never logs secrets — callers pass a plain
 * `Record<string, unknown>` context, not raw request/response bodies.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
}

const CONSOLE_METHOD: Record<LogLevel, "log" | "info" | "warn" | "error"> = {
  debug: "log",
  info: "info",
  warn: "warn",
  error: "error",
};

function emit(entry: LogEntry): void {
  const method = CONSOLE_METHOD[entry.level];

  console[method](
    `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`,
    entry.context ?? "",
  );
}

function log(level: LogLevel, message: string, context?: LogContext): void {
  emit({ level, message, context, timestamp: new Date().toISOString() });
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
};
