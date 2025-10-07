/* File: server/src/scanner.js - Website scanning utilities for BrokenLink AI */
import axios from 'axios';
import { load } from 'cheerio';
import puppeteer from 'puppeteer';
import robotsParserPkg from 'robots-parser';
import { performance } from 'node:perf_hooks';

const robotsParser = robotsParserPkg.default ?? robotsParserPkg;

const MAX_LINKS = 100;
const REQUEST_TIMEOUT_MS = 15000;
const RATE_LIMIT_INTERVAL_MS = 500;
const MAX_RETRIES = 2;
const BACKOFF_BASE_DELAY_MS = 500;
const USER_AGENT = process.env.SCAN_USER_AGENT || 'BrokenLinkAI/0.1 (+https://brokenlink.ai)';
const BROWSER_USER_AGENT =
  process.env.BROWSER_USER_AGENT ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const DEBUG_ENABLED = process.env.DEBUG_LOGS === 'true';
const HEADLESS_PUPPETEER = (process.env.PUPPETEER_HEADLESS ?? 'true').toLowerCase() !== 'false';
const TRANSIENT_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const TRANSIENT_ERROR_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNABORTED', 'EPIPE', 'ENOTFOUND', 'EAI_AGAIN']);
const MAX_BROWSER_WAIT_MS = 10000;

const httpClient = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
  maxRedirects: 5,
  validateStatus: () => true,
  responseType: 'text',
});

const rateLimitTracker = new Map();
const robotsCache = new Map();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const logRequest = (method, url, details = {}) => {
  const label = `[scanner] ${method.toUpperCase()} ${url}`;
  if (DEBUG_ENABLED) {
    console.log(label, details);
    return;
  }

  if (details.level === 'error') {
    console.error(label, details.reason ?? details.error ?? '');
    return;
  }

  if (details.reason === 'robots.txt') {
    console.log(`${label} blocked by robots.txt`);
    return;
  }

  if (details.status) {
    console.log(`${label} -> ${details.status}`);
  }
};

const sanitiseUrl = (rawUrl, baseUrl) => {
  try {
    const resolved = baseUrl ? new URL(rawUrl, baseUrl) : new URL(rawUrl);
    if (!['http:', 'https:'].includes(resolved.protocol)) {
      return null;
    }
    resolved.hash = '';
    return resolved.href;
  } catch (error) {
    return null;
  }
};

const classifyStatusReason = (statusCode, html) => {
  if (!statusCode) {
    return 'no-status';
  }
  if (statusCode === 403) {
    return 'blocked';
  }
  if (statusCode === 503) {
    return 'maintenance';
  }
  if (statusCode >= 400) {
    return `http-${statusCode}`;
  }
  if (!html) {
    return 'empty-body';
  }
  return undefined;
};

const classifyError = (error) => {
  if (!error) {
    return 'unknown';
  }
  const status = error.response?.status;
  if (status === 403) {
    return 'blocked';
  }
  if (status === 503) {
    return 'maintenance';
  }
  if (status && status >= 400) {
    return `http-${status}`;
  }
  if (error.code && TRANSIENT_ERROR_CODES.has(error.code)) {
    return error.code.toLowerCase();
  }
  if (typeof error.message === 'string' && error.message.toLowerCase().includes('timeout')) {
    return 'timeout';
  }
  return error.code?.toLowerCase() ?? 'network-error';
};

const isTransient = (error) => {
  if (!error) {
    return false;
  }
  if (error.code && TRANSIENT_ERROR_CODES.has(error.code)) {
    return true;
  }
  const status = error.response?.status;
  return Boolean(status && TRANSIENT_STATUS_CODES.has(status));
};

const enforceRateLimit = async (url) => {
  const hostname = new URL(url).hostname;
  const now = Date.now();
  const lastHit = rateLimitTracker.get(hostname) ?? 0;
  const waitMs = RATE_LIMIT_INTERVAL_MS - (now - lastHit);
  if (waitMs > 0) {
    await delay(waitMs);
  }
  rateLimitTracker.set(hostname, Date.now());
};

const buildAxiosHeaders = (ownerOptions) => {
  const headers = { 'User-Agent': USER_AGENT };
  if (ownerOptions?.apiKey) {
    headers['X-API-Key'] = ownerOptions.apiKey;
  }
  return headers;
};

