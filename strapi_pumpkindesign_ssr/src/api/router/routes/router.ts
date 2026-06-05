module.exports = {
  routes: [
    {
      method: "GET",
      path: "/page-by-path",
      handler: "router.page",
    },
    {
      method: "GET",
      path: "/head",
      handler: "router.header",
    },
    {
      method: "GET",
      path: "/foot",
      handler: "router.footer",
    },
  ],
};
