import { redirect } from 'next/navigation';
import { getCachedAuth } from '@/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FileText,
  Users,
  TrendingUp,
  Shield,
  BarChart3,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Wallet,
  DollarSign,
  Activity,
} from 'lucide-react';

export default async function HomePage() {
  const session = await getCachedAuth();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute top-1/2 -left-40 h-[400px] w-[400px] rounded-full bg-chart-5/8 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-chart-2/6 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:py-40 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary animate-fade-in">
              <Sparkles className="h-4 w-4" />
              Professional Pawn Business Management
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl text-foreground animate-fade-in-up">
              Manage Your Pawn Business with{' '}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-chart-5 bg-clip-text text-transparent">
                Confidence
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-8 text-xl leading-8 text-muted-foreground animate-fade-in-up animation-delay-200">
              Track loans, manage investors, and monitor transactions all in one
              place. Streamline your pawn business operations with our powerful
              management platform.
            </p>

            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
              <Link href="/auth/signin">
                <Button
                  size="lg"
                  className="group text-base px-8 py-6 rounded-2xl"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-1 gap-5 sm:grid-cols-3 animate-fade-in-up animation-delay-600">
              <Card className="surface-card-interactive border-border/40 text-center">
                <CardContent className="flex flex-col items-center p-8">
                  <div className="icon-well-lg mb-4 bg-primary/12 text-primary">
                    <FileText className="h-7 w-7" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight">Unlimited</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Loan Tracking
                  </div>
                </CardContent>
              </Card>
              <Card className="surface-card-interactive border-border/40 text-center">
                <CardContent className="flex flex-col items-center p-8">
                  <div className="icon-well-lg mb-4 bg-chart-2/12 text-chart-2">
                    <Users className="h-7 w-7" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight">Complete</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Investor Management
                  </div>
                </CardContent>
              </Card>
              <Card className="surface-card-interactive border-border/40 text-center">
                <CardContent className="flex flex-col items-center p-8">
                  <div className="icon-well-lg mb-4 bg-chart-5/12 text-chart-5">
                    <Activity className="h-7 w-7" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight">Real-time</div>
                  <div className="mt-1 text-sm text-muted-foreground">Analytics</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow">Powerful Features</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Everything you need to manage your pawn business
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Designed specifically for pawn business operations with intuitive
              tools and comprehensive tracking capabilities.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-7xl">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <Card className="group surface-card-interactive border-border/40 p-1">
                <CardHeader className="pb-2">
                  <div className="icon-well-lg mb-5 bg-primary/12 text-primary transition-transform duration-300 group-hover:scale-105">
                    <FileText className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl">Loan Management</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Track loan details, due dates, and statuses with ease.
                    Manage multiple loan types including Lot Title, OR/CR, and
                    Agent loans.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="surface-muted inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Multi-type loan support
                  </div>
                </CardContent>
              </Card>

              <Card className="group surface-card-interactive border-border/40 p-1">
                <CardHeader className="pb-2">
                  <div className="icon-well-lg mb-5 bg-chart-2/12 text-chart-2 transition-transform duration-300 group-hover:scale-105">
                    <Users className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl">Investor Tracking</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Keep detailed records of all investors, their investments,
                    and expected returns. Monitor active and total investors.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="surface-muted inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-chart-2" />
                    Comprehensive investor profiles
                  </div>
                </CardContent>
              </Card>

              <Card className="group surface-card-interactive border-border/40 p-1">
                <CardHeader className="pb-2">
                  <div className="icon-well-lg mb-5 bg-chart-3/12 text-chart-3 transition-transform duration-300 group-hover:scale-105">
                    <TrendingUp className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl">Transaction History</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Complete transaction log for all loans and investments.
                    Track disbursements and collections effortlessly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="surface-muted inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-chart-3" />
                    Full transaction audit trail
                  </div>
                </CardContent>
              </Card>

              <Card className="group surface-card-interactive border-border/40 p-1">
                <CardHeader className="pb-2">
                  <div className="icon-well-lg mb-5 bg-chart-4/12 text-chart-4 transition-transform duration-300 group-hover:scale-105">
                    <BarChart3 className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl">Analytics & Reports</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Visual charts and graphs to understand your business
                    performance. Track weekly trends and distributions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="surface-muted inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-chart-4" />
                    Interactive data visualizations
                  </div>
                </CardContent>
              </Card>

              <Card className="group surface-card-interactive border-border/40 p-1">
                <CardHeader className="pb-2">
                  <div className="icon-well-lg mb-5 bg-chart-5/12 text-chart-5 transition-transform duration-300 group-hover:scale-105">
                    <Clock className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl">Due Date Alerts</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Never miss a payment with automated alerts for overdue loans
                    and upcoming maturities.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="surface-muted inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-chart-5" />
                    Automated reminders
                  </div>
                </CardContent>
              </Card>

              <Card className="group surface-card-interactive border-border/40 p-1">
                <CardHeader className="pb-2">
                  <div className="icon-well-lg mb-5 bg-primary/12 text-primary transition-transform duration-300 group-hover:scale-105">
                    <Shield className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl">Secure & Reliable</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Your data is encrypted and stored securely. Built with
                    enterprise-grade security standards.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="surface-muted inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Bank-level encryption
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-center">
            <div className="lg:pr-8">
              <div className="lg:max-w-lg">
                <h2 className="text-base font-semibold leading-7 text-primary">
                  Work Smarter
                </h2>
                <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Built for pawn business professionals
                </p>
                <p className="mt-6 text-lg leading-8 text-muted-foreground">
                  Our platform is designed with your needs in mind, providing
                  powerful tools that make managing your pawn business
                  effortless.
                </p>
                <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 lg:max-w-none">
                  <div className="relative pl-9">
                    <dt className="inline font-semibold">
                      <DollarSign className="absolute left-1 top-1 h-5 w-5 text-primary" />
                      Track every peso.
                    </dt>
                    <dd className="inline text-muted-foreground">
                      {' '}
                      Monitor all financial transactions with detailed records
                      and comprehensive reporting.
                    </dd>
                  </div>
                  <div className="relative pl-9">
                    <dt className="inline font-semibold">
                      <Wallet className="absolute left-1 top-1 h-5 w-5 text-primary" />
                      Manage investors seamlessly.
                    </dt>
                    <dd className="inline text-muted-foreground">
                      {' '}
                      Keep track of investor contributions, returns, and
                      maintain transparent relationships.
                    </dd>
                  </div>
                  <div className="relative pl-9">
                    <dt className="inline font-semibold">
                      <Activity className="absolute left-1 top-1 h-5 w-5 text-primary" />
                      Real-time insights.
                    </dt>
                    <dd className="inline text-muted-foreground">
                      {' '}
                      Get instant visibility into your business performance with
                      live dashboards and analytics.
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl bg-gradient-to-br from-primary/8 via-chart-2/6 to-chart-5/8 p-8 ring-1 ring-border">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Active Loans</div>
                      <div className="text-2xl font-bold">234</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-2/10">
                      <Users className="h-6 w-6 text-chart-2" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Active Investors
                      </div>
                      <div className="text-2xl font-bold">47</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-5/10">
                      <DollarSign className="h-6 w-6 text-chart-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Total Value</div>
                      <div className="text-2xl font-bold">&#8369;12.5M</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-3xl bg-primary px-6 py-24 shadow-xl sm:px-24 lg:px-32">
            <div className="absolute -top-24 right-0 -z-10 transform-gpu blur-3xl">
              <div className="aspect-[1404/767] w-[87.75rem] bg-gradient-to-r from-primary-foreground/20 to-primary-foreground/10 opacity-25" />
            </div>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
                Ready to streamline your pawn business?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/80">
                Join professionals who trust our platform to manage their pawn
                business operations efficiently and securely.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href="/auth/signin">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="group text-base px-8 py-6 rounded-2xl shadow-lg"
                  >
                    Sign In to Get Started
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <Logo size="xl" showIcon={true} gradient={true} />
            </div>
            <p className="text-sm text-muted-foreground">
              Professional pawn business management platform
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} PawnTracker. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
