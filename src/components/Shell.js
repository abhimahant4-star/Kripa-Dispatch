"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Users, UserCircle2, LogOut, Menu, X, ChevronDown, DatabaseBackup } from "lucide-react";

// Top navigation, in the same order as the client's reference app.
const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/drivers", label: "Driver" },
  { href: "/trucks", label: "Truck" },
  { href: "/trailers", label: "Trailer" },
  { href: "/companies", label: "Company" },
  { href: "/dispatches", label: "Dispatch" },
  { href: "/syllabus", label: "Syllabus" },
  { href: "/lectures", label: "Daily Lectures" },
];

const MENU = [
  { href: "/profile", label: "My Profile", icon: UserCircle2 },
  { href: "/users", label: "Staff & Dispatchers", icon: Users, admin: true },
  { href: "/backup", label: "Data Backup", icon: DatabaseBackup, admin: true },
];

export default function Shell({ user, children }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const initials = (user.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");
  const menu = MENU.filter((m) => !m.admin || user.role === "admin");

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 bg-navy-900 bg-[linear-gradient(90deg,#071436_0%,#0a1a45_60%,#0f2560_100%)] text-white shadow-lg">
        <div className="relative mx-auto flex h-20 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="shrink-0 rounded-lg bg-white px-2 py-1 shadow" aria-label="Kirpa Truck Dispatch & Logistics — Dashboard">
            <img src="/logo.jpeg" alt="Kirpa Truck Dispatch & Logistics" className="h-16 w-auto object-contain" />
          </Link>

          <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 xl:flex 2xl:gap-2">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`relative whitespace-nowrap rounded-md px-3 py-2.5 text-base transition 2xl:px-4 ${
                  isActive(n.href) ? "font-bold text-white" : "font-medium text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {n.label}
                {isActive(n.href) && <span className="absolute inset-x-3 -bottom-[18px] h-[3px] 2xl:inset-x-4 rounded-full bg-gold-400" />}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-white/10"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-sm font-bold text-navy-950">{initials}</span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-sm font-semibold">{user.name}</span>
                  <span className="block text-xs capitalize text-slate-400">{user.role}</span>
                </span>
                <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-slate-700 shadow-xl">
                  {menu.map((m) => (
                    <Link key={m.href} href={m.href} role="menuitem" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50">
                      <m.icon className="h-4 w-4 text-royal-600" /> {m.label}
                    </Link>
                  ))}
                  <form action="/api/auth/logout" method="post" className="border-t border-slate-100">
                    <button role="menuitem" className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </form>
                </div>
              )}
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10 xl:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-white/10 px-4 pb-4 pt-2 xl:hidden">
            <div className="grid gap-1 sm:grid-cols-2">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium ${isActive(n.href) ? "bg-gold-500 text-navy-950" : "text-slate-200 hover:bg-white/10"}`}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
