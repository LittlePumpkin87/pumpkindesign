# PumpkindesignSsr

Angular 21 SSR frontend of [littlepumpkindesign.de](https://littlepumpkindesign.de).
Generated with [Angular CLI](https://github.com/angular/angular-cli) 21.2.12.

## What is specific to this project

* **Server entry points.** [`src/main.server.ts`](src/main.server.ts) bootstraps the SSR app;
  [`src/server.ts`](src/server.ts) is the Express host. Besides rendering it serves the static assets,
  builds `/sitemap.xml` from the Strapi navigation tree, injects a per-request CSP nonce, and proxies
  `/api` onward to the NestJS content cache (`BASE_PATH_STRAPI`).
* **Every route is server-rendered.** [`src/app/app.routes.server.ts`](src/app/app.routes.server.ts)
  maps `**` to `RenderMode.Server` — nothing is prerendered, because the routes only exist in Strapi.
* **Dynamic zone rendering.** CMS content is rendered through a component registry:
  [`utils/component.registry.ts`](src/app/utils/component.registry.ts) maps a Strapi `__component` key
  to an Angular component, [`utils/mapper.registry.ts`](src/app/utils/mapper.registry.ts) maps the
  payload to its inputs, and [`utils/dynamic-render.directive.ts`](src/app/utils/dynamic-render.directive.ts)
  instantiates it via `ViewContainerRef`.
* **Hydration and the transfer cache.** `provideClientHydration(withEventReplay())` is on. For the
  HTTP transfer cache to actually hit, server and browser have to produce the *same* cache key — the
  key contains the request URL. The browser therefore builds an absolute API URL from
  `location.origin` ([`utils/api-base.token.ts`](src/app/utils/api-base.token.ts)), while the server
  fetches via loopback and rewrites the origin through `HTTP_TRANSFER_CACHE_ORIGIN_MAP`
  ([`app.config.server.ts`](src/app/app.config.server.ts)). Break that pairing and the browser silently
  refetches every endpoint after hydration, which throws away the server-rendered DOM.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://127.0.0.1:4200/`. The application will automatically reload whenever you modify any of the source files.

For the full stack including Strapi and the cache service, use `docker compose -f ../docker-compose.dev.yml up` instead.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
