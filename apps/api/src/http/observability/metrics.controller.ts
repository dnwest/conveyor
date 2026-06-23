import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { GetMetricsSummaryUseCase } from '../../core/use-cases/get-metrics-summary.use-case';
import type { GetThroughputUseCase } from '../../core/use-cases/get-throughput.use-case';
import { GET_METRICS_SUMMARY_USE_CASE, GET_THROUGHPUT_USE_CASE } from '../../infrastructure/tokens';
import { MetricsSummaryDto } from './dto/metrics-summary.dto';
import { ThroughputQueryDto } from './dto/throughput.query';
import { ThroughputSeriesDto } from './dto/throughput-series.dto';

@ApiTags('observability')
@Controller('metrics')
export class MetricsController {
  constructor(
    @Inject(GET_METRICS_SUMMARY_USE_CASE) private readonly getSummary: GetMetricsSummaryUseCase,
    @Inject(GET_THROUGHPUT_USE_CASE) private readonly getThroughput: GetThroughputUseCase,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Order counts by status and recent throughput' })
  @ApiOkResponse({ type: MetricsSummaryDto })
  async summary(): Promise<MetricsSummaryDto> {
    return this.getSummary.execute();
  }

  @Get('throughput')
  @ApiOperation({ summary: 'Completed orders bucketed over a time window' })
  @ApiOkResponse({ type: ThroughputSeriesDto })
  async throughput(@Query() query: ThroughputQueryDto): Promise<ThroughputSeriesDto> {
    return this.getThroughput.execute(query);
  }
}
