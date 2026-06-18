import { mapCardData } from '../mapper/card.mapper';
import { mapSpiderwebData } from '../mapper/spiderweb.mapper';
import { mapTextImageData } from '../mapper/text-image.mapper';
import { mapTextBlockData } from '../mapper/textblock.mapper';

type MapperFunction = (data: any, ...args: any[]) => any;

export const COMPONENT_MAPPERS: Record<string, MapperFunction> = {
  'atoms.textblock': mapTextBlockData,
  'molecules.card-list': mapCardData,
  'organisms.image-text': mapTextImageData,
  'organisms.spider-tech-web': mapSpiderwebData,
};
