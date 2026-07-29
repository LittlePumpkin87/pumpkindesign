import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

import { Env } from '../config/env.validation';
import { StrapiUnavailableError } from './strapi-unavailable.error';

@Injectable()
export class StrapiService {
  private readonly logger = new Logger(StrapiService.name);
  private readonly retries: number;

  constructor(
    private readonly http: HttpService,
    config: ConfigService<Env, true>,
  ) {
    this.retries = config.get('STRAPI_RETRIES', { infer: true });
  }

  /**
   * GET a path (including query string) from Strapi.
   *
   * Resolves with the parsed body on 2xx.
   * Throws {@link HttpException} on 4xx — the caller should pass it through.
   * Throws {@link StrapiUnavailableError} on 5xx/network/timeout after all retries.
   */
  async get<T>(pathWithQuery: string): Promise<T> {
    let lastError: StrapiUnavailableError | undefined;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      if (attempt > 0) {
        // Short linear backoff. Strapi is a neighbour container, not a remote API —
        // a long backoff would just add latency to a request that is likely to succeed.
        await delay(attempt * 150);
        this.logger.warn(`Retrying GET ${pathWithQuery} (attempt ${attempt + 1})`);
      }

      let response: AxiosResponse<T>;
      try {
        response = await firstValueFrom(this.http.get<T>(pathWithQuery));
      } catch (error) {
        lastError = new StrapiUnavailableError(
          `Strapi request failed: GET ${pathWithQuery}`,
          error,
        );
        continue;
      }

      if (response.status >= 500) {
        lastError = new StrapiUnavailableError(
          `Strapi responded with status ${response.status}: GET ${pathWithQuery}`,
        );
        continue;
      }

      if (response.status >= 400) {
        throw new HttpException(
          { error: `Strapi responded with status ${response.status}` },
          response.status,
        );
      }

      return response.data;
    }

    throw lastError ?? new StrapiUnavailableError(`Strapi request failed: GET ${pathWithQuery}`);
  }

  /**
   * Liveness probe against Strapi's built-in /_health endpoint (204 when up).
   * Deliberately not retried — the health check should report the current state.
   */
  async ping(): Promise<void> {
    let response: AxiosResponse<unknown>;
    try {
      response = await firstValueFrom(this.http.get('/_health'));
    } catch (error) {
      throw new StrapiUnavailableError('Strapi health check failed', error);
    }

    if (response.status >= 400) {
      throw new StrapiUnavailableError(`Strapi health check returned ${response.status}`);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
