import { CTA, Icon } from "./atom.interface";

export interface Card {
    variant: string;
    headline?: string;
    subline?: string;
    date?: string;
    imgSrc?: string;
    imgAlt?: string;
    icon?: Icon;
    text?: string;
    cta?: CTA;
}