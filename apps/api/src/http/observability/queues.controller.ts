import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { GetQueueDepthsUseCase } from '../../core/use-cases/get-queue-depths.use-case';
import { GET_QUEUE_DEPTHS_USE_CASE } from '../../infrastructure/tokens';
import { QueueDepthsDto } from './dto/queue-depths.dto';

@ApiTags('observability')
@Controller('queues')
export class QueuesController {
  constructor(
    @Inject(GET_QUEUE_DEPTHS_USE_CASE) private readonly getDepths: GetQueueDepthsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Approximate depth of the orders queue and its DLQ' })
  @ApiOkResponse({ type: QueueDepthsDto })
  async depths(): Promise<QueueDepthsDto> {
    return this.getDepths.execute();
  }
}
