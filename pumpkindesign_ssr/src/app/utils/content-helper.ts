import { environment } from '../../environments/environment';
import { Icon } from '../interfaces/atom.interface';

// --- Helper functions for mapper ---

export const getImageUrl = (imageData: any): string | undefined => {
  if (!imageData) {
    return undefined;
  }
  let url = imageData.url;
  if (!url) {
    return undefined;
  }
  const isAbsolute = url.startsWith('http');
  if (!isAbsolute) {
    url = `${environment.API_IMAGE_URL}${url}`;
  }
  return url;
};

export const getIconData = (iconData: any): Icon | undefined => {
  if (!iconData) {
    return undefined;
  }
  let name = iconData.name;
  let prefix = iconData.prefix;
  let color = iconData.color;

  return {
    name,
    color,
    prefix,
  };
};

export const getFileData = (fileData: any) => {
  if (!fileData) {
    return undefined;
  }
  let url = fileData.url || fileData.file?.url;
  let fileSize = fileData.size;
  let fileType = fileData.ext;

  if (!url) {
    return undefined;
  }

  const isAbsolute = url.startsWith('http');
  if (!isAbsolute) {
    url = `${environment.API_URL}/files/file?path=${url}`;
  }
  if (fileType) {
    fileType = fileType.startsWith('.') ? fileType.substring(1) : fileType;
    fileType = fileType.toUpperCase();
  }
  if (fileSize && typeof fileSize === 'number') {
    if (fileSize >= 1048576) {
      fileSize = (fileSize / 1048576).toFixed(2) + ' GB';
    } else if (fileSize >= 1024) {
      fileSize = (fileSize / 1024).toFixed(2) + ' MB';
    } else {
      fileSize = fileSize.toFixed(2) + ' KB';
    }
  }

  return { url, fileSize, fileType };
};

function escapeHtml(unsafe: string): string {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

//Helper internal or external richtext links

const basePath = environment.BASE_URL;

const getHostname = (url: string): string | null => {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    return new URL(normalized).host;
  } catch {
    return null;
  }
};

const baseHostname = getHostname(basePath);

const isExternalUrl = (url: string): boolean => {
  const isAbsolute =
    url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.');

  if (!isAbsolute) return false;

  const urlHostname = getHostname(url);

  if (!urlHostname || !baseHostname) return true;

  return urlHostname !== baseHostname;
};

const isPhoneLink = (url: string): boolean => {
  return url.startsWith('+') || url.startsWith('00');
};

const isEmailLink = (url: string): boolean => {
  return url.includes('@');
};

const serializeTextNode = (node: any): string => {
  let text = escapeHtml(node.text);
  if (node.bold) text = `<strong>${text}</strong>`;
  if (node.italic) text = `<em>${text}</em>`;
  if (node.underline) text = `<u>${text}</u>`;
  if (node.strikethrough) text = `<s>${text}</s>`;
  if (node.code) text = `<code>${text}</code>`;
  return text;
};

const serializeLinkNode = (node: any, children: string): string => {
  let href = node.url || '';
  const routerlink = node.url || '';
  const isExternal = isExternalUrl(href);
  if (isEmailLink(href) && !href.startsWith('mailto:')) {
    href = `mailto:${href}`;
  } else if (isPhoneLink(href) && !href.startsWith('tel:')) {
    href = `tel:${href}`;
  }

  const target = isExternal ? '_blank' : '_self';

  return `<a class="link link--inline" href="${href}" [attr.routerlink]="${routerlink}" target="${target}" rel="noopener noreferrer">${children}</a>`;
};
const serializeBlockNode = (node: any): string => {
  const children = node.children ? serializeRichText(node.children) : '';

  switch (node.type) {
    case 'heading': {
      const level = node.level === 1 ? 2 : node.level;
      return `<h${level}>${children}</h${level}>`;
    }
    case 'paragraph':
      return children ? `<p>${children}</p>` : '<p aria-hidden="true">&nbsp;</p>';
    case 'link':
      return serializeLinkNode(node, children);
    case 'list': {
      const isOrdered = node.format === 'ordered';
      const tag = isOrdered ? 'ol' : 'ul';
      const cssClass = isOrdered ? 'list-numbered' : 'list-checkmark';
      return `<${tag} class="${cssClass}">${children}</${tag}>`;
    }
    case 'list-item':
      return `<li>${children}</li>`;
    case 'quote':
      return `<blockquote>${children}</blockquote>`;
    default:
      return children;
  }
};

