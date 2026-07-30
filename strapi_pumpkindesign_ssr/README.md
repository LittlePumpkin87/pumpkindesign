# 🚀 Strapi CMS — littlepumpkindesign.de

Strapi 5 headless CMS behind [littlepumpkindesign.de](https://littlepumpkindesign.de).
It is not consumed directly by the frontend — every content request goes through the
[NestJS content cache](../pumpkin_api/) first.

## What is specific to this project

* **Custom router controller** (`src/api/router/controllers/router.ts`) backs the endpoints the
  frontend actually calls: `page-by-path`, `head` and `foot`. `getAutoPopulate()` resolves relations
  recursively up to depth 8, so a page arrives with its whole dynamic zone in one response, and
  `cleanData()` strips the payload down to the fields the frontend needs.
* **That depth is why the cache exists.** The populate query is expensive enough that running it on
  every page view was the original performance problem — see
  [`pumpkin_api/docs/ARCHITEKTUR.md`](../pumpkin_api/docs/ARCHITEKTUR.md).
* **Cache invalidation webhook.** Under **Settings → Webhooks** one webhook points at
  `http://pumpkin_api:3000/api/cache/invalidate` with the header `X-Webhook-Secret`, subscribed to
  `entry.publish`, `entry.unpublish`, `entry.update` and `entry.delete`. Without it the cache still
  self-heals via TTL, just up to an hour later.
* **Plugins in use:** navigation (main menu tree), populate-deep, config-sync, seo.

> ⚠️ The navigation plugin does not reliably emit `entry.*` events, so the navigation tree is not
> covered by the webhook and falls back to a shorter TTL in the cache service.

## Strapi CLI

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
