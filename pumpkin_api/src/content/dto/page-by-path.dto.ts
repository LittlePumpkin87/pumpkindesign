import { IsString, Matches, MaxLength } from 'class-validator';

export class PageByPathDto {
  /**
   * Site-relative page path, exactly as the frontend sends it.
   *
   * The leading slash is optional and that is not sloppiness — it is the actual
   * contract. `PageService.getApiPathFromUrl()` joins the route segments without
   * a leading slash (`impressum`, `blog/artikel`) and only falls back to `/` for
   * the start page. Strapi then filters with `$eq` on that exact string, so the
   * value must be forwarded verbatim; requiring a leading slash here broke every
   * subpage while the start page kept working.
   *
   * Permissive on characters (German slugs contain umlauts, and Strapi decides
   * what exists), strict on shape: no query, fragment, whitespace, backslash or
   * traversal segment. The value is percent-encoded before it is forwarded.
   */
  @IsString()
  @MaxLength(512)
  @Matches(/^\/?[^\s?#\\]*$/u, {
    message: 'path must be a relative path without whitespace, "?", "#" or "\\"',
  })
  @Matches(/^(?!.*\.\.).*$/u, { message: 'path must not contain ".."' })
  path!: string;
}
