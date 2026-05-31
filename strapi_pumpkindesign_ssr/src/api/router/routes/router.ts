module.exports = {
  routes: [
    {
      method: "GET",
      path: "/router",
      handler: "router.findBySlug",
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/navigation',
      handler: 'router.getNavigation',
      config: { auth: false },
    },
  ],
};
