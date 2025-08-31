import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Sparkles, 
  Zap, 
  BarChart3, 
  Calendar,
  CheckCircle,
  ArrowRight,
  Users,
  Globe,
  Clock,
  Shield
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">MyAiMediaMgr</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/pricing">
                <Button variant="ghost">Pricing</Button>
              </Link>
              <Button asChild>
                <a href="/api/login">Sign In with Google</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI-Powered Social Media Management for Small Businesses
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Create, schedule, and publish content across all your social media platforms with the power of Google Cloud AI. Save time, grow your audience, and focus on what matters most - your business.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/api/login" className="flex items-center gap-2">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Link href="/pricing">
              <Button size="lg" variant="outline">View Pricing</Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            50 free credits • No credit card required
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Succeed</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <Sparkles className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">AI Content Generation</h3>
              <p className="text-sm text-muted-foreground">
                Generate engaging posts, images, and videos powered by Google's Gemini AI, Imagen 4, and Veo 3.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Calendar className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Smart Scheduling</h3>
              <p className="text-sm text-muted-foreground">
                Plan and schedule posts weeks in advance with our intelligent calendar system.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Globe className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Multi-Platform Publishing</h3>
              <p className="text-sm text-muted-foreground">
                Post to Instagram, Facebook, X (Twitter), LinkedIn, and TikTok from one dashboard.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <BarChart3 className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Analytics & Insights</h3>
              <p className="text-sm text-muted-foreground">
                Track engagement, reach, and growth with detailed analytics for each platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Users className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Team Collaboration</h3>
              <p className="text-sm text-muted-foreground">
                Work together with approval workflows and team member management.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Shield className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Secure & Reliable</h3>
              <p className="text-sm text-muted-foreground">
                Enterprise-grade security with Google Cloud infrastructure and OAuth authentication.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 bg-muted/50">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Connect Your Social Media Accounts</h3>
                <p className="text-sm text-muted-foreground">
                  Securely link your Instagram, Facebook, X, LinkedIn, and TikTok accounts in seconds.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Create Content with AI</h3>
                <p className="text-sm text-muted-foreground">
                  Generate posts, images, and videos tailored to your brand using advanced AI models.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Schedule and Publish</h3>
                <p className="text-sm text-muted-foreground">
                  Plan your content calendar and let us handle the publishing at optimal times.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Track and Optimize</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor performance and get AI-powered suggestions to improve engagement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">Starter</h3>
              <div className="text-3xl font-bold mb-4">$29<span className="text-sm font-normal">/mo</span></div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  500 credits/month
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  5 social platforms
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  AI content generation
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">Professional</h3>
              <div className="text-3xl font-bold mb-4">$99<span className="text-sm font-normal">/mo</span></div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  2,000 credits/month
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Unlimited platforms
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Video generation
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">Enterprise</h3>
              <div className="text-3xl font-bold mb-4">$299<span className="text-sm font-normal">/mo</span></div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  10,000 credits/month
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Unlimited everything
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Priority support
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="text-center mt-8">
          <Link href="/pricing">
            <Button size="lg" variant="outline">See All Plans & Features</Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Social Media?</h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of small businesses already using AI to grow their online presence.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <a href="/api/login" className="flex items-center gap-2">
                Get Started Free <Zap className="h-4 w-4" />
              </a>
            </Button>
            <p className="text-sm mt-4 opacity-75">
              No credit card required • 50 free credits • Cancel anytime
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">MyAiMediaMgr</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 MyAiMediaMgr. Powered by Google Cloud AI.
            </p>
            <div className="flex gap-4 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-foreground">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}