// --- RICHTEXT MAPPING ---

export const serializeRichText = (nodes: any[] | object): string => {
  if (!nodes || !Array.isArray(nodes)) {
    return '';
  }

  return nodes
    .map((node) => {
      if (node.text !== undefined) {
        return serializeTextNode(node);
      }
      return serializeBlockNode(node);
    })
    .join('');
};

// helper for Link mapping

const resolveLinkTarget = (linktype: string, rawLink: any) => {
  let result = null;
  switch (linktype) {
    case 'internal':
      if (rawLink?.path) {
        result = {
          href: `${rawLink.path}`,
          isInternal: true,
          isExternal: false,
        };
      } else {
        result = {
          href: undefined,
          label: 'Invalid link target',
          linktype: 'disabled',
        };
      }
      break;

    case 'external':
      if (typeof rawLink === 'string' && rawLink.trim() !== '') {
        const urlHostname = getHostname(rawLink);
        const isSameHost = !!urlHostname && !!baseHostname && urlHostname === baseHostname;

        if (isSameHost) {
          const { pathname, search, hash } = new URL(rawLink);
          const fragment = hash.startsWith('#') ? hash.substring(1) : undefined;

          result = {
            href: `${pathname}${search}`,
            fragment,
            isInternal: true,
            isExternal: false,
          };
        } else {
          result = {
            href: rawLink,
            isInternal: false,
            isExternal: true,
          };
        }
      }
      break;

    case 'phone':
      result = {
        href: `tel:${rawLink.replaceAll(/\s/g, '')}`,
        isInternal: false,
        isExternal: false,
      };
      break;

    case 'email':
      result = {
        href: `mailto:${rawLink}`,
        isInternal: false,
        isExternal: false,
      };
      break;
  }
  return result;
};

// --- LINK MAPPING ---

const mapSingleLink = (item: any) => {
  if (!item) {
    return undefined;
  }

  const linkType = item.type || item.linkType || item.linktype;

  if (!linkType) {
    return undefined;
  }

  let activeDataNode = null;
  if (['internal', 'external', 'phone', 'email'].includes(linkType)) {
    activeDataNode = item[linkType];
  }

  if (!activeDataNode || (Array.isArray(activeDataNode) && activeDataNode.length === 0)) {
    return undefined;
  }

  const rawLink =
    activeDataNode.link || activeDataNode.url || activeDataNode.page || activeDataNode;

  if (!rawLink) {
    return undefined;
  }

  const targetData = resolveLinkTarget(linkType, rawLink);

  if (!targetData) {
    return undefined;
  }

  if (!targetData.href && targetData.linktype !== 'disabled') {
    return undefined;
  }

  const finalMappedLink = {
    label: targetData.label || activeDataNode.label || activeDataNode.linkText,
    href: targetData.href,
    isExternal: targetData.isExternal,
    isInternal: targetData.isInternal,
    link_style: item.link_style,
    fragment: targetData.fragment,
    linktype: targetData.linktype,
  };

  return finalMappedLink;
};

export const getLinkData = (item: any) => {
  if (!item) {
    return undefined;
  }

  const linkArraySource = item.link || item.links;

  if (Array.isArray(linkArraySource)) {
    const validLinks = linkArraySource
      .map((link: any, index: number) => {
        return mapSingleLink(link);
      })
      .filter((l: any) => {
        const isValid = l !== undefined;
        return isValid;
      });

    return validLinks.length > 0 ? validLinks : undefined;
  }

  const singleLinkResult = mapSingleLink(item);

  return singleLinkResult;
};
