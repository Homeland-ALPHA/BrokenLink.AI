/* File: client/src/App.jsx - Main React app for BrokenLink AI dashboard */
import { useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const statusTone = (broken) => (broken ? 'text-rose-400 bg-rose-950/50' : 'text-emerald-400 bg-emerald-950/30');

const brokenLabel = (broken) => (broken ? 'Broken' : 'OK');

function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  const stripePlaceholderCopy = useMemo(
    () => 'Stripe billing hooks will land here. Connect your publishable key to enable plan selection and checkout.',
    [],
  );

  const firebasePlaceholderCopy = useMemo(
    () => 'Firebase Authentication placeholder. Wire up Google/Auth provider and protect scans with user sessions.',
    [],
  );

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12">
          <div className="flex flex-col gap-2">
            <span className="text-sm uppercase tracking-widest text-emerald-400">BrokenLink AI</span>
            <h1 className="text-3xl font-semibold md:text-4xl">Spot broken links and missing images in seconds</h1>
            <p className="text-slate-300">
              Enter a site URL below to crawl up to 100 internal pages. Broken assets are highlighted instantly so you
              can fix them before your visitors find them.
            </p>
          </div>
          <form className="flex flex-col gap-4 md:flex-row" onSubmit={handleScan}>
            <label className="w-full md:flex-1" htmlFor="targetUrl">
              <span className="sr-only">Website URL</span>
              <input
                id="targetUrl"
                name="targetUrl"
                type="url"
                placeholder="https://example.com"
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
            <p className="rounded-md border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
              {error}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
        <section className="rounded-xl border border-slate-800 bg-slate-900/30">
          <div className="border-b border-slate-800 px-6 py-5">
            <h2 className="text-xl font-semibold">Scan Results</h2>
            <p className="text-sm text-slate-400">Links and assets collected from the crawl. Broken items glow red.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-900/60 text-slate-300">
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
                    <td className="px-6 py-4">{statusCode ?? 'N/A'}</td>
                    <td className="px-6 py-4 font-semibold">{brokenLabel(broken)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/20 bg-slate-900/40 p-6">
            <h3 className="text-lg font-semibold text-emerald-400">Stripe Billing Ready</h3>
            <p className="mt-2 text-sm text-slate-300">{stripePlaceholderCopy}</p>
            <div className="mt-4 rounded-lg border border-dashed border-emerald-500/40 p-4 text-xs text-emerald-200/80">
              Add plan tiers, call `stripe.redirectToCheckout`, and surface subscription status here.
            </div>
          </div>
          <div className="rounded-xl border border-sky-500/20 bg-slate-900/40 p-6">
            <h3 className="text-lg font-semibold text-sky-300">Firebase Authentication Coming Soon</h3>
            <p className="mt-2 text-sm text-slate-300">{firebasePlaceholderCopy}</p>
            <div className="mt-4 rounded-lg border border-dashed border-sky-500/40 p-4 text-xs text-sky-200/80">
              Include Firebase config, initialize the SDK, and wrap this app with context to gate scans.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;

