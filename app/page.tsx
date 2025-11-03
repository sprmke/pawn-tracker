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
} from 'lucide-react';

export default async function HomePage() {
  const session = await auth();

  // If user is authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Manage Your Pawn Business with Confidence
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Track loans, manage investors, and monitor transactions all in one
              place. Streamline your pawn business operations with our powerful
              management platform.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/auth/signin">
                <Button size="lg">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to manage your pawn business
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Powerful features designed specifically for pawn business
              operations
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-7xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <FileText className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Loan Management</CardTitle>
                  <CardDescription>
                    Track loan details, due dates, and statuses with ease.
                    Manage multiple loan types including Lot Title, OR/CR, and
                    Agent loans.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Investor Tracking</CardTitle>
                  <CardDescription>
                    Keep detailed records of all investors, their investments,
                    and expected returns. Monitor active and total investors.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    Complete transaction log for all loans and investments.
                    Track disbursements and collections effortlessly.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Analytics & Reports</CardTitle>
                  <CardDescription>
                    Visual charts and graphs to understand your business
                    performance. Track weekly trends and distributions.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Due Date Alerts</CardTitle>
                  <CardDescription>
                    Never miss a payment with automated alerts for overdue loans
                    and upcoming maturities.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Secure & Reliable</CardTitle>
                  <CardDescription>
                    Your data is encrypted and stored securely. Built with
                    enterprise-grade security standards.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to streamline your pawn business?
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Start managing your loans, investors, and transactions today.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/auth/signin">
                <Button size="lg">Sign In to Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Pawn Tracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
