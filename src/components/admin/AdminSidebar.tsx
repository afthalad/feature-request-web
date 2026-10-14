"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  ArrowLeft,
  Ban,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Users,
} from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/apps", label: "Apps", icon: LayoutGrid },
  { href: "/admin/api-keys", label: "API keys", icon: KeyRound },
  { href: "/admin/unsubscribes", label: "Unsubscribes", icon: Ban },
];

export function AdminSidebar() {
  const pathname = usePathname();
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

  const initial = (user?.displayName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/admin" />} tooltip="Fewchurs admin">
              <Image src="/logo-mark.svg" alt="" width={24} height={24} priority className="size-6" />
              <span className="font-semibold tracking-tight">Fewchurs</span>
              <span className="bg-primary/10 text-primary ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide">
                Admin
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton render={<Link href={href} />} isActive={active} tooltip={label}>
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard" />} tooltip="Back to dashboard">
              <ArrowLeft />
              <span>Back to dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} disabled={isSigningOut} tooltip="Sign out">
              <LogOut />
              <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="flex items-center gap-2 px-1 py-1.5 group-data-[collapsible=icon]:hidden">
            <Avatar className="size-8 rounded-lg">
              <AvatarImage src={user?.photoURL ?? undefined} alt="" />
              <AvatarFallback className="rounded-lg">{initial}</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-sm leading-tight">
              <span className="truncate font-medium">{user?.displayName ?? "Admin"}</span>
              <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
