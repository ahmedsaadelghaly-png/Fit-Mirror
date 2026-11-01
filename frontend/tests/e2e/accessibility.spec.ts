import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Automated WCAG scans via axe-core — catches the mechanically-detectable
 * subset of accessibility issues (missing labels, contrast failures,
 * invalid ARIA, missing landmarks, ...); does NOT replace manual keyboard/
 * screen-reader testing (see docs/frontend/ACCESSIBILITY_AUDIT.md
 * "What automated scans can't catch"). Scoped to public, unauthenticated
 * pages only — the dashboard pages built in Phases 2.3–2.5 require a
 * faked session (see the `*-smoke.spec.ts` files' `signInAs*` helpers) and
 * are a natural follow-up, not covered here to keep this suite runnable
 * with zero setup.
 *
 * Run with: npm run test:e2e:a11y
 */

const PUBLIC_PAGES = ["/", "/features", "/pricing", "/about", "/contact", "/privacy", "/terms"];
const AUTH_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password?token=example-token",
];

for (const path of [...PUBLIC_PAGES, ...AUTH_PAGES]) {
  test(`${path} has no detectable WCAG 2.1 AA violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      results.violations
        .map((v) => `${v.id}: ${v.description} (${v.nodes.length} node(s))`)
        .join("\n"),
    ).toEqual([]);
  });
}
