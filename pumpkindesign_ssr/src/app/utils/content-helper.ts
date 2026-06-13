import { environment } from '../../environments/environment';
import { Icon } from '../interfaces/atom.interface';

const isProd = process.env['NODE_ENV'] === 'production';

// --- Helper functions for mapper ---

export const getImageUrl = (imageData: any): string | undefined => {
  if (!imageData) {
    return undefined;
  }
  let url = imageData.url;

  if (isProd) {
    return `/api${url}`;
  }

  return `http://localhost:6466${url}`;
};

export const getIconData = (iconData: any): Icon | undefined => {
  if (!iconData?.name) {
    return undefined;
  }
  return {
    name: iconData.name,
    prefix: iconData.prefix || 'fas',
    color: iconData.color || undefined,
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
  url = `/api${url}`;

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
          const icon = getIconData(rawLink);
          result = {
            href: `${pathname}${search}`,
            fragment,
            isInternal: true,
            isExternal: false,
            icon,
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
  if (!item) return undefined;

  if (item.href !== undefined && item.isExternal !== undefined) {
    return item;
  }

  const rawLinkType = item.type || item.linkType || item.linktype;
  if (!rawLinkType) return undefined;
  
  const normalizedLinkType = rawLinkType.toLowerCase();
  let dataNode = item[normalizedLinkType] || item;

  if (Array.isArray(dataNode)) {
    if (dataNode.length === 0) return undefined;
    dataNode = dataNode[0];
  }

  if (!dataNode) return undefined;

  const rawLink = dataNode.link || dataNode.url || dataNode.page || dataNode.path || dataNode;
  
  if (!rawLink) return undefined;

  const targetData = resolveLinkTarget(normalizedLinkType, rawLink);
  
  if (!targetData) return undefined;
  if (!targetData.href && targetData.linktype !== 'disabled') return undefined;

  let linkIcon = getIconData(dataNode.icon);
  
  if (!linkIcon && item.additionalFields?.iconName) {
    linkIcon = {
      name: item.additionalFields.iconName,
      prefix: item.additionalFields.iconPrefix,
      color: undefined,
    };
  }

  const finalMappedLink = {
    label: targetData.label || dataNode.label || dataNode.linkText || item.title,
    href: targetData.href,
    isExternal: targetData.isExternal,
    isInternal: targetData.isInternal,
    link_style: item.link_style || item.additionalFields?.link_style || 'textlink',
    button_style: item.button_style,
    fragment: targetData.fragment,
    linktype: targetData.linktype || normalizedLinkType,
    icon: linkIcon,
    icon_position: dataNode.icon_position || item.additionalFields?.icon_position,
  };

  return finalMappedLink;
};

export const getLinkData = (item: any) => {
  if (!item) return undefined;

  if (Array.isArray(item)) {
    return item.length > 0 ? mapSingleLink(item[0]) : undefined;
  }

  const linkArraySource = item.link || item.links;
  if (Array.isArray(linkArraySource)) {
    return linkArraySource.length > 0 ? mapSingleLink(linkArraySource[0]) : undefined;
  }
  return mapSingleLink(item);
};
