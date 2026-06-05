import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { environment } from './environments/environment';
const browserDistFolder = join(import.meta.dirname, '../browser');

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

  console.log('--- PROXY DEBUG ---');
  console.log('Token vorhanden:', !!token);
  console.log('Strapi URL:', strapiUrl);
  console.log('Original URL:', req.originalUrl);

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
