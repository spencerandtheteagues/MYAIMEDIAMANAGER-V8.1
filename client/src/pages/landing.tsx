import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Zap, 
  Calendar, 
  TrendingUp, 
  Users, 
  Shield,
  CheckCircle,
  ArrowRight,
  Star
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                MyAI MediaMgr
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/trial">
                <Button variant="ghost" className="text-white hover:text-purple-400">
                  Pricing
                </Button>
              </Link>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">AI-Powered Social Media Management</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Grow Your Business
              </span>
              <br />
              <span className="text-white">With AI Content</span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Create, schedule, and publish engaging content across all social media platforms. 
              Let AI handle the heavy lifting while you focus on growing your business.
            </p>
            
            <div className="flex justify-center">
              <Link href="/trial">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-center gap-8 pt-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">7-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-gray-400">Powerful features designed for small businesses</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle className="text-white">AI Content Generation</CardTitle>
                <CardDescription className="text-gray-400">
                  Generate engaging posts, captions, and hashtags with advanced AI
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-pink-400" />
                </div>
                <CardTitle className="text-white">Smart Scheduling</CardTitle>
                <CardDescription className="text-gray-400">
                  Schedule posts at optimal times for maximum engagement
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Analytics Dashboard</CardTitle>
                <CardDescription className="text-gray-400">
                  Track performance and optimize your content strategy
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <CardTitle className="text-white">Multi-Platform Support</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage Instagram, Facebook, X, TikTok, and LinkedIn from one place
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-yellow-400" />
                </div>
                <CardTitle className="text-white">Campaign Automation</CardTitle>
                <CardDescription className="text-gray-400">
                  Create 7-day campaigns with AI-generated content
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-red-400" />
                </div>
                <CardTitle className="text-white">Approval Workflows</CardTitle>
                <CardDescription className="text-gray-400">
                  Review and approve content before it goes live
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Free Trial CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
            <CardContent className="p-12 text-center space-y-6">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2 text-sm">
                LIMITED TIME OFFER
              </Badge>
              
              <h2 className="text-4xl font-bold text-white">
                Start Your 7-Day Free Trial
              </h2>
              
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Get access to all features. No credit card required. Cancel anytime.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto py-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Lite Trial (No Card)</h3>
                  <ul className="space-y-2 text-left">
                    <li className="flex items-start gap-2 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                      <span>6 AI-generated images</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                      <span>Unlimited text posts</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                      <span>Basic scheduling</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Pro Trial (With Card)</h3>
                  <ul className="space-y-2 text-left">
                    <li className="flex items-start gap-2 text-gray-300">
                      <Star className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                      <span>Everything in Lite</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300">
                      <Star className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                      <span>3 AI-generated videos</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300">
                      <Star className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                      <span>Advanced analytics</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <Link href="/trial">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-12">
                  Choose Your Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p>© 2025 MyAI MediaMgr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}