const withRetries = async (fn, context) => {
  let attempt = 0;
  let lastError;
  while (attempt <= MAX_RETRIES) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const reason = classifyError(error);
      const transient = isTransient(error);
      logRequest(context.method, context.url, {
        level: 'error',
        attempt,
        reason,
        retry: transient && attempt < MAX_RETRIES,
      });
      if (!transient || attempt === MAX_RETRIES) {
        throw error;
      }
      const backoff = BACKOFF_BASE_DELAY_MS * 2 ** attempt;
      await delay(backoff);
      attempt += 1;
    }
  }
  throw lastError;
};

const fetchRobotsRules = async (origin, ownerOptions) => {
  if (robotsCache.has(origin)) {
    return robotsCache.get(origin);
  }
  const robotsUrl = `${origin}/robots.txt`;
  try {
    await enforceRateLimit(robotsUrl);
    const response = await withRetries(
      () =>
        httpClient.get(robotsUrl, {
          headers: buildAxiosHeaders(ownerOptions),
          auth: ownerOptions?.siteCredentials,
        }),
      { method: 'axios', url: robotsUrl },
    );

    if (!response || response.status >= 400 || typeof response.data !== 'string') {
      robotsCache.set(origin, null);
      return null;
    }

    const parser = robotsParser(robotsUrl, response.data);
    robotsCache.set(origin, parser);
    return parser;
  } catch (error) {
    logRequest('axios', robotsUrl, { level: 'error', reason: classifyError(error) });
    robotsCache.set(origin, null);
    return null;
  }
};

const ensureRobotsAllowed = async (url, ownerOptions) => {
  const origin = new URL(url).origin;
  const parser = await fetchRobotsRules(origin, ownerOptions);
  if (!parser) {
    return;
  }
  if (!parser.isAllowed(url, USER_AGENT)) {
    const error = new Error('Disallowed by robots.txt');
    error.statusCode = 403;
    error.reason = 'robots.txt';
    logRequest('axios', url, { status: 403, reason: 'robots.txt' });
    throw error;
  }
};

const createResult = ({ link, statusCode, broken, timeTakenMs, sourceType, reason }) => {
  const result = { link, statusCode, broken, timeTakenMs, sourceType };
  if (reason) {
    result.reason = reason;
  }
  return result;
};

const fetchPageWithAxios = async (url, ownerOptions) => {
  const start = performance.now();
  try {
    const response = await withRetries(
      async () => {
        await enforceRateLimit(url);
        return httpClient.request({
          url,
          method: 'get',
          headers: buildAxiosHeaders(ownerOptions),
          auth: ownerOptions?.siteCredentials,
        });
      },
      { method: 'axios', url },
    );

    const html = typeof response.data === 'string' ? response.data : null;
    const statusCode = response.status ?? null;
    const broken = !statusCode || statusCode >= 400;
    const reason = classifyStatusReason(statusCode, html);
    const result = createResult({
      link: url,
      statusCode,
      broken,
      timeTakenMs: Math.round(performance.now() - start),
      sourceType: 'axios',
      reason,
    });

    logRequest('axios', url, { status: statusCode, reason });

    const shouldFallback =
      Boolean(
        reason === 'blocked' ||
        reason === 'timeout' ||
        reason === 'http-403' ||
        reason === 'http-401' ||
        reason === 'http-429' ||
        statusCode === 401 ||
        statusCode === 403 ||
        statusCode === 429,
      );

    return {
      html,
      result,
      shouldFallback,
      links: [],
      networkStatus: new Map(),
    };
  } catch (error) {
    const reason = classifyError(error);
    const statusCode = error.response?.status ?? null;
    logRequest('axios', url, { level: 'error', reason, status: statusCode });

    return {
      html: null,
      result: createResult({
        link: url,
        statusCode,
        broken: true,
        timeTakenMs: Math.round(performance.now() - start),
        sourceType: 'axios',
        reason,
      }),
      shouldFallback: Boolean(
        reason === 'blocked' ||
        reason === 'timeout' ||
        reason === 'http-403' ||
        reason === 'http-401' ||
        reason === 'http-429' ||
        statusCode === 401 ||
        statusCode === 403 ||
        statusCode === 429,
      ),
      links: [],
      networkStatus: new Map(),
    };
  }
};

