import { AdminCrudManager } from "@/components/admin/AdminCrudManager";

export default function AdminAnnouncementsPage() {
  return <AdminCrudManager title="Announcements" description="Manage homepage ticker announcements." table="announcements" />;
}
