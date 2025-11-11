import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
  const session = await auth();

  // If user is authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-chart-2/10 blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:py-40 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary animate-fade-in">
              <Sparkles className="h-4 w-4" />
              Professional Pawn Business Management
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent animate-fade-in-up">
              Manage Your Pawn Business with Confidence
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
                  className="group relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3 animate-fade-in-up animation-delay-600">
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-bold">Unlimited</div>
                <div className="text-sm text-muted-foreground">Loan Tracking</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-chart-2/10">
                  <Users className="h-6 w-6 text-chart-2" />
                </div>
                <div className="text-3xl font-bold">Complete</div>
                <div className="text-sm text-muted-foreground">Investor Management</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-chart-3/10">
                  <Activity className="h-6 w-6 text-chart-3" />
                </div>
                <div className="text-3xl font-bold">Real-time</div>
                <div className="text-sm text-muted-foreground">Analytics</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">
              Powerful Features
            </h2>
            <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              Everything you need to manage your pawn business
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Designed specifically for pawn business operations with intuitive tools
              and comprehensive tracking capabilities.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-7xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature Cards with hover effects */}
              <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-chart-1" />
                <CardHeader>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <FileText className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Loan Management</CardTitle>
                  <CardDescription className="text-base">
                    Track loan details, due dates, and statuses with ease.
                    Manage multiple loan types including Lot Title, OR/CR, and
                    Agent loans.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Multi-type loan support
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-2 hover:border-chart-2/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-chart-2 to-chart-2/80" />
                <CardHeader>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-chart-2/10 group-hover:bg-chart-2/20 transition-colors">
                    <Users className="h-7 w-7 text-chart-2" />
                  </div>
                  <CardTitle className="text-xl">Investor Tracking</CardTitle>
                  <CardDescription className="text-base">
                    Keep detailed records of all investors, their investments,
                    and expected returns. Monitor active and total investors.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-chart-2" />
                    Comprehensive investor profiles
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-2 hover:border-chart-3/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-chart-3 to-chart-3/80" />
                <CardHeader>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-chart-3/10 group-hover:bg-chart-3/20 transition-colors">
                    <TrendingUp className="h-7 w-7 text-chart-3" />
                  </div>
                  <CardTitle className="text-xl">Transaction History</CardTitle>
                  <CardDescription className="text-base">
                    Complete transaction log for all loans and investments.
                    Track disbursements and collections effortlessly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-chart-3" />
                    Full transaction audit trail
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-2 hover:border-chart-4/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-chart-4 to-chart-4/80" />
                <CardHeader>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-chart-4/10 group-hover:bg-chart-4/20 transition-colors">
                    <BarChart3 className="h-7 w-7 text-chart-4" />
                  </div>
                  <CardTitle className="text-xl">Analytics & Reports</CardTitle>
                  <CardDescription className="text-base">
                    Visual charts and graphs to understand your business
                    performance. Track weekly trends and distributions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-chart-4" />
                    Interactive data visualizations
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-2 hover:border-chart-5/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-chart-5 to-chart-5/80" />
                <CardHeader>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-chart-5/10 group-hover:bg-chart-5/20 transition-colors">
                    <Clock className="h-7 w-7 text-chart-5" />
                  </div>
                  <CardTitle className="text-xl">Due Date Alerts</CardTitle>
                  <CardDescription className="text-base">
                    Never miss a payment with automated alerts for overdue loans
                    and upcoming maturities.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-chart-5" />
                    Automated reminders
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-primary/80" />
                <CardHeader>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Shield className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Secure & Reliable</CardTitle>
                  <CardDescription className="text-base">
                    Your data is encrypted and stored securely. Built with
                    enterprise-grade security standards.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                  powerful tools that make managing your pawn business effortless.
                </p>
                <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 lg:max-w-none">
                  <div className="relative pl-9">
                    <dt className="inline font-semibold">
                      <DollarSign className="absolute left-1 top-1 h-5 w-5 text-primary" />
                      Track every peso.
                    </dt>
                    <dd className="inline text-muted-foreground">
                      {' '}
                      Monitor all financial transactions with detailed records and
                      comprehensive reporting.
                    </dd>
                  </div>
                  <div className="relative pl-9">
                    <dt className="inline font-semibold">
                      <Wallet className="absolute left-1 top-1 h-5 w-5 text-primary" />
                      Manage investors seamlessly.
                    </dt>
                    <dd className="inline text-muted-foreground">
                      {' '}
                      Keep track of investor contributions, returns, and maintain
                      transparent relationships.
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
              <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-chart-2/10 to-chart-3/10 p-8 shadow-2xl ring-1 ring-border/50">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-xl bg-background/80 p-4 backdrop-blur">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Active Loans</div>
                      <div className="text-2xl font-bold">234</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-xl bg-background/80 p-4 backdrop-blur">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/10">
                      <Users className="h-6 w-6 text-chart-2" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Active Investors</div>
                      <div className="text-2xl font-bold">47</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-xl bg-background/80 p-4 backdrop-blur">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10">
                      <DollarSign className="h-6 w-6 text-chart-3" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Total Value</div>
                      <div className="text-2xl font-bold">₱12.5M</div>
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
          <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-6 py-24 shadow-2xl sm:px-24 lg:px-32">
            <div className="absolute -top-24 right-0 -z-10 transform-gpu blur-3xl">
              <div className="aspect-[1404/767] w-[87.75rem] bg-gradient-to-r from-primary-foreground/20 to-primary-foreground/10 opacity-25" />
            </div>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
                Ready to streamline your pawn business?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/90">
                Join professionals who trust our platform to manage their pawn
                business operations efficiently and securely.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href="/auth/signin">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="group text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300"
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
      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="text-center">
            <div className="mb-4">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                Pawn Tracker
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Professional pawn business management platform
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Pawn Tracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