const waitForIdleIfAvailable = async (page) => {
  if (typeof page.waitForNetworkIdle === 'function') {
    try {
      await page.waitForNetworkIdle({ idleTime: 500, timeout: MAX_BROWSER_WAIT_MS });
      return;
    } catch (error) {
      if (DEBUG_ENABLED) {
        logRequest('puppeteer', 'waitForNetworkIdle', { level: 'error', reason: classifyError(error) });
      }
    }
  }
  await page.waitForTimeout(500);
};

const fetchPageWithPuppeteer = async (url, ownerOptions, origin) => {
  const start = performance.now();
  let browser;
  let page;
  const responses = new Map();
  try {
    browser = await puppeteer.launch({
      headless: HEADLESS_PUPPETEER,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    await page.setUserAgent(BROWSER_USER_AGENT);
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      ...buildAxiosHeaders(ownerOptions),
    });
    if (ownerOptions?.siteCredentials) {
      await page.authenticate(ownerOptions.siteCredentials);
    }

    page.on('response', (response) => {
      const responseUrl = sanitiseUrl(response.url());
      if (!responseUrl || !responseUrl.startsWith(origin)) {
        return;
      }
      responses.set(responseUrl, response.status());
    });

    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: MAX_BROWSER_WAIT_MS,
    });
    await waitForIdleIfAvailable(page);

    const html = await page.content();
    const discoveredLinks = await page.evaluate(
      (baseOrigin, maxLinks) => {
        const unique = new Set();
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        for (const anchor of anchors) {
          if (unique.size >= maxLinks) {
            break;
          }
          const href = anchor.getAttribute('href');
          if (!href) {
            continue;
          }
          try {
            const resolved = new URL(href, baseOrigin);
            if (resolved.origin !== baseOrigin) {
              continue;
            }
            resolved.hash = '';
            unique.add(resolved.href);
          } catch (error) {
            // Ignore malformed URLs
          }
        }
        return Array.from(unique);
      },
      origin,
      MAX_LINKS,
    );

    const statusCode = response?.status() ?? null;
    const broken = !statusCode || statusCode >= 400;
    const reason = classifyStatusReason(statusCode, html);
    const timeTakenMs = Math.round(performance.now() - start);
    const result = createResult({
      link: url,
      statusCode,
      broken,
      timeTakenMs,
      sourceType: 'puppeteer',
      reason,
    });

    logRequest('puppeteer', url, { status: statusCode, reason });

    return {
      html,
      result,
      shouldFallback: false,
      links: discoveredLinks,
      networkStatus: responses,
    };
  } catch (error) {
    const reason = classifyError(error);
    logRequest('puppeteer', url, { level: 'error', reason, error: error.message });
    return {
      html: null,
      result: createResult({
        link: url,
        statusCode: error.response?.status ?? null,
        broken: true,
        timeTakenMs: Math.round(performance.now() - start),
        sourceType: 'puppeteer',
        reason,
      }),
      shouldFallback: false,
      links: [],
      networkStatus: responses,
    };
  } finally {
    try {
      if (page) {
        await page.close();
      }
    } catch (closePageError) {
      logRequest('puppeteer', url, { level: 'error', reason: 'close-page', error: closePageError.message });
    }
    try {
      if (browser) {
        await browser.close();
      }
    } catch (closeBrowserError) {
      logRequest('puppeteer', url, { level: 'error', reason: 'close-browser', error: closeBrowserError.message });
    }
  }
};

const fetchAssetWithAxios = async (url, method, ownerOptions) => {
  const start = performance.now();
  try {
    const response = await withRetries(
      async () => {
        await enforceRateLimit(url);
        return httpClient.request({
          url,
          method,
          headers: buildAxiosHeaders(ownerOptions),
          auth: ownerOptions?.siteCredentials,
        });
      },
      { method: 'axios', url },
    );

    const statusCode = response.status ?? null;
    const broken = !statusCode || statusCode >= 400;
    const result = createResult({
      link: url,
      statusCode,
      broken,
      timeTakenMs: Math.round(performance.now() - start),
      sourceType: 'axios',
      reason: classifyStatusReason(statusCode),
    });

    logRequest('axios', url, { status: statusCode, method });

    return { result };
  } catch (error) {
    const reason = classifyError(error);
    logRequest('axios', url, { level: 'error', reason, error: error.message });
    return {
      result: createResult({
        link: url,
        statusCode: error.response?.status ?? null,
        broken: true,
        timeTakenMs: Math.round(performance.now() - start),
        sourceType: 'axios',
        reason,
      }),
    };
  }
};

