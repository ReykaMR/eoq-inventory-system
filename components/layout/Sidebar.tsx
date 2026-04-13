"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  BarChart3,
  TrendingUp,
  Warehouse,
  Calculator,
  ChevronRight,
  Bell,
  User,
  X,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    roles: ["admin", "manager", "staff_pembelian", "staff_gudang"],
  },
  {
    title: "Produk",
    href: "/products",
    icon: Package,
    roles: ["admin", "manager", "staff_pembelian"],
  },
  {
    title: "Kategori",
    href: "/categories",
    icon: Settings,
    roles: ["admin"],
  },
  {
    title: "Satuan",
    href: "/units",
    icon: Settings,
    roles: ["admin"],
  },
  {
    title: "Supplier",
    href: "/suppliers",
    icon: Users,
    roles: ["admin", "manager", "staff_pembelian"],
  },
  {
    title: "EOQ Parameters",
    href: "/eoq",
    icon: Calculator,
    roles: ["admin", "manager"],
  },
  {
    title: "Purchase Orders",
    href: "/purchase-orders",
    icon: ShoppingCart,
    roles: ["manager", "staff_pembelian"],
  },
  {
    title: "Stock Management",
    href: "/stock",
    icon: Warehouse,
    roles: ["admin", "manager", "staff_gudang"],
  },
  {
    title: "Riwayat Stok",
    href: "/stock-transactions",
    icon: FileText,
    roles: ["admin", "manager", "staff_gudang"],
  },
  {
    title: "Demand History",
    href: "/demand-history",
    icon: TrendingUp,
    roles: ["admin", "manager", "staff_pembelian"],
  },
  {
    title: "Hasil EOQ",
    href: "/eoq-calculations",
    icon: Calculator,
    roles: ["admin", "manager"],
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Notifikasi",
    href: "/notifications",
    icon: Bell,
    roles: ["admin", "manager", "staff_pembelian", "staff_gudang"],
  },
  {
    title: "Profil",
    href: "/profile",
    icon: User,
    roles: ["admin", "manager", "staff_pembelian", "staff_gudang"],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(session?.user?.role || ""),
  );

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-linear-to-b from-sidebar to-sidebar/95 border-r border-sidebar-border shadow-xl lg:shadow-none transition-all duration-500 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-500" />
                  <div className="relative bg-linear-to-br from-primary to-primary/80 p-2.5 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110">
                    <Package className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    EOQ System
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Inventory Management
                  </p>
                </div>
              </div>
              {/* Mobile Close Button */}
              <button
                onClick={onToggle}
                className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {filteredMenu.map((item, index) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-linear-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-md",
                  )}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-all duration-300",
                      isActive
                        ? "scale-110"
                        : "group-hover:scale-110 group-hover:text-primary",
                    )}
                  />
                  <span className="flex-1">{item.title}</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-all duration-300",
                      isActive
                        ? "translate-x-1 opacity-100"
                        : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          {/* User info & Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="mb-3 p-3 rounded-xl bg-linear-to-r from-accent to-accent/50">
              <p className="text-sm font-semibold text-foreground">
                {session?.user?.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                {session?.user?.role?.replace("_", " ")}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-xl text-destructive bg-destructive/5 hover:bg-destructive/10 transition-all duration-300 hover:shadow-md active:scale-95"
            >
              <LogOut className="h-4 w-4 transition-transform duration-300 hover:-translate-x-1" />
              Keluar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
