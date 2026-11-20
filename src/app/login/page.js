"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error || "Login failed");
    const next = sp.get("next");
    router.replace(next && next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input id="email" type="email" required autoComplete="username" className="input pl-9" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@kripadispatch.com" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input id="password" type="password" required autoComplete="current-password" className="input pl-9" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button className="btn-gold w-full py-2.5" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-900 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(47,102,232,0.45),transparent_50%),radial-gradient(circle_at_80%_90%,rgba(212,160,23,0.35),transparent_45%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-400">Learn · Dispatch · Grow</p>
          <div>
            <h1 className="text-4xl font-bold leading-tight">Every truck, driver and load in one place.</h1>
            <p className="mt-4 max-w-md text-lg text-slate-300">
              Assign drivers to trucks, build dispatches with pickup and delivery stops, track check calls and print invoices.
            </p>
          </div>
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} Kripa Truck Dispatch & Logistics</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <img src="/logo.jpeg" alt="Kripa Truck Dispatch & Logistics" className="mx-auto mb-8 w-64" />
          <div className="card p-6">
            <h2 className="text-xl font-bold text-navy-900">Admin sign in</h2>
            <p className="mb-6 mt-1 text-sm text-slate-500">Use your staff account to continue.</p>
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
