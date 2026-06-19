import { Skill } from '../interfaces/organism.interface';
import { getImageUrl } from '../utils/content-helper';

const DEFAULT_X = 185.25;
const DEFAULT_Y = 183.45;

function parsePathIds(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

export function mapSpiderwebData(rawData: any): { skills: Skill[] } {
  const data = rawData?.skills ? rawData.skills : Array.isArray(rawData) ? rawData : [];

  if (!data || !Array.isArray(data)) {
    return { skills: [] };
  }

  const mappedSkills = data.map((item) => {
    const hasSubskills = Array.isArray(item.subskills) && item.subskills.length > 0;

    return {
      name: item.name || '',
      description: item.description || '',
      posX: item.position_x !== null ? Number(item.position_x) : DEFAULT_X,
      posY: item.position_y !== null ? Number(item.position_y) : DEFAULT_Y,
      isMainSkill: item.isMainSkill !== undefined ? item.isMainSkill : hasSubskills,
      connectedPathIds: item.connectedPathIds || '',
      glowPathIds: parsePathIds(item.glowPathIds),
      subskills: item.subskills ? mapSubskills(item.subskills) : [],
      imgSrc: item.logo ? getImageUrl(item.logo) : undefined,
      imgAlt: item.logo?.AlternateText || '',
    };
  });
  return {
    skills: mappedSkills,
  };
}

function mapSubskills(subskillsData: any[]): Skill[] {
  if (!subskillsData || !Array.isArray(subskillsData)) return [];

  return subskillsData.map((sub) => ({
    name: sub.name || '',
    description: sub.description || '',
    posX: sub.position_x !== null ? Number(sub.position_x) : DEFAULT_X,
    posY: sub.position_y !== null ? Number(sub.position_y) : DEFAULT_Y,
    isMainSkill: false,
    imgSrc: sub.logo ? getImageUrl(sub.logo) : undefined,
    imgAlt: sub.logo?.AlternateText || '',
    connectedPathIds: sub.connectedPathIds || '',
    glowPathIds: parsePathIds(sub.glowPathIds),
    subskills: [],
  }));
}
