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
  ArrowLeftRight,
  Landmark,
  LogOut,
  Settings,
  HandCoins,
} from 'lucide-react';
import { useState, ReactNode, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import {
  DropdownMenuRadix,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu-radix';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common';
import { SHOW_TRANSACTIONS_UI } from '@/lib/feature-flags';

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

interface UserInfo {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Loans',
    href: '/loans',
    icon: FileText,
  },
  ...(SHOW_TRANSACTIONS_UI
    ? [
        {
          title: 'Transactions',
          href: '/transactions',
          icon: ArrowLeftRight,
        } as NavItem,
      ]
    : []),
  {
    title: 'Borrowings',
    href: '/debts',
    icon: HandCoins,
  },
  {
    title: 'Investors',
    href: '/investors',
    icon: Users,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Nav({
  children,
  user,
}: {
  children: ReactNode;
  user?: UserInfo | null;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U';

  useEffect(() => {
    const newExpanded = new Set<string>();
    navItems.forEach((item) => {
      if (item.subItems) {
        const isActiveSubItem = item.subItems.some(
          (subItem) =>
            pathname === subItem.href ||
            pathname.startsWith(subItem.href + '/'),
        );
        if (isActiveSubItem) {
          newExpanded.add(item.title);
        }
      }
    });
    setExpandedMenus(newExpanded);
  }, [pathname]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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

  const isLandingPage = !user && pathname === '/';

  return (
    <>
      {/* Mobile Header */}
      {!isLandingPage && (
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b bg-card/95 backdrop-blur-xl">
        <div className="flex h-full items-center justify-between px-4">
          <Link
            href={user ? '/dashboard' : '/'}
            className="flex items-center space-x-2 group"
          >
            <Logo size="md" showIcon={true} gradient={true} animated={true} />
          </Link>
          <div className="flex items-center gap-2">
            {!user && (
              <Link href="/auth/signin">
                <Button variant="default" size="sm">
                  Login
                </Button>
              </Link>
            )}
            {user && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 hover:bg-accent rounded-xl transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>
      )}

      {/* Mobile Menu Overlay */}
      {user && isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      {user && (
        <aside
          className={cn(
            'lg:hidden fixed top-14 left-0 right-0 bottom-0 z-40 border-t bg-card/98 backdrop-blur-xl transition-all duration-300 flex flex-col',
            isMobileMenuOpen
              ? 'translate-x-0 opacity-100'
              : 'translate-x-full opacity-0',
          )}
        >
          <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
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
                        'flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        'text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Icon className="h-4 w-4 flex-shrink-0" />
                        </div>
                        <span>{item.title}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="ml-11 mt-1 space-y-1">
                        {item.subItems!.map((subItem) => {
                          const isActive =
                            pathname === subItem.href ||
                            pathname.startsWith(subItem.href + '/');
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={cn(
                                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                                isActive
                                  ? 'nav-item-active shadow-sm'
                                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
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
                    'group flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
                    isActive
                      ? 'nav-item-active shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
                      isActive
                        ? 'nav-item-active-icon'
                        : 'bg-muted group-hover:bg-primary/10',
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                  </div>
                  <span className="font-medium">{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile User Section */}
          {user && (
            <div className="border-t bg-muted/30 mt-auto">
              <div className="flex items-center space-x-3 px-4 py-3 border-b">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarImage
                    src={user.image || undefined}
                    alt={user.name || 'User'}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold truncate">
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => signOut()}
                className="flex w-full items-center justify-center space-x-2 px-4 py-3.5 text-sm font-medium text-destructive hover:bg-destructive/5 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-semibold">Sign Out</span>
              </button>
            </div>
          )}
        </aside>
      )}

      {/* Desktop Sidebar */}
      {user ? (
        <aside
          className={cn(
            'hidden lg:block fixed left-4 top-4 z-40 h-[calc(100vh-2rem)] transition-all duration-300',
            'rounded-[1.75rem] border border-border/50 bg-card/95 backdrop-blur-xl shadow-[var(--shadow-elevated-lg)]',
            isCollapsed ? 'w-[5.5rem]' : 'w-[17rem]',
          )}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
              {!isCollapsed && (
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 group"
                >
                  <Logo
                    size="md"
                    showIcon={true}
                    gradient={true}
                    animated={true}
                  />
                </Link>
              )}
              {isCollapsed && (
                <div className="flex w-full justify-center">
                  <span className="inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-primary shadow-[var(--shadow-soft)]">
                    <Landmark className="h-4 w-4 text-primary-foreground" />
                  </span>
                </div>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                  'flex items-center justify-center h-8 w-8 rounded-xl bg-muted/80 hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200',
                  isCollapsed &&
                    'absolute -right-3.5 top-5 bg-card border border-border/50 shadow-[var(--shadow-elevated)]',
                )}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronLeft className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Navigation Items */}
            <nav
              className={cn(
                'flex-1 space-y-1.5 overflow-y-auto',
                isCollapsed ? 'p-2.5' : 'p-4',
              )}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isExpanded = expandedMenus.has(item.title);

                if (hasSubItems) {
                  return (
                    <div key={item.title} className="mb-0.5">
                      <button
                        onClick={() => toggleMenu(item.title)}
                        className={cn(
                          'flex items-center w-full rounded-xl py-2 text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-foreground',
                          isCollapsed
                            ? 'justify-center px-2'
                            : 'justify-between px-3',
                        )}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <div
                          className={cn(
                            'flex items-center',
                            !isCollapsed && 'space-x-3',
                          )}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                            <Icon className="h-4 w-4 flex-shrink-0" />
                          </div>
                          {!isCollapsed && (
                            <span className="font-medium">{item.title}</span>
                          )}
                        </div>
                        {!isCollapsed &&
                          (isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </button>
                      {isExpanded && !isCollapsed && (
                        <div className="ml-11 mt-1 space-y-0.5">
                          {item.subItems!.map((subItem) => {
                            const isActive =
                              pathname === subItem.href ||
                              pathname.startsWith(subItem.href + '/');
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={cn(
                                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                                  isActive
                                    ? 'nav-item-active shadow-sm'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
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
                      'group flex items-center rounded-2xl py-2.5 text-sm font-semibold transition-all duration-200 relative mb-0.5',
                      isActive
                        ? 'nav-item-active'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                      isCollapsed ? 'justify-center px-2' : 'space-x-3 px-3.5',
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200',
                        isActive
                          ? 'nav-item-active-icon'
                          : 'bg-muted/80 group-hover:bg-primary/10',
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                    </div>
                    {!isCollapsed && (
                      <span className="font-medium">{item.title}</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop User Menu */}
            {user && (
              <div className="border-t border-border/50 p-4">
                <DropdownMenuRadix>
                  <DropdownMenuTrigger
                    className={cn(
                      'flex w-full items-center rounded-xl py-2 text-sm font-medium transition-all duration-200 hover:bg-accent',
                      isCollapsed ? 'justify-center px-2' : 'space-x-3 px-3',
                    )}
                  >
                    <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-primary/20">
                      <AvatarImage
                        src={user.image || undefined}
                        alt={user.name || 'User'}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                      <div className="flex-1 text-left overflow-hidden">
                        <p className="text-sm font-semibold truncate">
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-semibold">
                      My Account
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuRadix>
              </div>
            )}
          </div>
        </aside>
      ) : !isLandingPage ? (
        /* Desktop Header for Unauthenticated Users (non-landing) */
        <header className="hidden lg:block fixed top-0 left-0 right-0 z-50 h-14 border-b bg-card/80 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-6 mx-auto max-w-7xl">
            <Link href="/" className="group transition-all duration-200">
              <Logo
                size="md"
                showIcon={true}
                gradient={true}
                animated={true}
              />
            </Link>
            <Link href="/auth/signin">
              <Button variant="default">
                Login
              </Button>
            </Link>
          </div>
        </header>
      ) : null}

      {/* Main content area */}
      <div
        className={cn(
          'transition-all duration-300',
          isLandingPage ? 'pt-0' : 'pt-14',
          user && !isCollapsed
            ? 'lg:pt-0 lg:ml-[19rem]'
            : user && isCollapsed
              ? 'lg:pt-0 lg:ml-[7.5rem]'
              : isLandingPage
                ? 'lg:pt-0 lg:ml-0'
                : 'lg:pt-14 lg:ml-0',
        )}
      >
        {children}
      </div>
    </>
  );
}
