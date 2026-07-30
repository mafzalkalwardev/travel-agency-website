"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminCrudConfigs,
  defaultFieldValue,
  emptyCrudForm,
  isAdminCrudTable,
  slugify,
  type FieldConfig,
  type TableConfig,
} from "@/lib/admin/crud-tables";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { isSupabaseConfigured } from "@/lib/supabase/env";

interface AdminCrudManagerProps {
  title: string;
  description: string;
  table: string;
}

type Row = Record<string, unknown> & { id: string };

function statusBadge(value: unknown) {
  const raw = String(value ?? "");
  if (raw === "true" || raw === "active" || raw === "published") {
    return <Badge className="bg-emerald-100 text-emerald-800">{raw === "true" ? "active" : raw}</Badge>;
  }
  if (raw === "false" || raw === "inactive" || raw === "sold_out") {
    return <Badge className="bg-amber-100 text-amber-900">{raw === "false" ? "off" : raw}</Badge>;
  }
  return <Badge variant="outline">{raw || "—"}</Badge>;
}

export function AdminCrudManager({ title, description, table }: AdminCrudManagerProps) {
  const config: TableConfig | undefined = isAdminCrudTable(table) ? adminCrudConfigs[table] : undefined;
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<Record<string, unknown>>(() =>
    config ? emptyCrudForm(config) : {}
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const configured = isSupabaseConfigured();

  const loadRows = useCallback(async () => {
    if (!configured || !config) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/admin/crud/${table}/`, { cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { rows?: Row[]; error?: string };
    if (!res.ok) {
      toast.error(json.error || "Failed to load records");
      setRows([]);
    } else {
      setRows(json.rows || []);
    }
    setLoading(false);
  }, [config, configured, table]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !config) return rows;
    return rows.filter((row) => {
      const titleVal = String(row[config.titleKey] || "");
      const statusVal = config.statusKey ? String(row[config.statusKey] || "") : "";
      const source = String(row.source_provider || "");
      return (
        titleVal.toLowerCase().includes(q) ||
        statusVal.toLowerCase().includes(q) ||
        source.toLowerCase().includes(q) ||
        String(row.id).toLowerCase().includes(q)
      );
    });
  }, [config, query, rows]);

  function startEdit(row: Row) {
    if (!config) return;
    setEditingId(row.id);
    setForm(
      Object.fromEntries(
        config.fields.map((field) => [field.key, row[field.key] ?? defaultFieldValue(field)])
      )
    );
  }

  function resetForm() {
    setEditingId(null);
    setForm(config ? emptyCrudForm(config) : {});
  }

  function onTitleBlur() {
    if (!config) return;
    const hasSlug = config.fields.some((f) => f.key === "slug");
    if (!hasSlug) return;
    const titleVal = String(form.title || "");
    const slugVal = String(form.slug || "");
    if (titleVal && !slugVal) {
      setForm((prev) => ({ ...prev, slug: slugify(titleVal) }));
    }
  }

  async function save() {
    if (!config) return;
    setSaving(true);
    const endpoint = editingId ? `/api/admin/crud/${table}/${editingId}/` : `/api/admin/crud/${table}/`;
    const res = await fetch(endpoint, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      toast.error(json.error || "Save failed");
      return;
    }
    toast.success(editingId ? "Updated" : "Created");
    resetForm();
    loadRows();
  }

  async function remove(row: Row) {
    const label = String(row[config?.titleKey || "id"] || row.id);
    const synced = config?.syncAware && row.source_provider && row.source_provider !== "manual";
    const ok = window.confirm(
      synced
        ? `Delete "${label}"? This row looks inventory-synced and may reappear on the next sync.`
        : `Delete "${label}"? This cannot be undone.`
    );
    if (!ok) return;

    const res = await fetch(`/api/admin/crud/${table}/${row.id}/`, { method: "DELETE" });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast.error(json.error || "Delete failed");
      return;
    }
    toast.success("Deleted");
    if (editingId === row.id) resetForm();
    loadRows();
  }

  function imageFieldKey(cfg: TableConfig) {
    return cfg.fields.find((field) => field.type === "image")?.key;
  }

  function renderField(field: FieldConfig) {
    const id = `${table}-${field.key}`;
    if (field.type === "image") {
      return (
        <AdminImageField
          id={id}
          value={String(form[field.key] ?? "")}
          required={field.required}
          bucket={field.bucket || "uploads"}
          onChange={(url) => setForm({ ...form, [field.key]: url })}
        />
      );
    }
    if (field.type === "textarea") {
      return (
        <Textarea
          id={id}
          required={field.required}
          value={String(form[field.key] ?? "")}
          onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
          onBlur={field.key === "title" ? onTitleBlur : undefined}
        />
      );
    }
    if (field.type === "boolean") {
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(form[field.key])}
            onChange={(e) => setForm({ ...form, [field.key]: e.target.checked })}
          />
          Enabled
        </label>
      );
    }
    if (field.type === "select" && field.options?.length) {
      return (
        <select
          id={id}
          className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
          value={String(form[field.key] ?? field.options[0])}
          onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
        >
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }
    return (
      <Input
        id={id}
        type={field.type === "number" ? "number" : "text"}
        required={field.required && field.key !== "slug"}
        value={String(form[field.key] ?? "")}
        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
        onBlur={field.key === "title" ? onTitleBlur : undefined}
      />
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {config?.syncAware && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Inventory sync can create or update rows here. Manual edits on synced packages may be overwritten
          on the next sync — prefer status/featured tweaks, or mark source as manual when adding your own.
        </p>
      )}

      {!configured || !config ? (
        <div className="mt-6 rounded-xl border border-border bg-white p-6">
          <p className="text-sm text-muted-foreground">
            Table: <code className="rounded bg-light-bg px-1.5 py-0.5">{table}</code>
          </p>
          <p className="mt-4 rounded-lg border border-gold/30 bg-gold/10 p-4 text-sm">
            Add Supabase environment variables and run <code>supabase/schema.sql</code> to enable
            database-backed management for {title.toLowerCase()}.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[400px_1fr]">
          <section className="rounded-xl border border-border bg-white p-5">
            <h2 className="font-heading text-lg font-semibold text-navy">
              {editingId ? "Edit item" : "Add item"}
            </h2>
            <div className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
              {config.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={`${table}-${field.key}`}>{field.label}</Label>
                  {renderField(field)}
                  {field.hint && <p className="text-[11px] text-muted-foreground">{field.hint}</p>}
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Button variant="navy" onClick={save} disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update" : "Create"}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-border bg-white">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, status, source..."
                className="border-0 shadow-none focus-visible:ring-0"
              />
              <span className="shrink-0 text-xs text-muted-foreground">{filtered.length} shown</span>
            </div>
            {loading ? (
              <p className="p-6 text-muted-foreground">Loading...</p>
            ) : filtered.length ? (
              <div className="divide-y">
                {filtered.map((row) => {
                  const thumbKey = imageFieldKey(config);
                  const thumb = thumbKey ? String(row[thumbKey] || "") : "";
                  return (
                  <div
                    key={row.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      {thumb ? (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-slate-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : null}
                      <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium text-navy">
                        {String(row[config.titleKey] || row.id)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {config.statusKey && statusBadge(row[config.statusKey])}
                        {row.source_provider ? (
                          <span className="rounded bg-slate-100 px-2 py-0.5">
                            source: {String(row.source_provider)}
                          </span>
                        ) : null}
                        {row.featured === true ? (
                          <span className="rounded bg-gold/15 px-2 py-0.5 text-[#8a6a20]">featured</span>
                        ) : null}
                      </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outlineDark" onClick={() => startEdit(row)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(row)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <p className="p-6 text-muted-foreground">
                {query ? "No matching records." : "No records yet. Create the first one on the left."}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

/** @deprecated Use AdminCrudManager — kept for older imports */
export const AdminCrudPlaceholder = AdminCrudManager;
