import type { Schema, Struct } from '@strapi/strapi';

export interface AtomsTextblock extends Struct.ComponentSchema {
  collectionName: 'components_atoms_textblocks';
  info: {
    displayName: 'textblock';
  };
  attributes: {
    format: Schema.Attribute.Enumeration<['H1', 'H2', 'H3', 'H4', 'H5', 'H6']>;
    headline: Schema.Attribute.String;
    subline: Schema.Attribute.String;
    text: Schema.Attribute.Blocks;
    text_centered: Schema.Attribute.Boolean;
  };
}

export interface MoleculesCard extends Struct.ComponentSchema {
  collectionName: 'components_molecules_cards';
  info: {
    displayName: 'card';
  };
  attributes: {
    cta: Schema.Attribute.Component<'molecules.cta', false>;
    date: Schema.Attribute.Date;
    headline: Schema.Attribute.String;
    icon: Schema.Attribute.Component<'technical.icon', false>;
    image: Schema.Attribute.Media<'images'>;
    subline: Schema.Attribute.String;
    text: Schema.Attribute.Blocks;
    variant: Schema.Attribute.Enumeration<
      ['full', 'simple', 'contact', 'reference']
    >;
  };
}

export interface MoleculesCardList extends Struct.ComponentSchema {
  collectionName: 'components_molecules_card_lists';
  info: {
    displayName: 'card_list';
  };
  attributes: {
    card_item: Schema.Attribute.Component<'molecules.card', true>;
  };
}

export interface MoleculesCta extends Struct.ComponentSchema {
  collectionName: 'components_molecules_ctas';
  info: {
    displayName: 'cta';
  };
  attributes: {
    email: Schema.Attribute.Component<'technical.email-link', false>;
    external: Schema.Attribute.Component<'technical.external-link', true>;
    internal: Schema.Attribute.Component<'technical.internal-link', false>;
    link_style: Schema.Attribute.Enumeration<
      ['button', 'textlink', 'icon_right', 'icon_left']
    >;
    linktype: Schema.Attribute.Enumeration<
      ['external', 'internal', 'phone', 'email', 'icon']
    > &
      Schema.Attribute.DefaultTo<'internal'>;
    phone: Schema.Attribute.Component<'technical.phone-link', false>;
  };
}

export interface MoleculesFooterColumn extends Struct.ComponentSchema {
  collectionName: 'components_molecules_footer_columns';
  info: {
    displayName: 'footer_column';
  };
  attributes: {
    cta: Schema.Attribute.Component<'molecules.cta', true> &
      Schema.Attribute.SetMinMax<
        {
          max: 5;
        },
        number
      >;
  };
}

export interface OrganismsCertificate extends Struct.ComponentSchema {
  collectionName: 'components_organisms_certificate';
  info: {
    displayName: 'certificate';
  };
  attributes: {
    certificate_item: Schema.Attribute.Component<
      'technical.certificate-item',
      true
    >;
  };
}

export interface OrganismsHero extends Struct.ComponentSchema {
  collectionName: 'components_organisms_heroes';
  info: {
    displayName: 'hero';
  };
  attributes: {
    background: Schema.Attribute.Media<'images'>;
    cta: Schema.Attribute.Component<'molecules.cta', false>;
    headline: Schema.Attribute.String;
    subline: Schema.Attribute.String;
    text: Schema.Attribute.Blocks;
  };
}

export interface OrganismsTimeline extends Struct.ComponentSchema {
  collectionName: 'components_organisms_timelines';
  info: {
    displayName: 'timeline';
  };
  attributes: {
    timeline_item: Schema.Attribute.Component<'technical.timeline-item', true>;
  };
}

export interface TechnicalCertificateItem extends Struct.ComponentSchema {
  collectionName: 'components_technical_certificate_items';
  info: {
    displayName: 'certificate_item';
  };
  attributes: {
    file: Schema.Attribute.Media<'files'>;
    label: Schema.Attribute.String;
  };
}

export interface TechnicalEmailLink extends Struct.ComponentSchema {
  collectionName: 'components_technical_email_links';
  info: {
    displayName: 'email  link';
  };
  attributes: {
    email: Schema.Attribute.String;
    label: Schema.Attribute.String;
  };
}

export interface TechnicalExternalLink extends Struct.ComponentSchema {
  collectionName: 'components_technical_external_links';
  info: {
    displayName: 'external link';
  };
  attributes: {
    icon: Schema.Attribute.Component<'technical.icon', false>;
    icon_position: Schema.Attribute.Enumeration<['left', 'right']>;
    label: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface TechnicalIcon extends Struct.ComponentSchema {
  collectionName: 'components_technical_icons';
  info: {
    displayName: 'icon';
  };
  attributes: {
    color: Schema.Attribute.String &
      Schema.Attribute.CustomField<'plugin::color-picker.color'>;
    name: Schema.Attribute.String;
    prefix: Schema.Attribute.String;
  };
}

export interface TechnicalIconLink extends Struct.ComponentSchema {
  collectionName: 'components_technical_icon_links';
  info: {
    displayName: 'icon  link';
  };
  attributes: {
    icon: Schema.Attribute.Component<'technical.icon', false>;
    page: Schema.Attribute.Relation<'oneToOne', 'api::page.page'>;
    type: Schema.Attribute.Enumeration<['internal', 'external']>;
    url: Schema.Attribute.String;
  };
}

export interface TechnicalInternalLink extends Struct.ComponentSchema {
  collectionName: 'components_technical_internal_links';
  info: {
    displayName: 'internal  link';
  };
  attributes: {
    icon: Schema.Attribute.Component<'technical.icon', false>;
    icon_position: Schema.Attribute.Enumeration<['left', 'right']>;
    label: Schema.Attribute.String;
    page: Schema.Attribute.Relation<'oneToOne', 'api::page.page'>;
  };
}

export interface TechnicalPhoneLink extends Struct.ComponentSchema {
  collectionName: 'components_technical_phone_links';
  info: {
    displayName: 'phone link';
  };
  attributes: {
    label: Schema.Attribute.String;
    phone_number: Schema.Attribute.String;
  };
}

export interface TechnicalSeparator extends Struct.ComponentSchema {
  collectionName: 'components_technical_separators';
  info: {
    displayName: 'separator';
  };
  attributes: {
    forcedPrimary: Schema.Attribute.Boolean;
    section_id: Schema.Attribute.String;
  };
}

export interface TechnicalTimelineItem extends Struct.ComponentSchema {
  collectionName: 'components_technical_timeline_items';
  info: {
    displayName: 'timeline_item';
  };
  attributes: {
    headline: Schema.Attribute.String;
    long_description: Schema.Attribute.Blocks;
    short_description: Schema.Attribute.Text;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'atoms.textblock': AtomsTextblock;
      'molecules.card': MoleculesCard;
      'molecules.card-list': MoleculesCardList;
      'molecules.cta': MoleculesCta;
      'molecules.footer-column': MoleculesFooterColumn;
      'organisms.certificate': OrganismsCertificate;
      'organisms.hero': OrganismsHero;
      'organisms.timeline': OrganismsTimeline;
      'technical.certificate-item': TechnicalCertificateItem;
      'technical.email-link': TechnicalEmailLink;
      'technical.external-link': TechnicalExternalLink;
      'technical.icon': TechnicalIcon;
      'technical.icon-link': TechnicalIconLink;
      'technical.internal-link': TechnicalInternalLink;
      'technical.phone-link': TechnicalPhoneLink;
      'technical.separator': TechnicalSeparator;
      'technical.timeline-item': TechnicalTimelineItem;
    }
  }
}
