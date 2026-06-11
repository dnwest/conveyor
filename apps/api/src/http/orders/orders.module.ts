import { Module } from '@nestjs/common';
import type { OrderEventPublisher } from '../../core/ports/order-event.publisher';
import type { OrderRepository } from '../../core/ports/order.repository';
import { CreateOrderUseCase } from '../../core/use-cases/create-order.use-case';
import { GetOrderUseCase } from '../../core/use-cases/get-order.use-case';
import { InMemoryOrderEventPublisher } from '../../infrastructure/messaging/in-memory-order-event.publisher';
import { InMemoryOrderRepository } from '../../infrastructure/persistence/in-memory-order.repository';
import {
  CREATE_ORDER_USE_CASE,
  GET_ORDER_USE_CASE,
  ORDER_EVENT_PUBLISHER,
  ORDER_REPOSITORY,
} from '../../infrastructure/tokens';
import { OrdersController } from './orders.controller';

@Module({
  controllers: [OrdersController],
  providers: [
    { provide: ORDER_REPOSITORY, useClass: InMemoryOrderRepository },
    { provide: ORDER_EVENT_PUBLISHER, useClass: InMemoryOrderEventPublisher },
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
