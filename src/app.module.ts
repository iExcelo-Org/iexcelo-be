import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { ExamsModule } from './exams/exams.module';
import { AffiliatesModule } from './affiliates/affiliates.module';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { SponsorsModule } from './sponsors/sponsors.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UtilsModule } from './utils/utils.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UploadModule } from './upload/upload.module';
import { ChatsModule } from './chats/chats.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    UsersModule,
    StudentsModule,
    ExamsModule,
    AffiliatesModule,
    LoggerModule,
    AuthModule,
    SponsorsModule,

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 120 }]),

    // BullMQ global connection — all queue modules share this Redis config.
    // REDIS_TLS=true + REDIS_USERNAME + DATABASE_CA_CERT are set on Cloud Run for the new setup.
    // When they are unset (local dev, old deployment) the connection behaves exactly as before.
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          username: configService.get<string>('REDIS_USERNAME') || undefined,
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          tls:
            configService.get<string>('REDIS_TLS') === 'true'
              ? { ca: configService.get<string>('DATABASE_CA_CERT') }
              : undefined,
        },
      }),
      inject: [ConfigService],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'your_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        // DATABASE_SSL=true: verified TLS against our CA (new setup).
        // Otherwise keep the old behaviour so the current live deployment is unaffected.
        ssl:
          configService.get('DATABASE_SSL') === 'true'
            ? {
                ca: configService.get<string>('DATABASE_CA_CERT'),
                rejectUnauthorized: true,
              }
            : configService.get('NODE_ENV') === 'production'
              ? { rejectUnauthorized: false }
              : false,
      }),
      inject: [ConfigService],
    }),

    SubscriptionsModule,
    AnalyticsModule,

    UtilsModule,
    UploadModule,
    ChatsModule,
    NotificationsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
