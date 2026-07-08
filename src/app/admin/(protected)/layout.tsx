import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Toaster } from "sonner";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isSupabaseConfigured()) {
    const admin = await requireAdmin();
    if (!admin) redirect("/admin/login/");
  }

  return (
    <div className="flex min-h-screen bg-light-bg">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
