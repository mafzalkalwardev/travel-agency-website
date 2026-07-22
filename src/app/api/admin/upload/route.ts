import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_BUCKETS = new Set([
  "flyers",
  "gallery",
  "packages",
  "blog",
  "airlines",
  "heroes",
  "reviews",
  "uploads",
]);

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MAX_BYTES = 8 * 1024 * 1024;

function extensionFor(type: string, filename: string) {
  const fromName = filename.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  if (type === "image/svg+xml") return "svg";
  return "bin";
}

async function ensurePublicBucket(bucket: string) {
  const supabase = createAdminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets || []).some((item) => item.name === bucket);
  if (exists) return { ok: true as const };

  const { error } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: [...ALLOWED_TYPES],
  });
  if (error && !/already exists/i.test(error.message)) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  const bucketRaw = String(form.get("bucket") || "uploads").trim().toLowerCase();
  const bucket = ALLOWED_BUCKETS.has(bucketRaw) ? bucketRaw : "uploads";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image file." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPG, PNG, WebP, GIF, or SVG." },
      { status: 400 }
    );
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be between 1 byte and 8 MB." }, { status: 400 });
  }

  const ensured = await ensurePublicBucket(bucket);
  if (!ensured.ok) {
    return NextResponse.json(
      {
        error:
          ensured.error ||
          `Storage bucket "${bucket}" is missing. Create it in Supabase Storage (public read).`,
      },
      { status: 500 }
    );
  }

  const ext = extensionFor(file.type, file.name || "image");
  const path = `admin/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const supabase = createAdminClient();

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
    cacheControl: "3600",
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    return NextResponse.json({ error: "Upload succeeded but public URL was not returned." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    url: data.publicUrl,
    bucket,
    path,
  });
}
