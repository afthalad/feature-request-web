"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Code,
  CreditCard,
  Inbox,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Plan } from "@/types";

export interface SidebarApp {
  id: string;
  name: string;
  featureCount: number;
  /** Requests that arrived since the owner last opened the app. */
  newCount: number;
}

interface AppSidebarProps {
  apps: SidebarApp[];
  plan: Plan;
  /** Whether a billing account exists, so "Manage billing" has somewhere to go. */
  hasBillingAccount: boolean;
}

const PLAN_LABEL: Record<Plan, string> = { free: "Free", starter: "Starter", pro: "Pro" };

export function AppSidebar({ apps, plan, hasBillingAccount }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />} tooltip="Fewchurs">
              <Image src="/logo-mark.svg" alt="" width={24} height={24} priority className="size-6" />
              <span className="font-semibold tracking-tight">Fewchurs</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem href="/dashboard" label="Dashboard" icon={<LayoutDashboard />} active={pathname === "/dashboard"} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <CollapsibleGroup label="Apps" action={{ href: "/dashboard/apps/new", label: "New app" }}>
          {apps.length === 0 && (
            <NavItem href="/dashboard/apps/new" label="Create your first app" icon={<Plus />} />
          )}
          {apps.map((app) => (
            <AppItem key={app.id} app={app} pathname={pathname} />
          ))}
        </CollapsibleGroup>

        <CollapsibleGroup label="Resources">
          <NavItem href="/docs" label="Docs" icon={<BookOpen />} active={pathname.startsWith("/docs")} />
          <NavItem href="/docs/api" label="API reference" icon={<Code />} />
          <NavItem href="/pricing" label="Pricing" icon={<Tag />} />
        </CollapsibleGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <PlanItem plan={plan} hasBillingAccount={hasBillingAccount} />
          <AccountMenu plan={plan} hasBillingAccount={hasBillingAccount} />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavItem({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={<Link href={href} />} isActive={active} tooltip={label}>
        {icon}
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** A section whose label folds it open and shut, like "Tools ⌄" in a typical app sidebar. */
function CollapsibleGroup({
  label,
  action,
  children,
}: {
  label: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel
          render={<CollapsibleTrigger />}
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full cursor-pointer gap-1"
        >
          {label}
          <ChevronDown className="size-3.5 transition-transform group-data-[closed]/collapsible:-rotate-90" />
        </SidebarGroupLabel>
        {action && (
          <SidebarGroupAction render={<Link href={action.href} />} title={action.label}>
            <Plus />
            <span className="sr-only">{action.label}</span>
          </SidebarGroupAction>
        )}
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>{children}</SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

/** One app: folds open to its requests and settings, like "Tasks ^" with its sub-items. */
function AppItem({ app, pathname }: { app: SidebarApp; pathname: string }) {
  const base = `/dashboard/apps/${app.id}`;
  const inApp = pathname.startsWith(base);

  return (
    <Collapsible defaultOpen={inApp} className="group/app">
      <SidebarMenuItem>
        <SidebarMenuButton render={<CollapsibleTrigger />} isActive={inApp} tooltip={app.name}>
          <span className="bg-sidebar-accent text-sidebar-accent-foreground flex size-4 shrink-0 items-center justify-center rounded text-[10px] font-semibold uppercase">
            {app.name.trim()[0] ?? "?"}
          </span>
          <span className="truncate">{app.name}</span>
          <ChevronRight className="ml-auto transition-transform group-data-[open]/app:rotate-90" />
        </SidebarMenuButton>
        {app.newCount > 0 && (
          <SidebarMenuBadge className="bg-destructive right-7 rounded-full px-1.5 text-white peer-hover/menu-button:text-white peer-data-active/menu-button:text-white">
            {app.newCount > 99 ? "99+" : app.newCount}
          </SidebarMenuBadge>
        )}
        <CollapsibleContent>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton render={<Link href={base} />} isActive={pathname === base}>
                <Inbox />
                <span>Requests</span>
                <span className="text-muted-foreground ml-auto text-xs tabular-nums">{app.featureCount}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton
                render={<Link href={`${base}/settings`} />}
                isActive={pathname === `${base}/settings`}
              >
                <Settings />
                <span>Settings</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function useBillingPortal() {
  const [isOpening, setIsOpening] = useState(false);

  async function open() {
    setIsOpening(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in.");
      const response = await fetch("/api/internal/billing/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to open billing portal.");
      window.location.href = data.portalUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open billing portal.");
      setIsOpening(false);
    }
  }

  return { open, isOpening };
}

/** The plan, as a footer link: Upgrade on Free, billing on paid plans. */
function PlanItem({ plan, hasBillingAccount }: { plan: Plan; hasBillingAccount: boolean }) {
  const billing = useBillingPortal();
  const badge = (
    <span className="bg-primary/10 text-primary ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none">
      {PLAN_LABEL[plan]}
    </span>
  );

  if (plan === "free" || !hasBillingAccount) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton render={<Link href="/pricing" />} tooltip={plan === "free" ? "Upgrade" : "Plans"}>
          <Sparkles className="text-primary" />
          <span>{plan === "free" ? "Upgrade" : "Plans"}</span>
          {badge}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={billing.open} disabled={billing.isOpening} tooltip="Billing">
        <CreditCard />
        <span>{billing.isOpening ? "Opening..." : "Billing"}</span>
        {badge}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** Avatar, name and email; opens a menu with plan, billing and sign out. */
function AccountMenu({ plan, hasBillingAccount }: { plan: Plan; hasBillingAccount: boolean }) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const billing = useBillingPortal();
  const [user, setUser] = useState<User | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut(auth);
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/login");
    } catch {
      setIsSigningOut(false);
    }
  }

  const name = user?.displayName ?? "Account";
  const initial = (user?.displayName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();
  const identity = (
    <>
      <Avatar className="size-8 rounded-lg">
        <AvatarImage src={user?.photoURL ?? undefined} alt="" />
        <AvatarFallback className="rounded-lg">{initial}</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{name}</span>
        <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
      </div>
    </>
  );

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              size="lg"
              className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
            />
          }
        >
          {identity}
          <ChevronsUpDown className="ml-auto size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
          className="w-(--anchor-width) min-w-56"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center gap-2 px-1 py-1.5 font-normal text-foreground">
              {identity}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>{PLAN_LABEL[plan]} plan</DropdownMenuLabel>
            {plan === "free" ? (
              <DropdownMenuItem render={<Link href="/pricing" />}>
                <Sparkles />
                Upgrade
              </DropdownMenuItem>
            ) : (
              hasBillingAccount && (
                <DropdownMenuItem onClick={billing.open} disabled={billing.isOpening}>
                  <CreditCard />
                  {billing.isOpening ? "Opening..." : "Manage billing"}
                </DropdownMenuItem>
              )
            )}
            <DropdownMenuItem render={<Link href="/pricing" />}>
              <Tag />
              Pricing
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/docs" />}>
              <BookOpen />
              Docs
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
            <LogOut />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
