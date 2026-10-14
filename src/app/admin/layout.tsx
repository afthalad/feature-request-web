import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/requireUser";
import { isAdminUid } from "@/lib/auth/requireAdmin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdminUid(user.uid)) redirect("/dashboard");

  const cookieStore = await cookies();
  // Remember whether the sidebar was collapsed (the shadcn sidebar writes this cookie).
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AdminSidebar />
        <SidebarInset>
          <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center justify-between px-4 backdrop-blur">
            <SidebarTrigger />
            <ThemeToggle />
          </header>
          {/* Borderless admin: cards drop their outline and sit on a soft fill instead. */}
          <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 pt-2 pb-10 [&_[data-slot=card]]:bg-muted/40 [&_[data-slot=card]]:ring-0">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
