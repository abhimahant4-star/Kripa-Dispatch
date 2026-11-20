"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Eye, Pencil, Trash2, Plus, Search, ChevronUp, ChevronDown, FileText, ExternalLink, Loader2 } from "lucide-react";
import { RESOURCES, allFields, refLabel } from "@/lib/resources";
import { api, canWrite } from "@/lib/client";
import { PageHeader, Badge, fmtDate, ExpiryText, Empty } from "./ui";

const PAGE_SIZE = 20;

export function Cell({ col, row, resourceKey }) {
  const cfg = RESOURCES[resourceKey];
  const v = row[col.key];
  let main;
  switch (col.render) {
    case "title":
      main = <span className="font-semibold text-navy-900">{cfg.title(row)}</span>;
      break;
    case "location":
      main = row.city ? `${row.city}, ${row.state || ""}` : "—";
      break;
    case "badge":
      main = <Badge value={v} />;
      break;
    case "date":
      main = fmtDate(v) || "—";
      break;
    case "expiry":
      main = <ExpiryText value={v} />;
      break;
    case "ref": {
      const field = allFields(cfg).find((f) => f.name === col.key);
      main = v ? (
        <Link className="font-medium text-royal-600 hover:underline" href={`/${field.ref}/${v._id}`}>
          {refLabel(field.ref, v)}
        </Link>
      ) : (
        <span className="text-slate-400">Unassigned</span>
      );
      break;
    }
    case "file":
      main = v ? (
        <a href={v} target="_blank" className="inline-flex items-center gap-1 font-medium text-royal-600 hover:underline">
          <FileText className="h-4 w-4" /> Open PDF
        </a>
      ) : (
        <span className="text-slate-400">—</span>
      );
      break;
    case "link":
      main = v ? (
        <a href={v} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-royal-600 hover:underline">
          <ExternalLink className="h-4 w-4" /> Open
        </a>
      ) : (
        <span className="text-slate-400">—</span>
      );
      break;
    case "makeModel":
      main = [row.make, row.model].filter(Boolean).join(" ") || "—";
      break;
    default:
      main = v === undefined || v === null || v === "" ? <span className="text-slate-400">—</span> : String(v);
  }

  let sub = null;
  if (col.sub) {
    const s = row[col.sub];
    if (col.subRender === "expiry") sub = s ? <>Valid till <ExpiryText value={s} /></> : null;
    else if (col.subRender === "tonnes") sub = s ? `${s} tonnes` : null;
    else if (col.subRender === "ft") sub = s ? `${s} ft` : null;
    else sub = s ? `${col.subPrefix || ""}${s}` : null;
  }

  return (
    <div>
      <div className={col === cfg.columns[0] && !col.render ? "font-semibold text-navy-900" : ""}>{main}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export default function ResourceList({ resourceKey, role }) {
  const cfg = RESOURCES[resourceKey];
  const filterFields = allFields(cfg).filter((f) => f.filter && f.options);
  const writable = canWrite(resourceKey, role);

  const [draft, setDraft] = useState({ q: "" });
  const [query, setQuery] = useState({ q: "" });
  const [sort, setSort] = useState(cfg.defaultSort || "-createdAt");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page, limit: PAGE_SIZE, sort });
    Object.entries(query).forEach(([k, v]) => v && params.set(k, v));
    try {
      setData(await api(`/api/${resourceKey}?${params}`));
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [resourceKey, query, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(row) {
    if (!confirm(`Delete ${cfg.title(row)}? This cannot be undone.`)) return;
    try {
      await api(`/api/${resourceKey}/${row._id}`, { method: "DELETE" });
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  function toggleSort(key) {
    setSort((s) => (s === key ? `-${key}` : key));
    setPage(1);
  }

  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <>
      <PageHeader title={`${cfg.label}`} subtitle={cfg.description}>
        {writable && (
          <Link href={`/${resourceKey}/new`} className="btn-gold">
            <Plus className="h-4 w-4" /> Add {cfg.singular}
          </Link>
        )}
      </PageHeader>

      <form
        className="card mb-6 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(draft);
          setPage(1);
        }}
      >
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="label">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder={cfg.searchFields.slice(0, 3).join(", ")} value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
          </div>
        </div>
        {filterFields.map((f) => (
          <div key={f.name}>
            <label className="label">{f.label}</label>
            <select className="input" value={draft[f.name] || ""} onChange={(e) => setDraft({ ...draft, [f.name]: e.target.value })}>
              <option value="">All</option>
              {f.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        ))}
        <div className="flex items-end gap-2">
          <button className="btn-navy">Search</button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setDraft({ q: "" });
              setQuery({ q: "" });
              setPage(1);
            }}
          >
            Reset
          </button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold text-navy-900">Saved {cfg.label}</h2>
          <span className="rounded-full bg-royal-50 px-3 py-1 text-xs font-semibold text-royal-600">
            {loading ? <Loader2 className="inline h-3 w-3 animate-spin" /> : `${data.total} records`}
          </span>
        </div>
        {error && <p className="m-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/70">
              <tr>
                {cfg.columns.map((c) => (
                  <th key={c.key} className="th">
                    <button className="inline-flex items-center gap-1 uppercase" onClick={() => toggleSort(c.key)}>
                      {c.label}
                      {sort === c.key ? <ChevronUp className="h-3 w-3" /> : sort === `-${c.key}` ? <ChevronDown className="h-3 w-3" /> : null}
                    </button>
                  </th>
                ))}
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((row) => (
                <tr key={row._id} className="hover:bg-royal-50/40">
                  {cfg.columns.map((c) => (
                    <td key={c.key} className="td">
                      <Cell col={c} row={row} resourceKey={resourceKey} />
                    </td>
                  ))}
                  <td className="td">
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/${resourceKey}/${row._id}`} className="icon-btn text-royal-600" title="View">
                        <Eye className="h-4 w-4" />
                      </Link>
                      {writable && (
                        <>
                          <Link href={`/${resourceKey}/${row._id}/edit`} className="icon-btn text-gold-600" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button onClick={() => remove(row)} className="icon-btn text-red-600" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !data.items.length && (
            <Empty title={`No ${cfg.label.toLowerCase()} found`}>
              {writable ? `Add your first ${cfg.singular.toLowerCase()} with the button above.` : "Nothing has been added yet."}
            </Empty>
          )}
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
            <span className="text-slate-500">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <button className="btn-ghost py-1.5" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <button className="btn-ghost py-1.5" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
