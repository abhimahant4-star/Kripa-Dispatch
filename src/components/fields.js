"use client";

import { useEffect, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { RESOURCES, refLabel } from "@/lib/resources";
import { api } from "@/lib/client";

const refCache = {};

export function useRefOptions(ref) {
  const [opts, setOpts] = useState(refCache[ref] || null);
  useEffect(() => {
    if (!ref || refCache[ref]) return;
    let alive = true;
    const sort = ref === "drivers" ? "firstName" : ref === "companies" ? "name" : "unitNumber";
    api(`/api/${ref}?limit=1000&sort=${sort}`)
      .then((d) => {
        refCache[ref] = d.items;
        if (alive) setOpts(d.items);
      })
      .catch(() => alive && setOpts([]));
    return () => {
      alive = false;
    };
  }, [ref]);
  return opts;
}

export function invalidateRef(ref) {
  delete refCache[ref];
}

export function toDateInput(v) {
  if (!v) return "";
  const s = typeof v === "string" ? v : new Date(v).toISOString();
  return s.slice(0, 10);
}

export function RefSelect({ refKey, value, onChange, required, placeholder, filter, ...rest }) {
  const options = useRefOptions(refKey);
  const id = value && typeof value === "object" ? value._id : value || "";
  const list = (options || []).filter((o) => !filter || filter(o) || o._id === id);
  return (
    <select className="input" value={id} required={required} onChange={(e) => onChange(e.target.value)} {...rest}>
      <option value="">{options ? placeholder || `Select ${RESOURCES[refKey].singular}` : "Loading…"}</option>
      {list.map((o) => (
        <option key={o._id} value={o._id}>
          {refLabel(refKey, o)}
          {o.status && o.status !== "Available" ? ` — ${o.status}` : ""}
        </option>
      ))}
    </select>
  );
}

export function FileInput({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function upload(file) {
    if (!file) return;
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const d = await api("/api/upload", { method: "POST", body: fd });
      onChange(d.url);
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
          <FileText className="h-4 w-4 text-royal-600" />
          <a href={value} target="_blank" className="flex-1 truncate font-medium text-royal-600 hover:underline">
            View uploaded file
          </a>
          <button type="button" onClick={() => onChange("")} className="text-slate-400 hover:text-red-600" title="Remove">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:border-royal-500 hover:text-royal-600">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Uploading…" : "Upload PDF or image"}
          <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      )}
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

export function FieldInput({ field: f, value, onChange }) {
  const common = { id: f.name, name: f.name, required: f.required, placeholder: f.placeholder };
  switch (f.type) {
    case "select":
      return (
        <select className="input" {...common} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select {f.label}</option>
          {f.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      );
    case "textarea":
      return <textarea className="input min-h-24" {...common} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "date":
      return <input type="date" className="input" {...common} value={toDateInput(value)} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return <input type="number" step={f.step || "any"} className="input" {...common} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "ref":
      return <RefSelect refKey={f.ref} value={value} onChange={onChange} />;
    case "file":
      return <FileInput value={value} onChange={onChange} />;
    case "password":
      return <input type="password" autoComplete="new-password" className="input" {...common} required={false} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <input type={f.type || "text"} className="input" {...common} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
}
