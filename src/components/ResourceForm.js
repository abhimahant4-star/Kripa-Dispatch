"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { RESOURCES, allFields } from "@/lib/resources";
import { api } from "@/lib/client";
import { PageHeader } from "./ui";
import { FieldInput, invalidateRef } from "./fields";

export default function ResourceForm({ resourceKey, id }) {
  const cfg = RESOURCES[resourceKey];
  const router = useRouter();
  const [values, setValues] = useState(() => {
    const init = {};
    for (const f of allFields(cfg)) if (f.default !== undefined) init[f.name] = f.default;
    return init;
  });
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api(`/api/${resourceKey}/${id}`)
      .then((d) => setValues(d.item))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, resourceKey]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const d = await api(id ? `/api/${resourceKey}/${id}` : `/api/${resourceKey}`, { method: id ? "PUT" : "POST", body: values });
      invalidateRef(resourceKey);
      router.push(`/${resourceKey}/${d.item._id}`);
      router.refresh();
    } catch (e) {
      setError(e.message);
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const set = (name) => (v) => setValues((s) => ({ ...s, [name]: v }));

  if (loading) return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-royal-600" />;

  return (
    <>
      <PageHeader
        title={id ? `Edit ${cfg.singular}` : `Add ${cfg.singular}`}
        subtitle={`Fields marked with * are required.`}
        back={{ href: `/${resourceKey}`, label: `Back to ${cfg.label}` }}
      />
      <form onSubmit={submit} className="space-y-6">
        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {cfg.sections.map((s) => (
          <section key={s.title} className="card p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-navy-800">{s.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {s.fields.map((f) => (
                <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2 lg:col-span-3" : ""}>
                  <label className="label" htmlFor={f.name}>
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>
                  <FieldInput field={f} value={values[f.name]} onChange={set(f.name)} />
                  {f.hint && <p className="mt-1 text-xs text-slate-400">{f.hint}</p>}
                </div>
              ))}
            </div>
          </section>
        ))}
        <div className="flex gap-2">
          <button className="btn-gold" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save {cfg.singular}
          </button>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
