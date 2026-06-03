import { Type } from '@angular/core';
import { Textblock } from '../components/atoms/textblock/textblock';

export const ComponentRegistry: Record<string, Type<any>> = {
  'content.text-block': Textblock,
};
