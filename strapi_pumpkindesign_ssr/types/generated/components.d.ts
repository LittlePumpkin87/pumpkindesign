import type { Schema, Struct } from '@strapi/strapi';

export interface AtomsTextblock extends Struct.ComponentSchema {
  collectionName: 'components_atoms_textblocks';
  info: {
    displayName: 'textblock';
  };
  attributes: {};
}

export interface MoleculesCard extends Struct.ComponentSchema {
  collectionName: 'components_molecules_cards';
  info: {
    displayName: 'card';
  };
  attributes: {};
}

export interface MoleculesCta extends Struct.ComponentSchema {
  collectionName: 'components_molecules_ctas';
  info: {
    displayName: 'cta';
  };
  attributes: {
    email: Schema.Attribute.Component<'technical.email-link', false>;
    external: Schema.Attribute.Component<'technical.external-link', true>;
    icon: Schema.Attribute.Component<'technical.icon-link', false>;
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

export interface OrganismsCertificates extends Struct.ComponentSchema {
  collectionName: 'components_organisms_certificate';
  info: {
    displayName: 'certificates';
  };
  attributes: {};
}

export interface OrganismsHero extends Struct.ComponentSchema {
  collectionName: 'components_organisms_heroes';
  info: {
    displayName: 'hero';
  };
  attributes: {
    background: Schema.Attribute.Media<'images' | 'files'>;
    cta: Schema.Attribute.Component<'molecules.cta', false>;
    headline: Schema.Attribute.String;
  };
}

export interface OrganismsResume extends Struct.ComponentSchema {
  collectionName: 'components_organisms_resumes';
  info: {
    displayName: 'timeline';
  };
  attributes: {};
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
    label: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface TechnicalIconLink extends Struct.ComponentSchema {
  collectionName: 'components_technical_icon_links';
  info: {
    displayName: 'icon  link';
  };
  attributes: {
    icon_name: Schema.Attribute.String;
    icon_prefix: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface TechnicalInternalLink extends Struct.ComponentSchema {
  collectionName: 'components_technical_internal_links';
  info: {
    displayName: 'internal  link';
  };
  attributes: {
    label: Schema.Attribute.String;
    navigation_audience: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::navigation.audience'
    >;
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

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'atoms.textblock': AtomsTextblock;
      'molecules.card': MoleculesCard;
      'molecules.cta': MoleculesCta;
      'organisms.certificates': OrganismsCertificates;
      'organisms.hero': OrganismsHero;
      'organisms.resume': OrganismsResume;
      'technical.email-link': TechnicalEmailLink;
      'technical.external-link': TechnicalExternalLink;
      'technical.icon-link': TechnicalIconLink;
      'technical.internal-link': TechnicalInternalLink;
      'technical.phone-link': TechnicalPhoneLink;
    }
  }
}
