import { CTA } from "./atom.interface";

export interface TextImageItem {
    imgSrc?: string;
    imgAlt?: string;
    cta: CTA[];
    text: string;
    headline: string;
    subline: string;
    image_position: 'right' | 'left';    
}