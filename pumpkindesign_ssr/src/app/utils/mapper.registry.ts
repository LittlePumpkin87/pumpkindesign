import { mapCardData } from "../mapper/card.mapper";
import { mapTextBlockData } from "../mapper/textblock.mapper";

type MapperFunction = (data: any, ...args: any[]) => any;

export const COMPONENT_MAPPERS: Record<string, MapperFunction> = {
  'atoms.textblock': mapTextBlockData,
  'molecules.card-list': mapCardData,
};
