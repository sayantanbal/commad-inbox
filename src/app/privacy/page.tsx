import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — Command Inbox",
  description: "How Command Inbox collects, uses, and protects your data.",
};

const LAST_UPDATED = "June 17, 2026";
const CONTACT_URL = "https://github.com/sayantanbal/commad-inbox/issues";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <section>
        <p>
          Command Inbox (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) provides a keyboard-first
          email and calendar workspace that connects to your Google account. This Privacy Policy
          explains what information we collect, how we use it, and the choices you have.
        </p>
      </section>

      <section>
        <h2>Information we collect</h2>
        <h3>Account information</h3>
        <p>
          When you sign in with Google, we receive your name, email address, and profile image from
          your Google account. We use this to create your account and identify you within the
          service.
        </p>
        <h3>Google Gmail and Calendar data</h3>
        <p>
          With your permission, we access Gmail and Google Calendar through Google&apos;s APIs. This
          includes email threads, message content, attachments metadata, calendar events, and
          availability. We use this data to triage your inbox, surface commitments, create calendar
          invites, send drafts, and power search and agent workflows you initiate.
        </p>
        <h3>Data you create in Command Inbox</h3>
        <p>
          We store app-specific data such as triage lanes, snoozes, meeting links, contacts you add,
          AI provider preferences, and chat history with the in-app agent.
        </p>
        <h3>AI processing</h3>
        <p>
          Email content may be sent to AI providers (such as OpenAI or Google Gemini) for
          classification, drafting, and agent tasks. You can supply your own API keys in Settings;
          otherwise we may use platform-provided keys as a fallback. AI providers process data
          according to their own policies.
        </p>
        <h3>Technical data</h3>
        <p>
          We collect standard server logs (IP address, browser type, timestamps) and session
          cookies required for authentication and security.
        </p>
      </section>

      <section>
        <h2>How we use your information</h2>
        <ul>
          <li>Provide, maintain, and improve Command Inbox</li>
          <li>Authenticate you and keep your session secure</li>
          <li>Classify email, extract commitments, and run workflows you request</li>
          <li>Sync calendar availability and create events on your behalf when you approve actions</li>
          <li>Send real-time updates to your browser via our realtime provider</li>
          <li>Respond to support requests and fix bugs</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </section>

      <section>
        <h2>How we store and protect data</h2>
        <p>
          Application data is stored in encrypted databases hosted by our infrastructure providers
          (including Neon Postgres). OAuth tokens and sensitive credentials are encrypted at rest.
          Email and calendar data is also cached through the Corsair integration layer to reduce API
          calls and improve performance.
        </p>
        <p>
          No system is perfectly secure. We use industry-standard practices, but we cannot
          guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>Third-party services</h2>
        <p>We rely on third parties to operate Command Inbox, including:</p>
        <ul>
          <li>Google (Gmail, Calendar, OAuth)</li>
          <li>Corsair (email and calendar integration)</li>
          <li>Neon (database hosting)</li>
          <li>Vercel (application hosting)</li>
          <li>Pusher (realtime updates)</li>
          <li>AI providers you select or that we use as fallback (OpenAI, Google)</li>
        </ul>
        <p>
          Each provider processes data under its own terms and privacy policies. We share only
          what is necessary to deliver the service.
        </p>
      </section>

      <section>
        <h2>Data retention</h2>
        <p>
          We retain your data while your account is active. If you disconnect Google or delete
          your account, we delete or anonymize associated data within a reasonable period, except
          where we must retain information for legal, security, or backup purposes.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <ul>
          <li>
            <strong>Revoke Google access</strong> — disconnect in Settings or via your{" "}
            <a href="https://myaccount.google.com/permissions" rel="noopener noreferrer" target="_blank">
              Google Account permissions
            </a>
          </li>
          <li>
            <strong>Bring your own AI keys</strong> — use your own provider keys instead of platform
            fallbacks
          </li>
          <li>
            <strong>Request deletion</strong> — contact us to request account and data deletion
          </li>
        </ul>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          Command Inbox is not directed at children under 13. We do not knowingly collect
          information from children.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update this policy from time to time. We will post the revised version on this
          page and update the &quot;Last updated&quot; date.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about this policy? Open an issue on our{" "}
          <a href={CONTACT_URL} rel="noopener noreferrer" target="_blank">
            GitHub repository
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
