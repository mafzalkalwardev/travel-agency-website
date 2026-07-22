import { AdminCrudManager } from "@/components/admin/AdminCrudManager";

export default function AdminBlogPage() {
  return <AdminCrudManager title="Blog Posts" description="Create, edit, and publish travel articles and news." table="blog_posts" />;
}
