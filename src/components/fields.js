"use client";

import { useEffect, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { RESOURCES, refLabel } from "@/lib/resources";
import { api } from "@/lib/client";
import { DocButtons } from "./ui";
import { CHUNK_SIZE, MAX_FILE_SIZE, FILE_TYPES, extOf } from "@/lib/files";

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
  const [progress, setProgress] = useState(0);

  async function upload(file) {
    if (!file) return;
    if (!FILE_TYPES[extOf(file.name)]) return setErr("Only PDF, image (PNG/JPG/WEBP) or Word files can be uploaded.");
    if (file.size > MAX_FILE_SIZE) return setErr("File is larger than 15 MB.");
    setBusy(true);
    setErr("");
    setProgress(0);
    try {
      // Send the file in 3 MB pieces (hosting limits a single request to ~4.5 MB).
      const total = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
      let id = "";
      let url = "";
      for (let i = 0; i < total; i++) {
        const fd = new FormData();
        fd.append("chunk", file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE), file.name);
        fd.append("index", i);
        fd.append("total", total);
        fd.append("name", file.name);
        fd.append("size", file.size);
        if (id) fd.append("id", id);
        const d = await api("/api/upload", { method: "POST", body: fd });
        id = d.id;
        url = d.url;
        setProgress(Math.round(((i + 1) / total) * 100));
      }
      onChange(url);
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  return (
    <div>
      {value ? (
        <div className="space-y-2 rounded-lg border border-emerald-300 bg-emerald-50/60 px-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="flex-1 font-medium text-emerald-800">File uploaded</span>
            <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-slate-500 hover:bg-red-50 hover:text-red-600" title="Remove file">
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
          <DocButtons url={value} compact />
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:border-royal-500 hover:text-royal-600">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? `Uploading… ${progress}%` : "Upload PDF, image or Word file"}
          <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" onChange={(e) => {
              upload(e.target.files?.[0]);
              e.target.value = "";
            }} />
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
            <option key={o} value={o}>
              {f.labels?.[o] ? `${o} — ${f.labels[o]}` : o}
            </option>
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
