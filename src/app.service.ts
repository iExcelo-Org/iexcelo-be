import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  check() {
    return {
      success: true,
      message: 'Service is healthy',
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        // APP_ENV tells staging and production apart. Both run with NODE_ENV=production.
        environment:
          process.env.APP_ENV || process.env.NODE_ENV || 'development',
      },
    };
  }
}
