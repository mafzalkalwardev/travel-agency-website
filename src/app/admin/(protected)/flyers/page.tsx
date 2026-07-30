import { AdminCrudManager } from "@/components/admin/AdminCrudManager";

export default function AdminFlyersPage() {
  return (
    <AdminCrudManager
      title="Flyers"
      description="Homepage 3D hero banners and promo brochures. Active flyers (by display order) appear in the hero carousel — upload images or paste a URL, then set Active."
      table="flyers"
    />
  );
}
