"use strict";

declare const console: any;

function getFieldPopulate(attr: any, maxDepth: number, currentDepth: number): any {
  if (attr.type === "component") {
    const childPopulate = getAutoPopulate(attr.component, maxDepth, currentDepth + 1);
    return { populate: childPopulate };
  }

  if (attr.type === "dynamiczone") {
    const dynamicZoneComponents: any = {};
    if (Array.isArray(attr.components)) {
      for (const compUid of attr.components) {
        const childPopulate = getAutoPopulate(compUid, maxDepth, currentDepth + 1);
        dynamicZoneComponents[compUid] = childPopulate
          ? { populate: childPopulate }
          : { populate: "*" };
      }
    }
    return { on: dynamicZoneComponents };
  }

  if (attr.type === "media") {
    return true;
  }

  if (attr.type === "relation") {
    if (attr.target === "api::skill.skill") {
      return {
        populate: {
          logo: true,
          subskills: {
            populate: ["logo"],
          },
        },
      };
    }
    return true;
  }

  return undefined;
}

function getAutoPopulate(uid: string, maxDepth = 8, currentDepth = 1): any {
  if (currentDepth > maxDepth) return undefined;

  const model = strapi.contentTypes[uid] || strapi.components[uid];
  if (!model?.attributes) {
    return currentDepth === 1 ? "*" : undefined;
  }

  const populate: any = {};
  let hasNestedFields = false;

  const attributes = model.attributes as Record<string, any>;
  for (const [key, attr] of Object.entries(attributes)) {
    const fieldPopulate = getFieldPopulate(attr, maxDepth, currentDepth);
    if (fieldPopulate !== undefined) {
      populate[key] = fieldPopulate;
      hasNestedFields = true;
    }
  }

  if (!hasNestedFields) {
    return currentDepth === 1 ? "*" : undefined;
  }

  return populate;
}

function cleanData(data: any, isRoot = true): any {
  if (Array.isArray(data)) {
    return data.map((item) => cleanData(item, false));
  }

  if (data !== null && typeof data === "object") {
    if (data.url && data.mime && data.provider) {
      return {
        url: data.url,
        alternativeText: data.alternativeText || "",
        ext: data.ext,
        size: data.size,
        width: data.width,
        height: data.height,
      };
    }
    if (!isRoot && data.path && data.documentId && data.seo_title !== undefined) {
      return {
        path: `/${data.path}`,
      };
    }
    delete data.createdBy;
    delete data.updatedBy;
    for (const key in data) {
      data[key] = cleanData(data[key], false);
    }
    return data;
  }

  return data;
}

export default {
  async page(ctx: any) {
    try {
      const searchPath = ctx.query.path || "/";

      if (searchPath === "/") {
        const startpageUid = "api::startpage.startpage";
        const startpage = await strapi.documents(startpageUid).findFirst({
          populate: getAutoPopulate(startpageUid),
        });

        if (!startpage) return ctx.notFound("Startpage not found");
        return ctx.send({ data: cleanData(startpage), type: "startpage" });
      }

      const pageUid = "api::page.page";

      const pages = await strapi.documents(pageUid).findMany({
        filters: {
          path: {
            $eq: searchPath,
          },
        } as any,
        populate: getAutoPopulate(pageUid),
      });

      if (!pages || pages.length === 0) {
        return ctx.notFound(`Page with path '${searchPath}' not found`);
      }

      return ctx.send({ data: cleanData(pages[0]), type: "page" });
    } catch (err) {
      console.error("Router Error:", err);
      ctx.internalServerError("An error occurred in the router API", err);
    }
  },

  async header(ctx: any) {
    try {
      const headerUid = "api::header.header";
      const header = await strapi.documents(headerUid).findFirst({
        populate: getAutoPopulate(headerUid),
      });

      if (!header) return ctx.notFound("Header not found");
      return ctx.send({ data: cleanData(header), type: "header" });
    } catch (err) {
      console.error("Header Error:", err);
      ctx.internalServerError("An error occurred in the header API", err);
    }
  },
  async footer(ctx: any) {
    try {
      const footerUid = "api::footer.footer";
      const footer = await strapi.documents(footerUid).findFirst({
        populate: getAutoPopulate(footerUid),
      });

      if (!footer) return ctx.notFound("Header not found");
      return ctx.send({ data: cleanData(footer), type: "header" });
    } catch (err) {
      console.error("Header Error:", err);
      ctx.internalServerError("An error occurred in the header API", err);
    }
  },
};
