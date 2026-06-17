import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service — Command Inbox",
  description: "Terms governing your use of Command Inbox.",
};

const LAST_UPDATED = "June 17, 2026";
const CONTACT_URL = "https://github.com/sayantanbal/commad-inbox/issues";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <section>
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of Command Inbox
          (&quot;the Service&quot;). By creating an account or using the Service, you agree to these
          Terms. If you do not agree, do not use the Service.
        </p>
      </section>

      <section>
        <h2>The Service</h2>
        <p>
          Command Inbox is a web application that connects to your Google Gmail and Calendar accounts
          to help you triage email, track commitments, schedule meetings, and run AI-assisted
          workflows. Features may change over time as we improve the product.
        </p>
      </section>

      <section>
        <h2>Eligibility</h2>
        <p>
          You must be at least 13 years old and able to form a binding contract in your
          jurisdiction. You must have a valid Google account with permission to grant the OAuth
          scopes requested by the Service.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <p>
          You are responsible for activity under your account and for keeping your session secure.
          Notify us promptly if you believe your account has been compromised.
        </p>
      </section>

      <section>
        <h2>Google connection and permissions</h2>
        <p>
          The Service requires access to Gmail and Google Calendar. You authorize us to read,
          modify, and send email and calendar data only as needed to perform actions you initiate
          or approve — including drafts, invites, labels, and agent workflows gated by your
          confirmation.
        </p>
        <p>
          You may revoke access at any time through Command Inbox or your Google account settings.
          Revoking access may limit or disable the Service.
        </p>
      </section>

      <section>
        <h2>AI features</h2>
        <p>
          The Service uses AI to classify mail, draft replies, and execute multi-step workflows.
          AI output may be inaccurate or incomplete. You are responsible for reviewing and approving
          actions before they are sent or applied to your Google account.
        </p>
        <p>
          If you provide your own AI provider API keys, you are also subject to that
          provider&apos;s terms and billing.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for unlawful, harmful, or abusive purposes</li>
          <li>Attempt to access other users&apos; data or bypass security controls</li>
          <li>Reverse engineer, scrape, or overload the Service without permission</li>
          <li>Send spam or violate anti-spam laws through the Service</li>
          <li>Resell or sublicense the Service without our written consent</li>
        </ul>
      </section>

      <section>
        <h2>Third-party services</h2>
        <p>
          The Service integrates with Google, Corsair, hosting providers, AI platforms, and other
          third parties. Your use of those services is subject to their respective terms. We are
          not responsible for third-party outages or policy changes.
        </p>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>
          We own the Service, including its software, design, and branding. You retain ownership of
          your email and calendar content. You grant us a limited license to process your content
          solely to operate the Service as described in our{" "}
          <a href="/privacy">Privacy Policy</a>.
        </p>
      </section>

      <section>
        <h2>Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
          OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR
          PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
          ERROR-FREE, OR THAT AI OUTPUT WILL BE ACCURATE.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, COMMAND INBOX AND ITS OPERATORS WILL NOT BE LIABLE
          FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
          PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR
          ANY CLAIM RELATING TO THE SERVICE IS LIMITED TO THE GREATER OF (A) THE AMOUNT YOU PAID US
          IN THE TWELVE MONTHS BEFORE THE CLAIM OR (B) USD $100.
        </p>
      </section>

      <section>
        <h2>Termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or terminate access if you
          violate these Terms or if we discontinue the Service. Provisions that by their nature
          should survive termination (including disclaimers and limitations of liability) will
          survive.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may modify these Terms. We will post the updated version on this page and update the
          &quot;Last updated&quot; date. Continued use after changes constitutes acceptance of the
          revised Terms.
        </p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>
          These Terms are governed by the laws of India, without regard to conflict-of-law
          principles. Disputes will be resolved in the courts of Kolkata, India, unless applicable
          law requires otherwise.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these Terms? Open an issue on our{" "}
          <a href={CONTACT_URL} rel="noopener noreferrer" target="_blank">
            GitHub repository
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
