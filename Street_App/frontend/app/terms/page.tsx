import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - RemberTheKingdom",
  description: "Terms of Service and legal information for RemberTheKingdom",
};

export default function TermsOfService() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      
      <div className="space-y-8 text-neutral-800">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="leading-relaxed">
            By accessing and using RemberTheKingdom ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p className="leading-relaxed">
            RemberTheKingdom is a family tree and genealogy platform that allows users to create, maintain, and share their family history. The Service includes features for building family trees, storing family records, and connecting with relatives.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <p className="leading-relaxed">
            To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Privacy and Data Protection</h2>
          <p className="leading-relaxed">
            Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information. By using the Service, you agree to our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. User Content</h2>
          <p className="leading-relaxed">
            You retain all rights to any content you submit, post, or display on the Service. By submitting content, you grant RemberTheKingdom a worldwide, non-exclusive license to use, copy, modify, and distribute your content.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Prohibited Activities</h2>
          <p className="leading-relaxed">
            Users agree not to:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>Violate any applicable laws or regulations</li>
            <li>Impersonate other users or provide false information</li>
            <li>Upload malicious code or attempt to harm the Service</li>
            <li>Collect user information without consent</li>
            <li>Use the Service for unauthorized commercial purposes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
          <p className="leading-relaxed">
            We reserve the right to terminate or suspend your account and access to the Service at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Changes to Terms</h2>
          <p className="leading-relaxed">
            We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the Service. Continued use of the Service after such modifications constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Contact Information</h2>
          <p className="leading-relaxed">
            If you have any questions about these Terms of Service, please contact us at support@rememberthekingdom.com
          </p>
        </section>

        <div className="text-sm text-neutral-600 pt-8">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </main>
  );
} 