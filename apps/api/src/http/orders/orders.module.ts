import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';
import type { OrderEventPublisher } from '../../core/ports/order-event.publisher';
import type { OrderRepository } from '../../core/ports/order.repository';
import { CreateOrderUseCase } from '../../core/use-cases/create-order.use-case';
import { GetOrderUseCase } from '../../core/use-cases/get-order.use-case';
import { createSnsClient } from '../../infrastructure/aws/sns-client';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { InMemoryOrderEventPublisher } from '../../infrastructure/messaging/in-memory-order-event.publisher';
import { SnsOrderEventPublisher } from '../../infrastructure/messaging/sns-order-event.publisher';
import { DrizzleOrderRepository } from '../../infrastructure/persistence/drizzle-order.repository';
import {
  CREATE_ORDER_USE_CASE,
  GET_ORDER_USE_CASE,
  ORDER_EVENT_PUBLISHER,
  ORDER_REPOSITORY,
} from '../../infrastructure/tokens';
import { OrdersController } from './orders.controller';

function createOrderEventPublisher(config: ConfigService<Env, true>): OrderEventPublisher {
  if (config.get('ORDER_EVENTS_TRANSPORT', { infer: true }) !== 'sns') {
    return new InMemoryOrderEventPublisher();
  }

  const client = createSnsClient({
    AWS_REGION: config.get('AWS_REGION', { infer: true }),
    AWS_ENDPOINT_URL: config.get('AWS_ENDPOINT_URL', { infer: true }),
    AWS_ACCESS_KEY_ID: config.get('AWS_ACCESS_KEY_ID', { infer: true }),
    AWS_SECRET_ACCESS_KEY: config.get('AWS_SECRET_ACCESS_KEY', { infer: true }),
  });

  return new SnsOrderEventPublisher(client, config.getOrThrow('ORDERS_TOPIC_ARN', { infer: true }));
}

@Module({
  controllers: [OrdersController],
  providers: [
    {
      provide: ORDER_REPOSITORY,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService): OrderRepository =>
        new DrizzleOrderRepository(database.db),
    },
    {
      provide: ORDER_EVENT_PUBLISHER,
      inject: [ConfigService],
      useFactory: createOrderEventPublisher,
    },
    {
      provide: CREATE_ORDER_USE_CASE,
      inject: [ORDER_REPOSITORY, ORDER_EVENT_PUBLISHER],
      useFactory: (orders: OrderRepository, publisher: OrderEventPublisher) =>
        new CreateOrderUseCase(orders, publisher),
    },
    {
      provide: GET_ORDER_USE_CASE,
      inject: [ORDER_REPOSITORY],
      useFactory: (orders: OrderRepository) => new GetOrderUseCase(orders),
    },
  ],
})
export class OrdersModule {}
