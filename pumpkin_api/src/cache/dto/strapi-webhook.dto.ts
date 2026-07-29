import { IsOptional, IsString } from 'class-validator';

/**
 * The parts of Strapi's webhook payload this service uses.
 *
 * Everything is optional: the payload shape differs per event, and a manual
 * `POST /api/cache/invalidate` with an empty body is a valid way to flush by hand.
 * The fields exist for the log line, not for control flow.
 */
export class StrapiWebhookDto {
  @IsOptional()
  @IsString()
  event?: string;

  @IsOptional()
  @IsString()
  model?: string;
}
