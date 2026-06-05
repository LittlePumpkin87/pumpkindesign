module.exports = {
  routes: [
    {
      method: "GET",
      path: "/page-by-path",
      handler: "router.page",
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/head",
      handler: "router.header",
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/foot",
      handler: "router.footer",
      config: {
        auth: false,
      },
    },
  ],
};
