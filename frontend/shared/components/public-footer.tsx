import Link from "next/link";

import { footerLinks } from "@/config/navigation";
import { Logo } from "@/shared/components/logo";

function PublicFooter() {
  return (
    <footer className="border-t py-12">
      <div className="container flex flex-col gap-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
            <Logo />
            <p className="text-sm text-muted-foreground">See it on, before it&apos;s yours.</p>
          </div>

          {footerLinks.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <p className="text-sm font-medium">{column.title}</p>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} FitMirror AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export { PublicFooter };
