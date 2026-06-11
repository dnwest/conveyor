import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CreateOrderUseCase } from '../../core/use-cases/create-order.use-case';
import type { GetOrderUseCase } from '../../core/use-cases/get-order.use-case';
import type { ListOrdersUseCase } from '../../core/use-cases/list-orders.use-case';
import {
  CREATE_ORDER_USE_CASE,
  GET_ORDER_USE_CASE,
  LIST_ORDERS_USE_CASE,
} from '../../infrastructure/tokens';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders.query';
import { OrderDto } from './dto/order.dto';
import { OrderListDto } from './dto/order-list.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(CREATE_ORDER_USE_CASE) private readonly createOrder: CreateOrderUseCase,
    @Inject(GET_ORDER_USE_CASE) private readonly getOrder: GetOrderUseCase,
    @Inject(LIST_ORDERS_USE_CASE) private readonly listOrders: ListOrdersUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit an order for processing' })
  @ApiCreatedResponse({ type: OrderDto })
  async create(@Body() dto: CreateOrderDto): Promise<OrderDto> {
    return this.createOrder.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders, most recent first' })
  @ApiOkResponse({ type: OrderListDto })
  async list(@Query() query: ListOrdersQueryDto): Promise<OrderListDto> {
    return this.listOrders.execute({
      limit: query.limit,
      offset: query.offset,
      status: query.status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch an order by id' })
  @ApiOkResponse({ type: OrderDto })
  async findOne(@Param('id') id: string): Promise<OrderDto> {
    return this.getOrder.execute(id);
  }
}
