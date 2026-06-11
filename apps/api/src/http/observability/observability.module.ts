import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';
import type { OrderQueries } from '../../core/ports/order-queries';
import type { QueueMetrics } from '../../core/ports/queue-metrics';
import { GetMetricsSummaryUseCase } from '../../core/use-cases/get-metrics-summary.use-case';
import { GetQueueDepthsUseCase } from '../../core/use-cases/get-queue-depths.use-case';
import { createSqsClient } from '../../infrastructure/aws/sqs-client';
import { SqsQueueMetrics } from '../../infrastructure/queues/sqs-queue-metrics';
import {
  GET_METRICS_SUMMARY_USE_CASE,
  GET_QUEUE_DEPTHS_USE_CASE,
  ORDER_QUERIES,
  QUEUE_METRICS,
} from '../../infrastructure/tokens';
import { OrdersModule } from '../orders/orders.module';
import { MetricsController } from './metrics.controller';
import { QueuesController } from './queues.controller';

function createQueueMetrics(config: ConfigService<Env, true>): QueueMetrics {
  const client = createSqsClient({
    AWS_REGION: config.get('AWS_REGION', { infer: true }),
    AWS_ENDPOINT_URL: config.get('AWS_ENDPOINT_URL', { infer: true }),
    AWS_ACCESS_KEY_ID: config.get('AWS_ACCESS_KEY_ID', { infer: true }),
    AWS_SECRET_ACCESS_KEY: config.get('AWS_SECRET_ACCESS_KEY', { infer: true }),
  });

  return new SqsQueueMetrics(
    client,
    config.getOrThrow('ORDERS_QUEUE_URL', { infer: true }),
    config.getOrThrow('ORDERS_DLQ_URL', { infer: true }),
  );
}

@Module({
  imports: [OrdersModule],
  controllers: [MetricsController, QueuesController],
  providers: [
    {
      provide: GET_METRICS_SUMMARY_USE_CASE,
      inject: [ORDER_QUERIES],
      useFactory: (queries: OrderQueries) => new GetMetricsSummaryUseCase(queries),
    },
    {
      provide: QUEUE_METRICS,
      inject: [ConfigService],
      useFactory: createQueueMetrics,
    },
    {
      provide: GET_QUEUE_DEPTHS_USE_CASE,
      inject: [QUEUE_METRICS],
      useFactory: (queueMetrics: QueueMetrics) => new GetQueueDepthsUseCase(queueMetrics),
    },
  ],
})
export class ObservabilityModule {}
