<!-- File: README.md - Project overview for BrokenLink AI -->
# BrokenLink AI

BrokenLink AI is a full-stack SaaS starter that scans websites for broken links and missing images. The backend uses Node.js with Express to crawl pages, while the frontend uses React + Tailwind CSS to present results, paving the way for Stripe billing and Firebase authentication.

## Project Structure

```
SAAS/
|-- client/        # React + Tailwind frontend (Vite)
|-- server/        # Express API for scanning
|-- package.json   # npm workspaces + shared scripts
|-- README.md
`-- .gitignore
```

## Requirements

- Node.js 18+
- npm 9+

## Environment Variables

Duplicate the `.env.example` files provided in each package and fill in real values when ready:

- `server/.env.example`
  ```bash
  cp server/.env.example server/.env
  ```
- `client/.env.example`
  ```bash
  cp client/.env.example client/.env
  ```

## Install Dependencies

From the project root (`C:\Users\arlin\Downloads\SAAS`):

```bash
npm install
```

The root `package.json` uses npm workspaces so installing once pulls dependencies for both the server and client.

## Run Locally

- **Run both apps:**
  ```bash
  npm run dev
  ```
  This starts the Express API on http://localhost:5000 and the Vite dev server on http://localhost:3000.

- **Run individually:**
  ```bash
  npm run dev:server
  npm run dev:client
  ```

## Backend Options

- `DEBUG_LOGS=true` enables verbose request logging for axios and Puppeteer fallbacks.
- `PUPPETEER_HEADLESS=false` launches a visible Chromium window for troubleshooting (defaults to headless).
- `POST /scan` accepts an optional `cooperation` object:
  ```json
  {
    "url": "https://example.com",
    "cooperation": {
      "whitelistIP": true,
      "siteCredentials": { "user": "owner-user", "pass": "owner-pass" },
      "apiKey": "owner-provided-api-key"
    }
  }
  ```
  Site credentials, API keys, and whitelisting details must come directly from the site owner. Respect robots.txt and do not bypass protections without explicit permission.

## Deploy Targets

- **Frontend:** Optimized for Vercel via `npm run build --workspace client`.
- **Backend:** Ready for Render using `npm run start --workspace server`.

## Next Steps

- Connect Stripe checkout in `client/src/App.jsx` where the billing placeholder lives.
- Wire Firebase Authentication and wrap protected routes/components.
- Expand crawling depth, add scheduling, and persist historical scans.


