"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, FileText, Users, PlusCircle } from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Loans",
    href: "/loans",
    icon: FileText,
  },
  {
    title: "Add Loan",
    href: "/loans/new",
    icon: PlusCircle,
  },
  {
    title: "Investors",
    href: "/investors",
    icon: Users,
  },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          <Link href="/" className="mr-8 flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span className="text-xl font-bold">Pawn Tracker</span>
          </Link>
          <div className="flex space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

