'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  FileText,
  Users,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState, ReactNode, useEffect } from 'react';

interface SubMenuItem {
  title: string;
  href: string;
}

interface NavItem {
  title: string;
  href?: string;
  icon: any;
  subItems?: SubMenuItem[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    title: 'Transactions',
    icon: FileText,
    subItems: [
      {
        title: 'All',
        href: '/transactions/all',
      },
      {
        title: 'General',
        href: '/transactions/general',
      },
      {
        title: 'Loans',
        href: '/transactions/loans',
      },
    ],
  },
  {
    title: 'Investors',
    href: '/investors',
    icon: Users,
  },
];

export function Nav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Auto-expand menus if current path matches a submenu item
  useEffect(() => {
    const newExpanded = new Set<string>();
    navItems.forEach((item) => {
      if (item.subItems) {
        const isActiveSubItem = item.subItems.some(
          (subItem) =>
            pathname === subItem.href || pathname.startsWith(subItem.href + '/')
        );
        if (isActiveSubItem) {
          newExpanded.add(item.title);
        }
      }
    });
    setExpandedMenus(newExpanded);
  }, [pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background">
        <div className="flex h-full items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span className="text-xl font-bold">Pawn Tracker</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <aside
        className={cn(
          'lg:hidden fixed top-16 left-0 bottom-0 z-40 w-64 border-r bg-background transition-transform duration-300 overflow-y-auto',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenus.has(item.title);

            if (hasSubItems) {
              return (
                <div key={item.title}>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={cn(
                      'flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.subItems!.map((subItem) => {
                        const isActive =
                          pathname === subItem.href ||
                          pathname.startsWith(subItem.href + '/');
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn(
                              'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                          >
                            <span>{subItem.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href! + '/'));
            return (
              <Link
                key={item.href}
                href={item.href!}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:block fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {!isCollapsed && (
              <Link href="/" className="flex items-center space-x-2">
                <FileText className="h-6 w-6" />
                <span className="text-xl font-bold">Pawn Tracker</span>
              </Link>
            )}
            {isCollapsed && (
              <Link
                href="/"
                className="flex items-center justify-center w-full"
              >
                <FileText className="h-6 w-6" />
              </Link>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenus.has(item.title);

              if (hasSubItems) {
                return (
                  <div key={item.title}>
                    <button
                      onClick={() => toggleMenu(item.title)}
                      className={cn(
                        'flex items-center w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        isCollapsed ? 'justify-center' : 'justify-between'
                      )}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </div>
                      {!isCollapsed &&
                        (isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </button>
                    {isExpanded && !isCollapsed && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.subItems!.map((subItem) => {
                          const isActive =
                            pathname === subItem.href ||
                            pathname.startsWith(subItem.href + '/');
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={cn(
                                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                              )}
                            >
                              <span>{subItem.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href! + '/'));
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    isCollapsed && 'justify-center'
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Toggle Button */}
          <div className="border-t p-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                'flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <>
                  <ChevronLeft className="h-5 w-5" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area that responds to sidebar state */}
      <div
        className={cn(
          'transition-all duration-300',
          'pt-16 lg:pt-0', // Add top padding on mobile for fixed header
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64' // Only apply left margin on desktop
        )}
      >
        {children}
      </div>
    </>
  );
}
