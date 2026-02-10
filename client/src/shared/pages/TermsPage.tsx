import React from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '@/shared/components/layout/PublicHeader';

const lastUpdated = 'February 10, 2026';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <main className="mx-auto w-full max-w-4xl px-6 py-12 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

        <p className="mt-8 text-base text-muted-foreground">
          These Terms govern use of Nexus, an AI operating system for business provided by Marcoby.
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold">1. Service Use</h2>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>You agree to use Nexus in compliance with applicable laws and regulations.</li>
            <li>You are responsible for safeguarding account credentials and workspace access.</li>
            <li>You may not misuse, reverse engineer, or disrupt the service.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold">2. Customer Data</h2>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>You retain ownership of your content and business data.</li>
            <li>You grant Marcoby limited rights necessary to operate and secure Nexus.</li>
            <li>Data handling is further described in the Privacy Policy.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold">3. Availability and Changes</h2>
          <p className="text-muted-foreground">
            Nexus evolves continuously. We may improve, modify, or discontinue features while maintaining transparent
            communication for material changes.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold">4. Payments and Cancellation</h2>
          <p className="text-muted-foreground">
            Paid plans, billing terms, and cancellation conditions are governed by your selected subscription agreement.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold">5. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            To the extent permitted by law, Marcoby is not liable for indirect, incidental, or consequential damages arising
            from use of Nexus.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold">6. Contact</h2>
          <p className="text-muted-foreground">
            For legal questions, contact <a href="mailto:legal@marcoby.com" className="text-primary hover:underline">legal@marcoby.com</a>.
          </p>
        </section>

        <div className="mt-12 border-t border-border/60 pt-6 text-sm text-muted-foreground">
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          <span className="mx-2">•</span>
          <a href="https://marcoby.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">
            About Marcoby
          </a>
        </div>
      </main>
    </div>
  );
};
