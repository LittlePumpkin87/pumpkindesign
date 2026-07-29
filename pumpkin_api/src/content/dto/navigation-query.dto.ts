import { IsIn, IsOptional } from 'class-validator';

export class NavigationQueryDto {
  /** Render format of the Strapi navigation plugin. The frontend asks for TREE. */
  @IsOptional()
  @IsIn(['TREE', 'FLAT', 'RFR'])
  type: string = 'TREE';
}
