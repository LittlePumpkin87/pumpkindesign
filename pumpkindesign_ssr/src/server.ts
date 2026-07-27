import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import crypto from 'node:crypto';

import { environment } from './environments/environment';
const browserDistFolder = join(import.meta.dirname, '../browser');
const isProd = process.env['NODE_ENV'] === 'production';

const app = express();
const allowedHosts = environment.ALLOWED_HOSTS;
const angularApp = new AngularNodeAppEngine({
  allowedHosts: allowedHosts,
  trustProxyHeaders: ['x-forwarded-host', 'x-forwarded-proto', 'x-forwarded-for'],
});
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);


app.use('/api', async (req, res) => {
  const token = process.env['STRAPI_API_TOKEN'];
  const strapiUrl = process.env['BASE_PATH_STRAPI'];

  const targetUrl = `${strapiUrl}${req.originalUrl}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: `Strapi responded with status ${response.status}` });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Error proxying request to Strapi:', error);
    return res.status(500).json({ error: 'Internal server error while connecting to the CMS.' });
  }
});


// --- SITEMAP ---
// Dynamically built from the existing Strapi navigation tree
// (GET /api/navigation/render/main?type=TREE). No extra Strapi endpoint required.
interface SitemapNode {
  path?: string;
  type?: string;
  related?: { updatedAt?: string; meta_robots?: string | null };
  items?: SitemapNode[];
}

interface SitemapUrl {
  loc: string;
  lastmod?: string;
}

function collectSitemapUrls(nodes: SitemapNode[], baseUrl: string, acc: SitemapUrl[]): void {
  for (const node of nodes ?? []) {
    const robots = node.related?.meta_robots?.trim().toLowerCase();
    const isIndexable = !robots?.startsWith('noindex');
    if (node.type === 'INTERNAL' && node.path && isIndexable) {
      acc.push({ loc: `${baseUrl}${node.path}`, lastmod: node.related?.updatedAt });
    }
    if (node.items?.length) {
      collectSitemapUrls(node.items, baseUrl, acc);
    }
  }
}

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function buildSitemapXml(urls: SitemapUrl[]): string {
  const body = urls
    .map(({ loc, lastmod }) => {
      const lastmodTag = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n  </url>`;
    })
    .join('\n');
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  );
}

app.get('/sitemap.xml', async (_req, res) => {
  const token = process.env['STRAPI_API_TOKEN'];
  const strapiUrl = process.env['BASE_PATH_STRAPI'];
  const baseUrl = environment.BASE_URL.startsWith('http')
    ? environment.BASE_URL
    : `https://${environment.BASE_URL}`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  try {
    const response = await fetch(`${strapiUrl}/api/navigation/render/main?type=TREE`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Strapi navigation responded with status ${response.status}`);
    }

    const tree = (await response.json()) as SitemapNode[];
    const urls: SitemapUrl[] = [];
    collectSitemapUrls(tree, baseUrl, urls);

    if (urls.length === 0) {
      urls.push({ loc: `${baseUrl}/` });
    }

    return res.send(buildSitemapXml(urls));
  } catch (error) {
    console.error('Error building sitemap.xml:', error);
    // Do not block crawlers with a 500 — serve a minimal valid sitemap.
    return res.status(200).send(buildSitemapXml([{ loc: `${baseUrl}/` }]));
  }
});


app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then(async (response) => {
      if (!response) {
        return next();
      }

      if (isProd) {
        const nonce = crypto.randomBytes(16).toString('base64');
        let html = await response.text();

        if (html.includes('randomNonceGoesHere')) {
          html = html.replaceAll('randomNonceGoesHere', nonce);
        }

        const newHeaders = new Headers(response.headers);
        newHeaders.delete('content-length');

        const newResponse = new Response(html, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });

        res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('X-XSS-Protection', '1; mode=block');

        res.setHeader(
          'Content-Security-Policy',
          `base-uri 'self'; ` +
            `default-src 'self'; ` +
            `script-src 'self' 'nonce-${nonce}'; ` +
            `style-src 'self' 'unsafe-inline'; ` +
            `img-src 'self' data: https://littlepumpkindesign.de https://www.littlepumpkindesign.de; ` +
            `font-src 'self' data:; ` +
            `connect-src 'self' https://littlepumpkindesign.de https://www.littlepumpkindesign.de; ` +
            `frame-src 'self'; ` +
            `frame-ancestors 'self'`,
        );

        return writeResponseToNodeResponse(newResponse, res);
      } else {
        return writeResponseToNodeResponse(response, res);
      }
    })
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4200;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
