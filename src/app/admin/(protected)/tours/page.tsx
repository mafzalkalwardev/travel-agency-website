import { AdminCrudManager } from "@/components/admin/AdminCrudManager";

export default function AdminToursPage() {
  return (
    <AdminCrudManager
      title="Tours"
      description="Create and manage the tour posts and cards shown on the public Tours page."
      table="tours"
    />
  );
}
