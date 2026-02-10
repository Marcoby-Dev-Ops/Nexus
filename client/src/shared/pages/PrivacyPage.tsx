import React from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '@/shared/components/layout/PublicHeader';

const lastUpdated = 'February 10, 2026';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <main className="mx-auto w-full max-w-4xl px-6 py-12 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

        <p className="mt-8 text-base text-muted-foreground">
          This Privacy Policy explains how Nexus, provided by Marcoby, collects, uses, and protects information when you use
          the Nexus platform.
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Account details such as name, email, and workspace profile information.</li>
            <li>Usage and activity data needed to operate the product and improve reliability.</li>
            <li>Content you provide, including prompts, files, and configured business context.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold">2. How We Use Data</h2>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Deliver core Nexus features and maintain product performance.</li>
            <li>Provide contextual responses and operating-system workflows.</li>
            <li>Support security, auditing, and abuse prevention.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold">3. Data Control and Ownership</h2>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Your organization retains ownership of its business data.</li>
            <li>You can request access, export, correction, or deletion of your data.</li>
            <li>Nexus does not sell customer data.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold">4. Security Practices</h2>
          <p className="text-muted-foreground">
            Nexus uses role-based access controls, encrypted transport, and operational safeguards designed for business
            workloads.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold">5. Contact</h2>
          <p className="text-muted-foreground">
            For privacy requests, contact <a href="mailto:privacy@marcoby.com" className="text-primary hover:underline">privacy@marcoby.com</a>.
          </p>
        </section>

        <div className="mt-12 border-t border-border/60 pt-6 text-sm text-muted-foreground">
          <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
          <span className="mx-2">•</span>
          <a href="https://marcoby.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">
            About Marcoby
          </a>
        </div>
      </main>
    </div>
  );
};
