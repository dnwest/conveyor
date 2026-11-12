import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { type Env, validateEnv } from './config/env.schema';
import { DatabaseModule } from './infrastructure/database/database.module';
import { DeadLettersModule } from './http/dead-letters/dead-letters.module';
import { ObservabilityModule } from './http/observability/observability.module';
import { OrdersModule } from './http/orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        pinoHttp: {
          level: config.get('LOG_LEVEL', { infer: true }),
          transport:
            config.get('NODE_ENV', { infer: true }) === 'production'
              ? undefined
              : { target: 'pino-pretty' },
        },
      }),
    }),
    DatabaseModule,
    OrdersModule,
    ObservabilityModule,
    DeadLettersModule,
  ],
})
export class AppModule {}
