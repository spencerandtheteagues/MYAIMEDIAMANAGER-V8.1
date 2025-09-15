import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowLeft, ExternalLink, Cookie, Database, Users, Lock } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy - MyAiMediaMgr";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Privacy Policy for MyAiMediaMgr. Learn how we collect, use, and protect your personal data in compliance with GDPR and CCPA regulations.');
    }
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/settings">
          <Button variant="ghost" className="mb-4" data-testid="button-back-to-settings">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
        
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: September 14, 2025</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Badge variant="secondary">GDPR Compliant</Badge>
          <Badge variant="secondary">CCPA Compliant</Badge>
          <Badge variant="secondary">CPRA Compliant</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
          <CardDescription>
            Your privacy is important to us. This policy explains how MyAiMediaMgr collects, uses, and protects your personal information.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="prose prose-sm max-w-none dark:prose-invert space-y-8">
          {/* 1. Introduction */}
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              MyAiMediaMgr ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered social media management platform ("Service").
            </p>
            <p className="text-muted-foreground leading-relaxed">
              This policy applies to all users of our Service and covers both personal and business accounts. By using our Service, you consent to the data practices described in this policy.
            </p>
          </section>

          <Separator />

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              2. Information We Collect
            </h2>
            
            <h3 className="text-lg font-medium mb-2">Personal Information</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We collect personal information you provide directly to us:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
              <li>Account information: Name, email address, business name, profile information</li>
              <li>Payment information: Billing address, payment method details (processed securely by Stripe)</li>
              <li>Communication data: Support tickets, feedback, and correspondence with us</li>
              <li>Social media credentials: OAuth tokens and API keys for connected platforms</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">Content and Usage Data</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
              <li>Content you create: Social media posts, captions, images, videos, and campaigns</li>
              <li>AI interaction data: Prompts, generated content, and usage patterns</li>
              <li>Platform data: Connected social media account information and posting statistics</li>
              <li>Analytics data: Performance metrics, engagement statistics, and reporting data</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">Technical Information</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
              <li>Device information: IP address, browser type, operating system, device identifiers</li>
              <li>Usage data: Log files, session data, feature usage, and interaction patterns</li>
              <li>Cookies and tracking: Session cookies, preference cookies, and analytics cookies</li>
              <li>Performance data: Error logs, crash reports, and system performance metrics</li>
            </ul>
          </section>

          <Separator />

          {/* 3. How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            
            <h3 className="text-lg font-medium mb-2">Service Provision</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
              <li>Provide and maintain our AI-powered social media management platform</li>
              <li>Generate content using artificial intelligence based on your prompts and preferences</li>
              <li>Schedule and publish content to your connected social media platforms</li>
              <li>Provide analytics, reporting, and performance insights</li>
              <li>Process payments and manage your subscription</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">AI Training and Improvement</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We may use your content and interactions to:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
              <li>Train and improve our AI models for better content generation</li>
              <li>Develop new features and enhance existing functionality</li>
              <li>Optimize content recommendations and suggestions</li>
              <li>Improve the accuracy and relevance of AI-generated content</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Note:</strong> We use anonymized and aggregated data for AI training. Personal identifiers are removed before content is used for model training purposes.
            </p>

            <h3 className="text-lg font-medium mb-2">Communication and Support</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send transactional emails about your account and service updates</li>
              <li>Notify you about important changes to our Service or policies</li>
              <li>Send marketing communications (with your consent, where required)</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">Legal and Security</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Comply with legal obligations and respond to legal requests</li>
              <li>Protect against fraud, abuse, and security threats</li>
              <li>Enforce our Terms of Service and other policies</li>
              <li>Investigate and prevent prohibited or illegal activities</li>
            </ul>
          </section>

          <Separator />

          {/* 4. Information Sharing */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              4. How We Share Your Information
            </h2>
            
            <h3 className="text-lg font-medium mb-2">Service Providers</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We share information with trusted third-party service providers who assist us in operating our Service:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
              <li><strong>Payment Processing:</strong> Stripe for secure payment processing</li>
              <li><strong>Cloud Infrastructure:</strong> Google Cloud Platform for hosting and data storage</li>
              <li><strong>AI Services:</strong> Google Vertex AI, OpenAI for content generation capabilities</li>
              <li><strong>Analytics:</strong> Google Analytics for usage analytics and performance monitoring</li>
              <li><strong>Email Services:</strong> SendGrid for transactional and marketing emails</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">Social Media Platforms</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you connect social media accounts, we share content with those platforms according to your scheduling and publishing instructions. This includes posts, images, videos, and associated metadata required for publication.
            </p>

            <h3 className="text-lg font-medium mb-2">Legal Requirements</h3>
            <p className="text-muted-foreground leading-relaxed">
              We may disclose your information when required by law, court order, or government regulation, or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
            </p>

            <h3 className="text-lg font-medium mb-2">Business Transfers</h3>
            <p className="text-muted-foreground leading-relaxed">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity. We will notify you of any such change in ownership or control.
            </p>
          </section>

          <Separator />

          {/* 5. Data Security */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              5. Data Security and Protection
            </h2>
            
            <h3 className="text-lg font-medium mb-2">Security Measures</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
              <li>Encryption in transit and at rest using TLS 1.3 and AES-256</li>
              <li>Multi-factor authentication for administrative access</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and principle of least privilege</li>
              <li>Secure development practices and code reviews</li>
              <li>Regular backup and disaster recovery procedures</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">Data Breach Response</h3>
            <p className="text-muted-foreground leading-relaxed">
              In the unlikely event of a data breach, we will notify affected users within 72 hours and provide information about the nature of the breach, data involved, and steps being taken to address the issue.
            </p>
          </section>

          <Separator />

          {/* 6. Data Retention */}
          <section>
            <h2 className="text-xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We retain your information for as long as necessary to provide our Service and fulfill the purposes outlined in this policy:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
              <li><strong>Account Data:</strong> Retained while your account is active and for 30 days after termination</li>
              <li><strong>Content Data:</strong> Retained for the duration of your subscription plus 90 days</li>
              <li><strong>Analytics Data:</strong> Aggregated and anonymized data may be retained indefinitely</li>
              <li><strong>Payment Data:</strong> Retained for 7 years for tax and accounting purposes</li>
              <li><strong>Support Communications:</strong> Retained for 2 years for quality assurance</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              You can request deletion of your data at any time by contacting us. We will delete your data within 30 days, except where retention is required by law.
            </p>
          </section>

          <Separator />

          {/* 7. Your Rights */}
          <section>
            <h2 className="text-xl font-semibold mb-4">7. Your Privacy Rights</h2>
            
            <h3 className="text-lg font-medium mb-2">GDPR Rights (EU/UK Users)</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete information</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Restriction:</strong> Limit how we process your personal data</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for consent-based processing</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">CCPA/CPRA Rights (California Users)</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
              <li><strong>Know:</strong> Right to know what personal information is collected and how it's used</li>
              <li><strong>Delete:</strong> Right to request deletion of personal information</li>
              <li><strong>Correct:</strong> Right to correct inaccurate personal information</li>
              <li><strong>Opt-Out:</strong> Right to opt out of the sale or sharing of personal information</li>
              <li><strong>Non-Discrimination:</strong> Right not to be discriminated against for exercising privacy rights</li>
              <li><strong>Limit:</strong> Right to limit use of sensitive personal information</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">Exercising Your Rights</h3>
            <p className="text-muted-foreground leading-relaxed">
              To exercise any of these rights, contact us at privacy@myaimediamgr.com or through your account settings. We will respond to your request within 30 days (or as required by applicable law).
            </p>
          </section>

          <Separator />

          {/* 8. Cookies and Tracking */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Cookie className="w-5 h-5" />
              8. Cookies and Tracking Technologies
            </h2>
            
            <h3 className="text-lg font-medium mb-2">Types of Cookies We Use</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li><strong>Essential Cookies:</strong> Required for basic functionality, authentication, and security</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use our Service</li>
              <li><strong>Marketing Cookies:</strong> Used for targeted advertising (with your consent)</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">Managing Cookies</h3>
            <p className="text-muted-foreground leading-relaxed">
              You can control cookies through your browser settings or our cookie preference center. Note that disabling certain cookies may affect the functionality of our Service.
            </p>
          </section>

          <Separator />

          {/* 9. International Transfers */}
          <section>
            <h2 className="text-xl font-semibold mb-4">9. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be processed and stored in countries other than your own. We ensure appropriate safeguards are in place for international transfers, including:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-3 mb-4">
              <li>Standard Contractual Clauses approved by the European Commission</li>
              <li>Adequacy decisions for certain countries</li>
              <li>Certification schemes like Privacy Shield (where applicable)</li>
              <li>Binding corporate rules for transfers within corporate groups</li>
            </ul>
          </section>

          <Separator />

          {/* 10. AI and Machine Learning */}
          <section>
            <h2 className="text-xl font-semibold mb-4">10. AI and Machine Learning Disclosures</h2>
            
            <h3 className="text-lg font-medium mb-2">AI Content Generation</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our Service uses artificial intelligence to generate content based on your inputs. This process involves analyzing your prompts, preferences, and past content to create relevant social media posts, images, and videos.
            </p>

            <h3 className="text-lg font-medium mb-2">Data Used for AI Training</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We may use anonymized and aggregated data to improve our AI models:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
              <li>Content performance data to improve recommendations</li>
              <li>User interaction patterns to enhance user experience</li>
              <li>Anonymized content samples to train content generation models</li>
              <li>Aggregated usage statistics to optimize platform features</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">AI Decision Making</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our AI systems may make automated decisions about content recommendations, posting times, and audience targeting. You have the right to request human review of automated decisions that significantly affect you.
            </p>
          </section>

          <Separator />

          {/* 11. Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold mb-4">11. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16. If you believe we have collected information from a child under 16, please contact us immediately.
            </p>
          </section>

          <Separator />

          {/* 12. Changes to Privacy Policy */}
          <section>
            <h2 className="text-xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy periodically to reflect changes in our practices or applicable laws. We will notify you of material changes via email or through our Service at least 30 days before the changes take effect.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Your continued use of our Service after the effective date constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <Separator />

          {/* 13. Contact Information */}
          <section>
            <h2 className="text-xl font-semibold mb-4">13. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              For questions about this Privacy Policy or to exercise your privacy rights, contact us at:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">MyAiMediaMgr - Privacy Officer</p>
              <p className="text-muted-foreground">Email: privacy@myaimediamgr.com</p>
              <p className="text-muted-foreground">Data Protection Officer: dpo@myaimediamgr.com</p>
              <p className="text-muted-foreground">Address: [Company Address]</p>
              <p className="text-muted-foreground">Website: www.myaimediamgr.com</p>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">EU Representative</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                For EU users: [EU Representative Name and Address]
              </p>
            </div>
          </section>

          <Separator />

          {/* Footer */}
          <section className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              This Privacy Policy was last updated on September 14, 2025. By using MyAiMediaMgr, you acknowledge that you have read and understood this Privacy Policy.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/terms-of-service">
                <Button variant="outline" size="sm" data-testid="link-terms-of-service">
                  Terms of Service
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </Link>
              <Link href="/help">
                <Button variant="outline" size="sm" data-testid="link-help">
                  Contact Support
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </Link>
              <Button variant="outline" size="sm" data-testid="button-cookie-preferences">
                Cookie Preferences
              </Button>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}