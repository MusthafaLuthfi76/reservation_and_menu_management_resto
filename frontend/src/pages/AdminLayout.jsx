import React, { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { UtensilsCrossed, ScrollText, QrCode, LogOut, Menu, X } from "lucide-react";

const navItems = [
  { to: "/admin", label: "Reservations", icon: ScrollText, end: true, testId: "nav-reservations" },
  { to: "/admin/menu", label: "Menu", icon: UtensilsCrossed, testId: "nav-menu" },
  { to: "/admin/tables", label: "Tables · QR", icon: QrCode, testId: "nav-tables" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const onLogout = () => { logout(); nav("/admin/login"); };

  const SidebarBody = ({ onNavigate }) => (
    <>
      <div className="px-6 py-6 lg:py-8 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="font-display-jp text-2xl">月 Tsuki</div>
          <div className="label-eyebrow text-white/50 mt-1">Operations</div>
        </div>
        <button
          className="lg:hidden text-white/70"
          onClick={() => setMobileOpen(false)}
          data-testid="mobile-nav-close"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end, testId }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            data-testid={testId}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-sm text-sm transition-colors ${
                isActive ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-5 border-t border-white/10">
        <div className="text-sm">{user?.name}</div>
        <div className="text-xs text-white/50 mb-3 truncate">{user?.email}</div>
        <button
          onClick={onLogout}
          data-testid="admin-logout-button"
          className="flex items-center gap-2 text-xs text-white/70 hover:text-white"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </>
  );

  const currentTitle =
    navItems.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label || "Admin";

  return (
    <div className="min-h-screen flex bg-[#F9F8F6]" data-testid="admin-shell">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#2E2520] text-white flex-col flex-shrink-0">
        <SidebarBody />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-[#2E2520] text-white flex flex-col lg:hidden fade-up">
            <SidebarBody onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      <main className="flex-1 min-w-0 overflow-x-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden sticky top-0 z-30 bg-[#F9F8F6]/95 backdrop-blur border-b border-[#E5E0D8] flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setMobileOpen(true)}
            data-testid="mobile-nav-toggle"
            aria-label="Open menu"
            className="p-2 -ml-2 text-[#1C1C1C]"
          >
            <Menu size={20} />
          </button>
          <div className="font-display-jp text-lg">月 Tsuki</div>
          <div className="text-xs label-eyebrow">{currentTitle}</div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
