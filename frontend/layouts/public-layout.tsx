import { PublicFooter } from "@/shared/components/public-footer";
import { PublicHeader } from "@/shared/components/public-header";

/**
 * Layout for every unauthenticated marketing/public page (landing,
 * features, pricing, about, contact, privacy, terms). Header/footer are
 * extracted components (shared/components/public-*) so they stay
 * consistent across all of them without copy-pasting. Breadcrumbs and a
 * notification area don't apply to public pages, so this layout
 * deliberately omits them rather than including empty placeholder slots.
 */
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}

export { PublicLayout };
