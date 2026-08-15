"use client";

/**
 * Catches errors thrown by the ROOT layout itself (app/layout.tsx) or
 * anything above app/error.tsx's boundary — e.g. a provider throwing
 * during initialization. Next.js requires this file to render its own
 * complete `<html>`/`<body>`, since the root layout that would normally
 * provide them may be the very thing that failed. Deliberately does NOT
 * import PublicHeader/PublicFooter/design tokens/fonts — those all
 * assume the app's normal render tree is healthy, which we can't assume
 * here. Kept intentionally minimal and dependency-free.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100dvh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <p style={{ fontSize: "0.875rem", color: "#6b6a66", fontFamily: "monospace" }}>500</p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 600 }}>Something went seriously wrong</h1>
        <p style={{ color: "#6b6a66", maxWidth: "28rem" }}>
          FitMirror AI hit an unexpected error loading the page. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem 1.25rem",
            borderRadius: "0.5rem",
            border: "1px solid #d4d0c9",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
