import Link from "next/link";
import Image from "next/image";
import { createPageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { assetPath } from "@/lib/base-path";
import { dataProvider } from "@/lib/data-provider";
import { SITE } from "@/lib/constants";

export const metadata = createPageMetadata({
  title: "Blog & News",
  description: `Travel news, Umrah guides and tips from ${SITE.name}.`,
  path: "/blog/",
});

export default async function BlogPage() {
  const posts = await dataProvider.getBlogPosts();

  return (
    <>
      <PageHero {...PAGE_HEROES.blog} />

      <section className="section-padding">
        <div className="container-wide">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}/`}
                className="group overflow-hidden rounded-xl border border-border/60 bg-white"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={assetPath(post.coverImage)}
                    alt={post.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-sm font-semibold text-navy group-hover:text-royal">
                    {post.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
