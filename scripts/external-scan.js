const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function getRoutes() {
  const routerFile = path.join(process.cwd(), 'src/routers/index.tsx');
  const src = fs.readFileSync(routerFile, 'utf8');
  const routeMatches = [...src.matchAll(/path='([^']+)'/g)].map((m) => m[1]);
  const unique = [...new Set(routeMatches)];
  return unique
    .map((routePath) =>
      routePath
        .replace(/\/:([^/\?]+)\?/g, '/1')
        .replace(/:([^/]+)/g, '1')
        .replace(/\*/g, '')
        .replace(/\/+/g, '/'),
    )
    .filter(Boolean)
    .filter((p) => p !== '*')
    .sort();
}

(async function main() {
  const base = process.env.SCAN_BASE || 'http://127.0.0.1:8765/aido';
  const routes = getRoutes();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  for (const routePath of routes) {
    const url = `${base}${routePath.startsWith('/') ? routePath : `/${routePath}`}`;
    const errors = [];
    const pageErrors = [];

    const onConsole = (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    };
    const onPageError = (err) => pageErrors.push(String(err));

    page.on('console', onConsole);
    page.on('pageerror', onPageError);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1000);
      results.push({ route: routePath, finalUrl: page.url(), errors, pageErrors });
    } catch (e) {
      results.push({ route: routePath, finalUrl: 'NAVIGATE_FAILED', errors: [String(e)], pageErrors });
    }

    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  }

  await browser.close();

  const external = results.filter((r) => r.finalUrl && r.finalUrl !== 'NAVIGATE_FAILED' && !r.finalUrl.includes('/login?redirect='));

  const summary = {
    scanned: routes.length,
    externalPages: [...new Set(external.map((r) => r.route))],
    externalResults: external,
  };

  fs.writeFileSync('tmp-external-scan.json', JSON.stringify(summary, null, 2));
  console.log('SCANNED', summary.scanned);
  console.log('EXTERNAL_COUNT', summary.externalPages.length);
  for (const p of summary.externalPages) console.log('PAGE', p);
})();