export const scanWebsite = async (startUrl, scanOptions = {}) => {
  const ownerOptions = scanOptions.cooperation ?? undefined;
  const allowBrowserFallback = scanOptions.allowBrowserFallback !== false;
  const maxFindings = ownerOptions?.whitelistIP ? 200 : MAX_LINKS;

  const start = sanitiseUrl(startUrl);
  if (!start) {
    const error = new Error('Invalid or unsupported URL');
    error.statusCode = 400;
    error.reason = 'invalid-url';
    throw error;
  }

  await ensureRobotsAllowed(start, ownerOptions);

  const origin = new URL(start).origin;
  const queue = [start];
  const visitedPages = new Set();
  const seenResources = new Set();
  const findings = [];

  while (queue.length > 0 && findings.length < maxFindings) {
    const current = queue.shift();
    if (!current || visitedPages.has(current)) {
      continue;
    }

    visitedPages.add(current);

    await ensureRobotsAllowed(current, ownerOptions);

    let pageFetch = await fetchPageWithAxios(current, ownerOptions);
    let html = pageFetch.html;
    let pageResult = pageFetch.result;
    let discoveredLinks = pageFetch.links;
    let networkStatus = pageFetch.networkStatus;

    if (pageFetch.shouldFallback) {
      if (!allowBrowserFallback) {
        const browserRequiredError = new Error('Scan requires browser automation to bypass bot protection.');
        browserRequiredError.statusCode = 409;
        browserRequiredError.reason = 'browser-required';
        browserRequiredError.partialFindings = findings.concat(pageResult);
        throw browserRequiredError;
      }
      const fallback = await fetchPageWithPuppeteer(current, ownerOptions, origin);
      if (fallback.html) {
        html = fallback.html;
        pageResult = fallback.result;
        discoveredLinks = fallback.links.length > 0 ? fallback.links : discoveredLinks;
        networkStatus = fallback.networkStatus;
      } else if (!pageResult.reason && fallback.result.reason) {
        pageResult.reason = fallback.result.reason;
      }
    }

    findings.push(pageResult);
    if (findings.length >= maxFindings || !html) {
      continue;
    }

    const $ = load(html);

    if (!Array.isArray(discoveredLinks) || discoveredLinks.length === 0) {
      discoveredLinks = [];
    }

    $('a[href]').each((_, element) => {
      if (findings.length + queue.length >= maxFindings) {
        return;
      }
      const href = $(element).attr('href');
      const resolved = sanitiseUrl(href, current);
      if (!resolved || !resolved.startsWith(origin)) {
        return;
      }
      if (visitedPages.has(resolved) || queue.includes(resolved) || discoveredLinks.includes(resolved)) {
        return;
      }
      discoveredLinks.push(resolved);
    });

    for (const linkUrl of discoveredLinks) {
      if (findings.length + queue.length >= maxFindings) {
        break;
      }
      if (!visitedPages.has(linkUrl) && !queue.includes(linkUrl)) {
        queue.push(linkUrl);
      }
    }

    const imageCandidates = new Set();
    $('img[src]').each((_, element) => {
      const src = $(element).attr('src');
      const resolved = sanitiseUrl(src, current);
      if (!resolved || seenResources.has(resolved) || !resolved.startsWith(origin)) {
        return;
      }
      seenResources.add(resolved);
      imageCandidates.add(resolved);
    });

    for (const imageUrl of imageCandidates) {
      if (findings.length >= maxFindings) {
        break;
      }

      if (networkStatus?.has(imageUrl)) {
        const statusCode = networkStatus.get(imageUrl);
        findings.push(
          createResult({
            link: imageUrl,
            statusCode,
            broken: !statusCode || statusCode >= 400,
            timeTakenMs: 0,
            sourceType: 'puppeteer',
            reason: classifyStatusReason(statusCode),
          }),
        );
        continue;
      }

      const headResult = await fetchAssetWithAxios(imageUrl, 'head', ownerOptions);
      if (headResult.result.statusCode === 405) {
        const getResult = await fetchAssetWithAxios(imageUrl, 'get', ownerOptions);
        findings.push(getResult.result);
        continue;
      }
      findings.push(headResult.result);
    }
  }

  return findings.slice(0, maxFindings);
};









