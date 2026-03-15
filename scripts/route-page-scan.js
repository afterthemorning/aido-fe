const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function normalizeRoute(routePath) {
  return routePath
    .replace(/\/:([^/\?]+)\?/g, '/1')
    .replace(/:([^/]+)/g, '1')
    .replace(/\*/g, '')
    .replace(/\/+/g, '/');
}

function extractRoutesFromRouter() {
  const routerFile = path.join(process.cwd(), 'src/routers/index.tsx');
  const source = fs.readFileSync(routerFile, 'utf8');
  const matches = [...source.matchAll(/path='([^']+)'/g)].map((m) => m[1]);

  const routes = [];
  for (const raw of matches) {
    const normalized = normalizeRoute(raw);
    if (!normalized || normalized === '*' || normalized === '/') {
      continue;
    }
    routes.push(normalized.startsWith('/') ? normalized : `/${normalized}`);
  }

  return [...new Set(routes)];
}

(async function main() {
  const base = process.env.SCAN_BASE || 'http://127.0.0.1:8765/aido';
  const routes = extractRoutesFromRouter();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  for (let i = 0; i < routes.length; i += 1) {
    const route = routes[i];
    const targetUrl = `${base}${route}`;
    const consoleErrors = [];
    const pageErrors = [];
    const consoleEntries = [];
    const pageErrorEntries = [];

    const onConsole = (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        const loc = msg.location ? msg.location() : {};
        const entry = {
          type: msg.type(),
          text: msg.text(),
          url: loc?.url || '',
          lineNumber: typeof loc?.lineNumber === 'number' ? loc.lineNumber : null,
          columnNumber: typeof loc?.columnNumber === 'number' ? loc.columnNumber : null,
        };
        consoleEntries.push(entry);
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      }
    };

    const onPageError = (err) => {
      const text = String(err);
      pageErrors.push(text);
      pageErrorEntries.push({ text });
    };

    page.on('console', onConsole);
    page.on('pageerror', onPageError);

    let finalUrl = 'NAVIGATE_FAILED';
    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(900);
      finalUrl = page.url();
    } catch (err) {
      consoleErrors.push(String(err));
    }

    page.off('console', onConsole);
    page.off('pageerror', onPageError);

    const record = {
      index: i + 1,
      total: routes.length,
      route,
      targetUrl,
      finalUrl,
      consoleErrors,
      pageErrors,
      consoleEntries,
      pageErrorEntries,
      accessible: !finalUrl.includes('/login?redirect=') && finalUrl !== 'NAVIGATE_FAILED',
    };

    results.push(record);

    console.log(`VISIT ${record.index}/${record.total} ${route} -> ${finalUrl}`);
  }

  await browser.close();

  const summary = {
    scanned: routes.length,
    accessibleCount: results.filter((r) => r.accessible).length,
    accessibleRoutes: results.filter((r) => r.accessible).map((r) => r.route),
    results,
  };

  fs.writeFileSync('tmp-route-page-scan.json', JSON.stringify(summary, null, 2));
  console.log('SCANNED', summary.scanned);
  console.log('ACCESSIBLE_COUNT', summary.accessibleCount);
  console.log('REPORT_WRITTEN', 'tmp-route-page-scan.json');
})();
