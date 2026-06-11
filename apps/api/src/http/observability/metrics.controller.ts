import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { GetMetricsSummaryUseCase } from '../../core/use-cases/get-metrics-summary.use-case';
import { GET_METRICS_SUMMARY_USE_CASE } from '../../infrastructure/tokens';
import { MetricsSummaryDto } from './dto/metrics-summary.dto';

@ApiTags('observability')
@Controller('metrics')
export class MetricsController {
  constructor(
    @Inject(GET_METRICS_SUMMARY_USE_CASE) private readonly getSummary: GetMetricsSummaryUseCase,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Order counts by status and recent throughput' })
  @ApiOkResponse({ type: MetricsSummaryDto })
  async summary(): Promise<MetricsSummaryDto> {
    return this.getSummary.execute();
  }
}
