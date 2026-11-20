"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Route, IdCard, Truck, Container, Building2, BookOpen, Video, Users, UserCircle2, LogOut, Menu, X,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dispatches", label: "Dispatch", icon: Route },
  { href: "/drivers", label: "Drivers", icon: IdCard },
  { href: "/trucks", label: "Trucks", icon: Truck },
  { href: "/trailers", label: "Trailers", icon: Container },
  { href: "/companies", label: "Companies", icon: Building2 },
  { section: "Training" },
  { href: "/syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/lectures", label: "Daily Lectures", icon: Video },
  { section: "Account" },
  { href: "/users", label: "Staff & Dispatchers", icon: Users, admin: true },
  { href: "/profile", label: "My Profile", icon: UserCircle2 },
];

export default function Shell({ user, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = (user.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
      {NAV.filter((n) => !n.admin || user.role === "admin").map((n, i) =>
        n.section ? (
          <p key={i} className="mt-5 px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">{n.section}</p>
        ) : (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              pathname === n.href || pathname.startsWith(n.href + "/")
                ? "bg-gradient-to-r from-gold-500 to-gold-400 text-navy-950 shadow"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <n.icon className="h-[18px] w-[18px] shrink-0" />
            {n.label}
          </Link>
        )
      )}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-900 bg-[linear-gradient(180deg,#0a1a45_0%,#071436_100%)]">
      <div className="p-4">
        <Link href="/dashboard" className="block rounded-xl bg-white p-2 shadow-lg">
          <img src="/logo.jpeg" alt="Kripa Truck Dispatch & Logistics" className="mx-auto h-20 w-auto object-contain" />
        </Link>
      </div>
      {nav}
      <div className="border-t border-white/10 p-4">
        <form action="/api/auth/logout" method="post">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white">
            <LogOut className="h-[18px] w-[18px]" /> Logout
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      {open && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button className="icon-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="hidden h-1.5 w-24 rounded-full bg-gradient-to-r from-royal-600 via-navy-800 to-gold-500 sm:block" />
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-navy-900">{user.name}</p>
              <p className="text-xs capitalize text-slate-500">{user.role}</p>
            </div>
            <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-gold-400">
              {initials}
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
