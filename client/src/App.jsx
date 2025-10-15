
/* File: client/src/App.jsx - Main React app for BrokenLink AI dashboard */
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const ADSENSE_CLIENT_ID = 'ca-pub-5520257741352291';

const statusTone = (broken) => (broken ? 'text-rose-400 bg-rose-950/50' : 'text-emerald-400 bg-emerald-950/30');

const brokenLabel = (broken) => (broken ? 'Broken' : 'OK');

const formatStatus = (statusCode) => (statusCode ? `${statusCode}` : 'N/A');

const AdSlot = ({ slot, format = 'auto', layout = undefined, className = '' }) => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.warn('AdSense slot could not be initialised', error);
    }
  }, [slot]);

  const adAttributes = {
    'data-ad-client': ADSENSE_CLIENT_ID,
    'data-ad-slot': slot,
    'data-full-width-responsive': 'true',
  };

  if (format) {
    adAttributes['data-ad-format'] = format;
  }

  if (layout) {
    adAttributes['data-ad-layout'] = layout;
  }

  return (
    <aside className={`flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-4 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Sponsored</span>
      <ins className="adsbygoogle block w-full" style={{ display: 'block' }} {...adAttributes} />
      <p className="text-[11px] text-slate-500">
        Replace the ad slot id with your assigned value before publishing. Ads keep BrokenLink AI accessible to solo builders.
      </p>
    </aside>
  );
};

function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState('');

  const navigation = useMemo(
    () => [
      { label: 'Product', href: '#product' },
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Resources', href: '#resources' },
      { label: 'Support', href: '#support' },
      { label: 'Policies', href: '#policies' },
    ],
    [],
  );

  const featureHighlights = useMemo(
    () => [
      {
        title: 'Deep link coverage',
        description:
          'Crawl up to one hundred internal pages per scan, with smart throttling that respects robots.txt and keeps your SEO footprint clean.',
      },
      {
        title: 'Rich media validation',
        description:
          'Monitor images, video streams, favicons, and downloadable assets. BrokenLink AI flags missing files and content-type mismatches in real time.',
      },
      {
        title: 'Accessibility friendly',
        description:
          'Surface missing alt text, empty anchor tags, and ARIA role gaps so you can uplift accessibility scores while fixing dead links.',
      },
      {
        title: 'Shareable intelligence',
        description:
          'Export branded PDF or CSV reports for clients, including prioritized fixes, supporting evidence, and change history.',
      },
    ],
    [],
  );

  const workflowSteps = useMemo(
    () => [
      {
        title: 'Enter a URL',
        copy:
          'Provide the page where your audit should begin. We automatically scope the crawl to the same domain unless you enable external exploration.',
      },
      {
        title: 'Let the crawler work',
        copy:
          'BrokenLink AI fans out requests and follows internal links while respecting timeouts and retry rules, mirroring how real users experience the site.',
      },
      {
        title: 'Review prioritized fixes',
        copy:
          'Failed requests, redirect loops, and content-type mismatches are grouped by severity so you can resolve the riskiest issues first.',
      },
    ],
    [],
  );

  const testimonials = useMemo(
    () => [
      {
        quote:
          'We embedded BrokenLink AI into our client onboarding checklist and reclaimed hours that used to disappear into manual QA.',
        author: 'Sanjana Patel, Founder at Northbridge Studio',
      },
      {
        quote:
          'The accessibility insights are a bonus. We caught mislabeled CTAs that were holding back our Lighthouse score before shipping a redesign.',
        author: 'Devon Miller, Growth Engineer at Switchboard',
      },
    ],
    [],
  );

  const faqItems = useMemo(
    () => [
      {
        question: 'How many pages can I scan per month?',
        answer:
          'The free plan includes 1,000 crawled pages every 30 days. Growth and Enterprise tiers expand that quota and unlock historical reporting.',
      },
      {
        question: 'Does BrokenLink AI impact my SEO?',
        answer:
          'No. We respect robots directives, throttle requests, cache results, and identify ourselves with a friendly user agent so your analytics remain trustworthy.',
      },
      {
        question: 'Can I schedule recurring scans?',
        answer:
          'Yes. Growth plans support weekly scheduling and Enterprise customers can configure custom cadences via the API or our Zapier integration.',
      },
      {
        question: 'Is my scan data private?',
        answer:
          'Absolutely. We store scan results in an encrypted database, purge raw payloads after 30 days, and never share your data with advertisers.',
      },
    ],
    [],
  );

  const resourceGuides = useMemo(
    () => [
      {
        title: 'Technical SEO checklist for scale-ups',
        description: 'A 12-point audit to keep search crawlers happy while you iterate on product pages.',
        href: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
      },
      {
        title: 'Designing accessible navigation that converts',
        description: 'Practical tips to combine WCAG guidelines with high-performing marketing layouts.',
        href: 'https://www.w3.org/WAI/fundamentals/accessibility-intro/',
      },
      {
        title: 'How dead links impact paid media performance',
        description: 'See why QA matters before you invest in campaigns and how BrokenLink AI fits the workflow.',
        href: 'https://ads.google.com/home/resources/marketing-objectives/site-quality-checklist/',
      },
    ],
    [],
  );
  const pricingPlans = useMemo(
    () => [
      {
        name: 'Starter',
        price: '$0',
        cadence: 'per month',
        cta: 'Launch for free',
        perks: ['1,000 crawled pages', 'Email notifications', 'Manual CSV export', 'Community support'],
      },
      {
        name: 'Growth',
        price: '$79',
        cadence: 'per month',
        cta: 'Start a trial',
        perks: ['10,000 crawled pages', 'Weekly scheduling', 'White-label PDF reports', 'Priority chat support'],
      },
      {
        name: 'Enterprise',
        price: 'Let’s chat',
        cadence: '',
        cta: 'Book a demo',
        perks: ['Unlimited domains', 'Dedicated success manager', 'Custom export integrations', 'SLA + security review'],
      },
    ],
    [],
  );

  const privacyPolicy = useMemo(
    () => [
      'BrokenLink AI collects only the information required to deliver our link monitoring service. When you create an account we store your name, email address, and password hash. We never collect payment details directly; all billing is handled securely by trusted third parties.',
      'Scan results include the URLs you provide, HTTP response metadata, and diagnostic details needed to highlight broken assets. This data is encrypted at rest, accessible only to the account that initiated the scan, and purged automatically after thirty days unless you opt into historical archiving.',
      'We rely on a short list of sub-processors, including reputable cloud hosting providers, analytics platforms, and payment processors. Each partner is reviewed for GDPR and CCPA alignment, and we sign data-protection agreements to ensure your information stays safe.',
      'You always remain in control of your data. You can export or delete your account from the dashboard, and you retain the right to request access, rectification, or erasure at any time by emailing privacy@brokenlink.ai. We respond to all requests within thirty days.',
      'Cookies are limited to essential session tokens and optional analytics. We display a consent banner for visitors from regions that require it, and no advertising cookies are dropped until you provide consent.',
      'If we make material updates to this policy we will notify you by email and post the revision date prominently on this page. Continued use of BrokenLink AI after changes take effect constitutes acceptance of the updated policy.',
    ],
    [],
  );

  const termsOfService = useMemo(
    () => [
      'By accessing BrokenLink AI you agree to abide by these Terms of Service and all applicable laws. If you disagree with any part of the terms you must discontinue use of the platform.',
      'You may only use BrokenLink AI to scan websites you own or have explicit permission to audit. Automated scraping of unrelated third-party properties violates these terms and will lead to immediate suspension.',
      'Plans that include paid features renew automatically each billing cycle until cancelled. You can downgrade or cancel at any time in the billing portal. Fees are non-refundable once the billing period has begun, except where required by law.',
      'BrokenLink AI is provided on an “as is” basis. We strive for high availability but do not guarantee uninterrupted access. Scheduled maintenance windows and urgent patches will be announced in advance whenever possible.',
      'To the maximum extent permitted by law, BrokenLink AI and its affiliates are not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our aggregate liability is limited to the fees you paid in the twelve months preceding the claim.',
      'These terms may be updated periodically to reflect product changes or legal requirements. We will announce updates on the dashboard and via email. Your continued use of the service following updates signifies acceptance.',
    ],
    [],
  );

  const currentYear = new Date().getFullYear();

  const scanSummary = useMemo(() => {
    if (!results.length) {
      return null;
    }
    const broken = results.filter((item) => item.broken);
    return {
      total: results.length,
      broken: broken.length,
      healthy: results.length - broken.length,
    };
  }, [results]);
  const handleScan = async (event) => {
    event.preventDefault();
    const targetUrl = url.trim();
    if (!targetUrl) {
      setError('Please enter a valid URL before scanning.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults([]);

    const requestHeaders = { 'Content-Type': 'application/json' };
    const payloadBase = { url: targetUrl };

    try {
      let response;
      try {
        response = await axios.post(
          `${API_BASE_URL}/scan`,
          { ...payloadBase, allowBrowserFallback: false },
          { headers: requestHeaders },
        );
      } catch (initialError) {
        const apiReason = initialError.response?.data?.reason;
        if (apiReason !== 'browser-required') {
          throw initialError;
        }
        response = await axios.post(
          `${API_BASE_URL}/scan`,
          { ...payloadBase, allowBrowserFallback: true },
          { headers: requestHeaders, timeout: 60000 },
        );
      }

      setResults(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'Scan failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactInput = (field) => (event) => {
    setContactForm((previous) => ({ ...previous, [field]: event.target.value }));
    setContactStatus('');
  };

  const handleContactSubmit = (event) => {
    event.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      setContactStatus('Please complete all fields before submitting.');
      return;
    }

    const subject = `BrokenLink AI support request from ${contactForm.name}`;
    const body = `Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\n${contactForm.message}`;
    const mailtoUrl = `mailto:hello@brokenlink.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (typeof window !== 'undefined') {
      window.location.href = mailtoUrl;
    }

    setContactStatus('We opened your email client with a pre-filled message. Send it to reach our team.');
  };

  return (
    <div id="top" className="min-h-screen bg-slate-950 text-slate-100">
      <a
        href="#mainContent"
        className="sr-only inline-flex h-10 items-center justify-center bg-emerald-500 px-4 text-sm font-semibold text-slate-950 focus:not-sr-only focus:absolute focus:left-6 focus:top-4 focus:rounded-md"
      >
        Skip to content
      </a>

      <header className="border-b border-slate-800 bg-slate-900/60 shadow-lg shadow-slate-950/30 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 text-xl font-semibold text-emerald-400">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-base">
                BL
              </span>
              <span>BrokenLink AI</span>
            </div>
            <nav className="flex flex-wrap gap-4 text-sm text-slate-300">
              {navigation.map(({ label, href }) => (
                <a
                  key={href}
                  className="rounded-md px-3 py-2 transition hover:bg-slate-800 hover:text-emerald-300"
                  href={href}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>

          <div className="grid gap-10 lg:grid-cols-[2fr,1fr] lg:items-start">
            <div className="flex flex-col gap-6">
              <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
                Ship polished websites with confidence, even on fast release cycles.
              </h1>
              <p className="text-base text-slate-300 md:text-lg">
                BrokenLink AI audits your marketing site, documentation, and product surfaces for dead ends, redirect
                loops, and missing media. Delight visitors and search engines without babysitting spreadsheets.
              </p>
              <ul className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                <li className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                  <strong className="block text-emerald-300">Instant diagnostics</strong>
                  Highlights broken assets as soon as the crawl completes.
                </li>
                <li className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3">
                  <strong className="block text-sky-300">Marketing-safe</strong>
                  Respects crawl budgets, referrers, and cookie consent preferences.
                </li>
              </ul>
            </div>

            <AdSlot slot="0000000000" className="max-lg:order-first" />
          </div>
        </div>
      </header>
      <main id="mainContent" className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-14">
        <section id="product" className="grid gap-10 lg:grid-cols-[3fr,2fr] lg:items-start">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-lg shadow-slate-950/20">
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-semibold text-emerald-300">Run a live scan</h2>
              <p className="text-sm text-slate-300">
                Paste a public URL and BrokenLink AI will crawl internal pages. We respect robots.txt and pause politely
                between requests to mimic human browsing velocity.
              </p>
            </div>

            <form className="mt-6 flex flex-col gap-4 md:flex-row" onSubmit={handleScan}>
              <label className="w-full md:flex-1" htmlFor="targetUrl">
                <span className="sr-only">Website URL</span>
                <input
                  id="targetUrl"
                  name="targetUrl"
                  type="url"
                  placeholder="https://your-site.com"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-slate-100 shadow-inner placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  disabled={isLoading}
                  required
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
                disabled={isLoading}
              >
                {isLoading ? 'Scanning…' : 'Scan Site'}
              </button>
            </form>

            {error && (
              <p className="mt-4 rounded-md border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
                {error}
              </p>
            )}

            {scanSummary && (
              <div className="mt-6 grid gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Total Links</p>
                  <p className="text-xl font-semibold text-slate-200">{scanSummary.total}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Healthy</p>
                  <p className="text-xl font-semibold text-emerald-300">{scanSummary.healthy}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Requires Fix</p>
                  <p className="text-xl font-semibold text-rose-300">{scanSummary.broken}</p>
                </div>
              </div>
            )}

            <div className="mt-8 overflow-hidden rounded-xl border border-slate-800">
              <div className="border-b border-slate-800 bg-slate-900/70 px-6 py-4">
                <h3 className="text-lg font-semibold text-slate-200">Latest scan output</h3>
                <p className="text-xs text-slate-400">
                  Links and assets collected from the crawl. Broken items glow red for easy triage.
                </p>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-900/60 text-slate-300">
                    <tr>
                      <th className="px-6 py-3 font-medium">Link</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {results.length === 0 && !isLoading && (
                      <tr>
                        <td className="px-6 py-6 text-slate-500" colSpan={3}>
                          Run a scan to see the latest results.
                        </td>
                      </tr>
                    )}
                    {results.map(({ link, statusCode, broken }) => (
                      <tr key={`${link}-${statusCode ?? 'unknown'}`} className={statusTone(broken)}>
                        <td className="max-w-2xl truncate px-6 py-4">
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="underline decoration-dotted underline-offset-2"
                          >
                            {link}
                          </a>
                        </td>
                        <td className="px-6 py-4">{formatStatus(statusCode)}</td>
                        <td className="px-6 py-4 font-semibold">{brokenLabel(broken)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <AdSlot slot="0000000001" />
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-200">Why teams switch to BrokenLink AI</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li>
                  <strong className="text-emerald-300">Frictionless onboarding:</strong> start scanning in minutes with
                  zero setup scripts.
                </li>
                <li>
                  <strong className="text-emerald-300">Actionable alerts:</strong> receive concise summaries, not raw
                  server logs.
                </li>
                <li>
                  <strong className="text-emerald-300">Compliance ready:</strong> privacy-first architecture and consent
                  flows built for modern ad networks.
                </li>
              </ul>
            </div>
          </div>
        </section>
        <section id="features" className="flex flex-col gap-8">
          <header>
            <h2 className="text-2xl font-semibold text-emerald-300">Features that deliver measurable impact</h2>
            <p className="mt-2 text-sm text-slate-300">
              BrokenLink AI combines reliable crawling with marketing-friendly insights so your team can release fast and
              stay compliant with Google’s publisher policies.
            </p>
          </header>
          <div className="grid gap-6 md:grid-cols-2">
            {featureHighlights.map(({ title, description }) => (
              <article key={title} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
                <p className="mt-2 text-sm text-slate-300">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-8 lg:grid-cols-[2fr,1fr]">
          <div>
            <h2 className="text-2xl font-semibold text-slate-200">How BrokenLink AI slots into your workflow</h2>
            <ol className="mt-6 space-y-6">
              {workflowSteps.map(({ title, copy }, index) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-lg font-semibold text-emerald-300">
                    {index + 1}
                  </span>
                  <div className="space-y-2 text-sm text-slate-300">
                    <h3 className="text-base font-semibold text-slate-100">{title}</h3>
                    <p>{copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <AdSlot slot="0000000002" />
        </section>

        <section className="flex flex-col gap-8">
          <h2 className="text-2xl font-semibold text-slate-200">Trusted by marketing, product, and agency teams</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map(({ quote, author }) => (
              <blockquote
                key={author}
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-sm text-slate-200"
              >
                <p className="italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
                <cite className="mt-4 block text-xs uppercase tracking-widest text-emerald-200">{author}</cite>
              </blockquote>
            ))}
          </div>
        </section>
        <section id="pricing" className="flex flex-col gap-8">
          <header>
            <h2 className="text-2xl font-semibold text-emerald-300">Pricing that scales with your ambition</h2>
            <p className="mt-2 text-sm text-slate-300">
              Start free, upgrade when you are ready to automate reporting, and keep stakeholders in the loop with
              predictable monthly billing.
            </p>
          </header>
          <div className="grid gap-6 md:grid-cols-3">
            {pricingPlans.map(({ name, price, cadence, cta, perks }) => (
              <article
                key={name}
                className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow"
              >
                <div>
                  <h3 className="text-lg font-semibold text-slate-200">{name}</h3>
                  <p className="mt-2 text-3xl font-bold text-emerald-300">
                    {price}
                    <span className="ml-1 text-sm font-normal text-slate-400">{cadence}</span>
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                >
                  {cta}
                </button>
                <ul className="flex flex-col gap-2 text-sm text-slate-300">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="resources" className="flex flex-col gap-6">
          <header>
            <h2 className="text-2xl font-semibold text-slate-200">Resources to improve site quality</h2>
            <p className="mt-2 text-sm text-slate-300">
              Keep learning with guides curated by the BrokenLink AI team. Each article supports Google AdSense and
              Search Essentials best practices.
            </p>
          </header>
          <div className="grid gap-4 md:grid-cols-2">
            {resourceGuides.map(({ title, description, href }) => (
              <article key={title} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-300">
                <h3 className="text-base font-semibold text-slate-100">{title}</h3>
                <p className="mt-2">{description}</p>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-emerald-300 underline decoration-dotted underline-offset-4"
                >
                  Read the guide
                  <span aria-hidden>-&gt;</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="flex flex-col gap-6">
          <header>
            <h2 className="text-2xl font-semibold text-slate-200">Frequently asked questions</h2>
            <p className="mt-2 text-sm text-slate-300">
              Need clarity before applying for AdSense or scanning client properties? Start here.
            </p>
          </header>
          <div className="grid gap-4 md:grid-cols-2">
            {faqItems.map(({ question, answer }) => (
              <article key={question} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="text-sm font-semibold text-slate-100">{question}</h3>
                <p className="mt-2 text-sm text-slate-300">{answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="policies" className="flex flex-col gap-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
          <div>
            <h2 className="text-2xl font-semibold text-emerald-300">Privacy policy</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              {privacyPolicy.map((paragraph, index) => (
                <p key={`privacy-${index}`}>{paragraph}</p>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-emerald-300">Terms of service</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              {termsOfService.map((paragraph, index) => (
                <p key={`terms-${index}`}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>

        <section id="support" className="grid gap-8 lg:grid-cols-[2fr,3fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-2xl font-semibold text-slate-200">Need a hand?</h2>
            <p className="mt-2 text-sm text-slate-300">
              Our support team responds to most inquiries within one business day. Tell us about your site, share any
              platform requirements, and we will point you toward the right setup.
            </p>
            <dl className="mt-6 space-y-3 text-sm text-slate-300">
              <div>
                <dt className="text-xs uppercase tracking-widest text-slate-500">Email</dt>
                <dd>
                  <a className="text-emerald-300 underline" href="mailto:hello@brokenlink.ai">
                    hello@brokenlink.ai
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-slate-500">Business hours</dt>
                <dd>Monday to Friday · 8:00 AM–6:00 PM EST</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-slate-500">Office</dt>
                <dd>2211 Market Street, Suite 400, San Francisco, CA 94114</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="text-lg font-semibold text-slate-200">Contact form</h3>
            <p className="mt-2 text-sm text-slate-300">
              Send us a quick note and we will route it to the right teammate. We only use this information to follow up
              on your request.
            </p>
            <form className="mt-6 grid gap-4" onSubmit={handleContactSubmit}>
              <label className="text-sm text-slate-200" htmlFor="contact-name">
                Name
                <input
                  id="contact-name"
                  name="contact-name"
                  type="text"
                  className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="Your name"
                  value={contactForm.name}
                  onChange={handleContactInput('name')}
                  required
                />
              </label>
              <label className="text-sm text-slate-200" htmlFor="contact-email">
                Email
                <input
                  id="contact-email"
                  name="contact-email"
                  type="email"
                  className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="name@company.com"
                  value={contactForm.email}
                  onChange={handleContactInput('email')}
                  required
                />
              </label>
              <label className="text-sm text-slate-200" htmlFor="contact-message">
                How can we help?
                <textarea
                  id="contact-message"
                  name="contact-message"
                  rows={4}
                  className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="Share details about your project, launch timing, or AdSense review goals."
                  value={contactForm.message}
                  onChange={handleContactInput('message')}
                  required
                />
              </label>
              <button
                type="submit"
                className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow shadow-emerald-500/20 transition hover:bg-emerald-400"
              >
                Draft email to support
              </button>
              {contactStatus && (
                <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                  {contactStatus}
                </p>
              )}
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-400">
            &copy; {currentYear} BrokenLink AI. Crafted for quality-first marketing teams.
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
            {navigation.map(({ label, href }) => (
              <a key={`footer-${href}`} className="hover:text-emerald-300" href={href}>
                {label}
              </a>
            ))}
            <a className="hover:text-emerald-300" href="mailto:privacy@brokenlink.ai">
              Privacy inquiries
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;