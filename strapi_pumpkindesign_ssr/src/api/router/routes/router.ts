module.exports = {
  routes: [
    {
      method: "GET",
      path: "/page-by-path",
      handler: "router.page",
      config: {
        auth: false,
      },
    }
  ],
};
