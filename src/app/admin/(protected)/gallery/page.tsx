import { AdminCrudManager } from "@/components/admin/AdminCrudManager";

export default function AdminGalleryPage() {
  return <AdminCrudManager title="Gallery" description="Upload and organize gallery images." table="gallery_items" />;
}
