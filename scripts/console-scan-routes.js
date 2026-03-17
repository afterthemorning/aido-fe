const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const routerFile = path.join(process.cwd(), 'src/routers/index.tsx');
const src = fs.readFileSync(routerFile, 'utf8');

const routeMatches = [...src.matchAll(/path='([^']+)'/g)].map((m) => m[1]);
const unique = [...new Set(routeMatches)];

function normalizeDynamic(routePath) {
  return routePath
    .replace(/\/:([^/\?]+)\?/g, '/1')
    .replace(/:([^/]+)/g, '1')
    .replace(/\*/g, '')
    .replace(/\/+/g, '/');
}

const candidates = unique
  .map(normalizeDynamic)
  .filter(Boolean)
  .filter((p) => p !== '*');

const routes = [...new Set(candidates)].sort();

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const base = process.env.SCAN_BASE || 'http://127.0.0.1:8765/aido';
  const results = [];

  for (const routePath of routes) {
    const page = await context.newPage();
    const url = `${base}${routePath.startsWith('/') ? routePath : `/${routePath}`}`;
    const errors = [];
    const pageErrors = [];

    const onConsole = (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    };

    const onPageError = (err) => {
      pageErrors.push(String(err));
    };

    page.on('console', onConsole);
    page.on('pageerror', onPageError);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1200);
      results.push({ route: routePath, finalUrl: page.url(), errors, pageErrors });
    } catch (e) {
      results.push({ route: routePath, finalUrl: 'NAVIGATE_FAILED', errors: [String(e)], pageErrors });
    }

    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    await page.close().catch(() => {});
  }

  await browser.close();

  const withIssues = results.filter((r) => r.errors.length > 0 || r.pageErrors.length > 0);

  console.log('ROUTES_SCANNED', routes.length);
  console.log('ROUTES_WITH_ISSUES', withIssues.length);

  for (const item of withIssues.slice(0, 120)) {
    console.log('---');
    console.log('ROUTE', item.route, 'FINAL', item.finalUrl);
    for (const e of item.errors.slice(0, 6)) {
      console.log('CONSOLE_ERROR', e);
    }
    for (const e of item.pageErrors.slice(0, 6)) {
      console.log('PAGE_ERROR', e);
    }
  }

  fs.writeFileSync('tmp-console-scan.json', JSON.stringify({ routes, results }, null, 2));
  console.log('REPORT_WRITTEN', 'tmp-console-scan.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
