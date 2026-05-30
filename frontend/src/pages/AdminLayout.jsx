import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { UtensilsCrossed, ScrollText, QrCode, LogOut } from "lucide-react";

const navItems = [
  { to: "/admin", label: "Reservations", icon: ScrollText, end: true, testId: "nav-reservations" },
  { to: "/admin/menu", label: "Menu", icon: UtensilsCrossed, testId: "nav-menu" },
  { to: "/admin/tables", label: "Tables · QR", icon: QrCode, testId: "nav-tables" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const onLogout = () => { logout(); nav("/admin/login"); };

  return (
    <div className="min-h-screen flex bg-[#F9F8F6]" data-testid="admin-shell">
      <aside className="w-64 bg-[#2E2520] text-white flex flex-col">
        <div className="px-6 py-8 border-b border-white/10">
          <div className="font-display-jp text-2xl">月 Tsuki</div>
          <div className="label-eyebrow text-white/50 mt-1">Operations</div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end, testId }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
          <div className="text-xs text-white/50 mb-3">{user?.email}</div>
          <button
            onClick={onLogout}
            data-testid="admin-logout-button"
            className="flex items-center gap-2 text-xs text-white/70 hover:text-white"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
