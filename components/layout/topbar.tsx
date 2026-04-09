"use client";

import { useSession } from "next-auth/react";
import { Menu, Bell, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface TopbarProps {
  onMenuToggle: () => void;
  title?: string;
}

export function Topbar({ onMenuToggle, title }: TopbarProps) {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b bg-card/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8 shadow-sm">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden hover:bg-accent transition-all duration-300 hover:scale-105 active:scale-95"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Page Title */}
        {title && (
          <h2 className="text-lg sm:text-xl font-semibold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent hidden sm:block">
            {title}
          </h2>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Link href="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-accent transition-all duration-300 hover:scale-105 active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Button>
        </Link>

        {/* User Menu */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 hover:bg-accent transition-all duration-300 hover:scale-105 active:scale-95 py-5"
            >
              <div className="relative">
                <div className="bg-linear-to-br from-primary to-primary/80 p-1.5 rounded-full shadow-md">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                  {session?.user?.role?.replace("_", " ")}
                </p>
              </div>
              <ChevronDown className="hidden sm:block h-4 w-4 text-muted-foreground transition-transform duration-300" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/profile"
                className="cursor-pointer gap-2 flex items-center"
              >
                <User className="h-4 w-4" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/notifications"
                className="cursor-pointer gap-2 flex items-center"
              >
                <Bell className="h-4 w-4" />
                Notifikasi
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
