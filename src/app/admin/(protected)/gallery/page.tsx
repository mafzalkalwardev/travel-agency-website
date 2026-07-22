import { AdminCrudManager } from "@/components/admin/AdminCrudManager";

export default function AdminGalleryPage() {
  return (
    <AdminCrudManager
      title="Gallery"
      description="Organize gallery images — choose a file to upload or paste an image link."
      table="gallery_items"
    />
  );
}
