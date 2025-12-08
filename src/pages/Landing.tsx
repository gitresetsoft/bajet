import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calculator, PieChart, Users, Shield, TrendingUp, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "@/hooks/use-appstore";
import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const userDetails = useAppStore((state) => state.userDetails);
  const setUserDetails = useAppStore((state) => state.setUserDetails);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Single redirect handler for /login in all places
  const handleLoginOrDashboard = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (userDetails) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    },
    [userDetails, navigate]
  );

  // Logout handler to fix state mismatch between logout and app store
  const handleLogout = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) e.preventDefault();
      await logout();
      setUserDetails(null);
      navigate("/login");
    },
    [logout, setUserDetails, navigate]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 md:py-6 py-3">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/icon.png" alt="Budget Icon" className="h-8 w-8" />
            <span className="font-bold text-xl md:text-2xl text-foreground">Bajet</span>
          </div>
          <div className="md:space-x-4 space-x-2">
            {userDetails ? (
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-xs md:text-base px-3 py-2 md:px-6 md:py-2 h-auto min-h-0"
              >
                Logout
              </Button>
            ) : (
              <Button
                onClick={handleLoginOrDashboard}
                className="text-xs md:text-base px-3 py-2 md:px-6 md:py-2 h-auto min-h-0"
              >
                Let's start!
              </Button>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 md:py-20 py-20 text-center">
        <h1 className="font-bold text-4xl md:text-6xl text-foreground mb-4 md:mb-6 leading-tight">
          Take Control of Your
          <span className="text-primary"> Finances</span>
        </h1>
        <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-12 max-w-2xl mx-auto leading-relaxed">
          Track expenses, manage budgets, and achieve your financial goals with our intuitive
          and powerful budget tracking platform designed for individuals and couples.
        </p>
        <div className="space-x-2 md:space-x-4">
          <Button
            size="sm"
            className="text-xs md:text-lg px-4 py-2 md:px-8 md:py-6"
            onClick={handleLoginOrDashboard}
          >
            Start Tracking Now
            <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 md:py-20 py-20">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="font-bold text-3xl md:text-4xl text-foreground mb-2 md:mb-4">
            Everything You Need to Manage Your Money
          </h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools designed to make budgeting simple and effective
          </p>
        </div>

        {/* Mobile: Feature cards grid hidden by default since it's commented out */}
        {/* <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <PieChart className="h-7 w-7 md:h-12 md:w-12 text-primary mb-2 md:mb-4" />
              <CardTitle className="text-xs md:text-base">Smart Budget Tracking</CardTitle>
              <CardDescription className="text-xs md:text-base">
                Create monthly budgets with customizable categories and real-time tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-7 w-7 md:h-12 md:w-12 text-primary mb-2 md:mb-4" />
              <CardTitle className="text-xs md:text-base">Multi-Person Support</CardTitle>
              <CardDescription className="text-xs md:text-base">
                Perfect for couples and households with separate contribution tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <TrendingUp className="h-7 w-7 md:h-12 md:w-12 text-primary mb-2 md:mb-4" />
              <CardTitle className="text-xs md:text-base">Financial Insights</CardTitle>
              <CardDescription className="text-xs md:text-base">
                Get detailed reports and visualizations of your spending patterns
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-7 w-7 md:h-12 md:w-12 text-primary mb-2 md:mb-4" />
              <CardTitle className="text-xs md:text-base">Secure & Private</CardTitle>
              <CardDescription className="text-xs md:text-base">
                Your financial data is encrypted and stored securely with privacy in mind
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <CheckCircle className="h-7 w-7 md:h-12 md:w-12 text-primary mb-2 md:mb-4" />
              <CardTitle className="text-xs md:text-base">Goal Achievement</CardTitle>
              <CardDescription className="text-xs md:text-base">
                Set financial goals and track your progress with intelligent recommendations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <img src="/icon.png" alt="Budget Icon" className="h-5 w-5 md:h-8 md:w-8" />
              <CardTitle className="text-xs md:text-base">Easy Expense Entry</CardTitle>
              <CardDescription className="text-xs md:text-base">
                Quick and intuitive expense logging with categorization and receipt tracking
              </CardDescription>
            </CardHeader>
          </Card>
        </div> */}
      </section>

      {/* CTA Section */}
      {/* <section className="bg-primary py-20 md:py-20 py-8">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-bold text-base md:text-4xl text-primary-foreground mb-3 md:mb-6">
            Ready to Transform Your Financial Life?
          </h2>
          <p className="text-xs md:text-xl text-primary-foreground/80 mb-4 md:mb-8 max-w-2xl mx-auto">
            Join thousands of users who have taken control of their finances with BudgetTracker
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="text-xs md:text-lg px-4 py-2 md:px-8 md:py-6"
            asChild
          >
            <Link to="/login">
              Get Started for Free
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </Link>
          </Button>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="bg-muted py-6 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2 md:mb-4">
            <img src="/icon.png" alt="Budget Icon" className="h-6 w-6 md:h-8 md:w-8" />
            <span className="font-bold text-base md:text-xl text-foreground">BudgetTracker</span>
          </div>
          <p className="text-xs md:text-base text-muted-foreground">
            © 2024 BudgetTracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}