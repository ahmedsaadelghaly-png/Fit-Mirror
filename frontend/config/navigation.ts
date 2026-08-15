import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Boxes,
  Cpu,
  Heart,
  History,
  Info,
  LayoutDashboard,
  ListTree,
  Mail,
  ScrollText,
  Settings,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  ToggleLeft,
  UserRound,
  Users,
  Wand2,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Marks a route that isn't built yet — Phase 2.1 renders it disabled/labeled "Soon". */
  comingSoon?: boolean;
}

/**
 * Per-area navigation. `/shopper/*` (Phase 2.3), `/brand/*` (Phase 2.4),
 * and `/admin/*` (Phase 2.5) are all fully built out — see
 * docs/frontend/SHOPPER_APP.md, docs/frontend/BRAND_APP.md, and
 * docs/frontend/ADMIN_APP.md. `comingSoon` is removed the moment a route
 * has real content, per docs/frontend/WEB_ROUTES.md's "Adding a new route"
 * checklist. Most of `/admin/*`'s data is mocked (see ADMIN_APP.md) but
 * the pages themselves are real, not placeholders.
 */
export const shopperNav: NavItem[] = [
  { label: "Overview", href: "/shopper", icon: LayoutDashboard },
  { label: "Wardrobe", href: "/shopper/wardrobe", icon: Shirt },
  { label: "Try-On", href: "/shopper/tryon", icon: Sparkles },
  { label: "Try-On History", href: "/shopper/tryon/history", icon: History },
  { label: "Saved Looks", href: "/shopper/looks", icon: Heart },
  { label: "Body Profile", href: "/shopper/profile", icon: UserRound },
  { label: "AI Stylist", href: "/shopper/stylist", icon: Wand2 },
  { label: "Shopping Assistant", href: "/shopper/shopping", icon: ShoppingBag },
  { label: "Settings", href: "/shopper/settings", icon: Settings },
];

export const brandNav: NavItem[] = [
  { label: "Overview", href: "/brand", icon: LayoutDashboard },
  { label: "Products", href: "/brand/products", icon: Shirt },
  { label: "Inventory", href: "/brand/inventory", icon: Boxes },
  { label: "Analytics", href: "/brand/analytics", icon: BarChart3 },
  { label: "Customers", href: "/brand/customers", icon: Users },
  { label: "Orders", href: "/brand/orders", icon: ShoppingCart },
  { label: "Store Profile", href: "/brand/profile", icon: Store },
  { label: "Settings", href: "/brand/settings", icon: Settings },
];

export const adminNav: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Stores", href: "/admin/stores", icon: Store },
  { label: "Products", href: "/admin/products", icon: Shirt },
  { label: "Try-On Jobs", href: "/admin/tryon-jobs", icon: Sparkles },
  { label: "Queue & Workers", href: "/admin/queue", icon: ListTree },
  { label: "AI Services", href: "/admin/ai-services", icon: Cpu },
  { label: "System Health", href: "/admin/system-health", icon: Activity },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  { label: "Feature Flags", href: "/admin/feature-flags", icon: ToggleLeft },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export const publicNav: NavItem[] = [
  { label: "Features", href: "/features", icon: Sparkles },
  { label: "Pricing", href: "/pricing", icon: Tag },
  { label: "About", href: "/about", icon: Info },
  { label: "Contact", href: "/contact", icon: Mail },
];

export interface FooterLink {
  label: string;
  href: string;
}

export const footerLinks: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];
