"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { BookOpen, CreditCard, LayoutGrid, LogOut, Plus, Sparkles, Tag } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Logo } from "@/components/layout/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { Plan } from "@/types";

export interface SidebarApp {
  id: string;
  name: string;
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
    <Sidebar>
      <SidebarHeader className="h-14 justify-center px-4">
        <Logo href="/dashboard" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/docs" />}
                  isActive={pathname.startsWith("/docs")}
                >
                  <BookOpen />
                  <span>Docs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/pricing" />}>
                  <Tag />
                  <span>Pricing</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Apps</SidebarGroupLabel>
          <SidebarGroupAction render={<Link href="/dashboard/apps/new" />} title="New app">
            <Plus />
            <span className="sr-only">New app</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/dashboard" />}
                  isActive={pathname === "/dashboard"}
                >
                  <LayoutGrid />
                  <span>All apps</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {apps.map((app) => (
                <SidebarMenuItem key={app.id}>
                  <SidebarMenuButton
                    render={<Link href={`/dashboard/apps/${app.id}`} />}
                    isActive={pathname.startsWith(`/dashboard/apps/${app.id}`)}
                  >
                    <span className="bg-muted text-muted-foreground flex size-4 shrink-0 items-center justify-center rounded text-[10px] font-semibold uppercase">
                      {app.name.trim()[0] ?? "?"}
                    </span>
                    <span className="truncate">{app.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <PlanCard plan={plan} hasBillingAccount={hasBillingAccount} />
        <SidebarSeparator className="mx-0" />
        <AccountRow />
      </SidebarFooter>
    </Sidebar>
  );
}

function PlanCard({ plan, hasBillingAccount }: { plan: Plan; hasBillingAccount: boolean }) {
  const [isOpening, setIsOpening] = useState(false);

  async function openBillingPortal() {
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

  return (
    <div className="bg-sidebar-accent/60 space-y-2 rounded-lg p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        {plan === "free" ? <Sparkles className="text-primary size-4" /> : <CreditCard className="size-4" />}
        {PLAN_LABEL[plan]} plan
      </div>
      {plan === "pro" ? null : (
        <p className="text-muted-foreground text-xs">
          {plan === "free"
            ? "Your board shows each app's first 5 requests."
            : "Your board shows each app's first 200 requests."}
        </p>
      )}
      {plan === "free" ? (
        <Link href="/pricing" className={buttonVariants({ size: "sm", className: "w-full" })}>
          Upgrade
        </Link>
      ) : hasBillingAccount ? (
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={openBillingPortal}
          disabled={isOpening}
        >
          {isOpening ? "Opening..." : "Manage billing"}
        </Button>
      ) : null}
    </div>
  );
}

function AccountRow() {
  const router = useRouter();
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

  const initial = user?.displayName?.[0] ?? user?.email?.[0] ?? "?";

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center gap-2 px-1 py-1">
        <Avatar className="size-7">
          <AvatarImage src={user?.photoURL ?? undefined} alt="" />
          <AvatarFallback className="text-xs">{initial.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 text-xs">
          <p className="truncate font-medium">{user?.displayName ?? "Account"}</p>
          <p className="text-muted-foreground truncate">{user?.email}</p>
        </div>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={handleSignOut} disabled={isSigningOut}>
          <LogOut />
          <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
