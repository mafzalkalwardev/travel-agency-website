import { AdminCrudManager } from "@/components/admin/AdminCrudManager";

export default function AdminFlyersPage() {
  return (
    <AdminCrudManager
      title="Flyers"
      description="Add promotional flyers — choose a file to upload or paste an image link."
      table="flyers"
    />
  );
}
