import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  BadgeDollarSign,
  BarChart3,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "view:dashboard" },
  { label: "Leads", href: "/leads", icon: Users, permission: "view:leads" },
  { label: "Pipeline", href: "/pipeline", icon: KanbanSquare, permission: "view:pipeline" },
  { label: "Commissions", href: "/commissions", icon: BadgeDollarSign, permission: "view:commissions" },
  { label: "Reports", href: "/reports", icon: BarChart3, permission: "view:reports" },
  { label: "Audit Log", href: "/audit", icon: ScrollText, permission: "view:audit" },
];
