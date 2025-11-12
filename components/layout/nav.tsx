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
  Coins,
  LogOut,
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
    title: 'Transactions',
    href: '/transactions',
    icon: ArrowLeftRight,
  },
  {
    title: 'Loans',
    href: '/loans',
    icon: FileText,
  },
  {
    title: 'Investors',
    href: '/investors',
    icon: Users,
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur-lg">
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
                <Button
                  variant="default"
                  size="sm"
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Login
                </Button>
              </Link>
            )}
            {user && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 hover:bg-accent rounded-md transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {user && isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      {user && (
        <aside
          className={cn(
            'lg:hidden fixed top-16 left-0 right-0 bottom-0 z-40 border-t-2 bg-background/98 backdrop-blur-xl transition-all duration-300 flex flex-col',
            isMobileMenuOpen
              ? 'translate-x-0 opacity-100'
              : 'translate-x-full opacity-0'
          )}
        >
          <nav className="flex-1 space-y-2 p-3 overflow-y-auto">
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
                        'flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300',
                        'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground hover:shadow-sm'
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
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
                                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300',
                                isActive
                                  ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md'
                                  : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
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
                    'group flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 relative',
                    isActive
                      ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground hover:shadow-sm'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300',
                      isActive
                        ? 'bg-primary-foreground/20'
                        : 'bg-muted/50 group-hover:bg-primary/10'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                  </div>
                  <span className="font-medium">{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile User Section - Fixed at Bottom */}
          {user && (
            <div className="border-t-2 bg-gradient-to-r from-muted/40 to-muted/20 mt-auto">
              {/* User Info */}
              <div className="flex items-center space-x-3 px-4 py-1.5 border-b">
                <Avatar className="h-11 w-11 ring-2 ring-primary/30 shadow-md">
                  <AvatarImage
                    src={user.image || undefined}
                    alt={user.name || 'User'}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-chart-2 text-primary-foreground font-semibold text-base">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold truncate">
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => signOut()}
                className="flex w-full items-center justify-center space-x-2 px-4 py-4 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-300 active:bg-destructive/20"
              >
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
            'hidden lg:block fixed left-0 top-0 z-40 h-screen border-r-2 bg-background/95 backdrop-blur-lg transition-all duration-300 shadow-lg',
            isCollapsed ? 'w-20' : 'w-72'
          )}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-4 border-b-2 bg-gradient-to-r from-muted/40 to-muted/20">
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
                  <Coins className="h-6 w-6 text-primary" />
                </div>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                  'flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 hover:bg-accent/50 text-muted-foreground hover:text-accent-foreground transition-all duration-300 hover:shadow-md',
                  isCollapsed &&
                    'absolute -right-3 top-4 bg-background border-2 shadow-lg'
                )}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Navigation Items */}
            <nav
              className={cn(
                'flex-1 space-y-1 overflow-y-auto',
                isCollapsed ? 'p-2' : 'p-4'
              )}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isExpanded = expandedMenus.has(item.title);

                if (hasSubItems) {
                  return (
                    <div key={item.title} className="mb-1">
                      <button
                        onClick={() => toggleMenu(item.title)}
                        className={cn(
                          'flex items-center w-full rounded-xl py-1.5 text-sm font-medium transition-all duration-300 text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground hover:shadow-sm',
                          isCollapsed
                            ? 'justify-center px-2'
                            : 'justify-between px-4'
                        )}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <div
                          className={cn(
                            'flex items-center',
                            !isCollapsed && 'space-x-3'
                          )}
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50">
                            <Icon className="h-5 w-5 flex-shrink-0" />
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
                        <div className="ml-12 mt-1 space-y-1">
                          {item.subItems!.map((subItem) => {
                            const isActive =
                              pathname === subItem.href ||
                              pathname.startsWith(subItem.href + '/');
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={cn(
                                  'flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300',
                                  isActive
                                    ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md'
                                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
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
                      'group flex items-center rounded-xl py-1.5 text-sm font-medium transition-all duration-300 relative mb-1',
                      isActive
                        ? 'bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-lg'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground hover:shadow-sm',
                      isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300',
                        isActive
                          ? 'bg-primary-foreground/20 shadow-sm'
                          : 'bg-muted/50 group-hover:bg-primary/10'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
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
              <div className="border-t-2 p-4 bg-gradient-to-r from-muted/40 to-muted/20">
                <DropdownMenuRadix>
                  <DropdownMenuTrigger
                    className={cn(
                      'flex w-full items-center rounded-xl py-1.5 text-sm font-medium transition-all duration-300 hover:bg-accent/50 hover:shadow-md',
                      isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'
                    )}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-primary/30 shadow-sm">
                      <AvatarImage
                        src={user.image || undefined}
                        alt={user.name || 'User'}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-chart-2 text-primary-foreground font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                      <>
                        <div className="flex-1 text-left overflow-hidden">
                          <p className="text-sm font-bold truncate">
                            {user.name || 'User'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </>
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
      ) : (
        /* Desktop Header for Unauthenticated Users */
        <header className="hidden lg:block fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/80 backdrop-blur-lg">
          <div className="flex h-full items-center justify-between px-6 mx-auto max-w-7xl">
            <Link href="/" className="group transition-all duration-300">
              <Logo
                size="md"
                showIcon={true}
                gradient={true}
                animated={true}
                className="group-hover:from-chart-2 group-hover:to-primary"
              />
            </Link>
            <Link href="/auth/signin">
              <Button
                variant="default"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-xl transition-all duration-300"
              >
                Login
              </Button>
            </Link>
          </div>
        </header>
      )}

      {/* Main content area that responds to sidebar state */}
      <div
        className={cn(
          'transition-all duration-300',
          'pt-16', // Add top padding on mobile for fixed header
          user && !isCollapsed
            ? 'lg:pt-0 lg:ml-72'
            : user && isCollapsed
            ? 'lg:pt-0 lg:ml-20'
            : 'lg:pt-16 lg:ml-0' // Apply appropriate padding and margin based on auth state
        )}
      >
        {children}
      </div>
    </>
  );
}
