import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CreateOrderUseCase } from '../../core/use-cases/create-order.use-case';
import type { GetOrderUseCase } from '../../core/use-cases/get-order.use-case';
import { CREATE_ORDER_USE_CASE, GET_ORDER_USE_CASE } from '../../infrastructure/tokens';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderDto } from './dto/order.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(CREATE_ORDER_USE_CASE) private readonly createOrder: CreateOrderUseCase,
    @Inject(GET_ORDER_USE_CASE) private readonly getOrder: GetOrderUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit an order for processing' })
  @ApiCreatedResponse({ type: OrderDto })
  async create(@Body() dto: CreateOrderDto): Promise<OrderDto> {
    return this.createOrder.execute(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch an order by id' })
  @ApiOkResponse({ type: OrderDto })
  async findOne(@Param('id') id: string): Promise<OrderDto> {
    return this.getOrder.execute(id);
  }
}
