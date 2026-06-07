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

app.use('*', (req, res, next) =>
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

        const newResponse = new Response(html, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
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
          `font-src 'self' data: https://fonts.gstatic.com; ` +
          `connect-src 'self' https://littlepumpkindesign.de https://www.littlepumpkindesign.de; ` +
          `frame-src 'self'; ` +
          `frame-ancestors 'self'`
        );

        return writeResponseToNodeResponse(newResponse, res);
      } 
      
      else {
        return writeResponseToNodeResponse(response, res);
      }
    })
    .catch(next),
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
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
