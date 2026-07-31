import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { GetBreakerStateUseCase } from '../../core/use-cases/get-breaker-state.use-case';
import type { GetMetricsSummaryUseCase } from '../../core/use-cases/get-metrics-summary.use-case';
import type { GetThroughputUseCase } from '../../core/use-cases/get-throughput.use-case';
import {
  GET_BREAKER_STATE_USE_CASE,
  GET_METRICS_SUMMARY_USE_CASE,
  GET_THROUGHPUT_USE_CASE,
} from '../../infrastructure/tokens';
import { BreakerStatusListDto } from './dto/breaker-state.dto';
import { MetricsSummaryDto } from './dto/metrics-summary.dto';
import { ThroughputQueryDto } from './dto/throughput.query';
import { ThroughputSeriesDto } from './dto/throughput-series.dto';

@ApiTags('observability')
@Controller('metrics')
export class MetricsController {
  constructor(
    @Inject(GET_METRICS_SUMMARY_USE_CASE) private readonly getSummary: GetMetricsSummaryUseCase,
    @Inject(GET_THROUGHPUT_USE_CASE) private readonly getThroughput: GetThroughputUseCase,
    @Inject(GET_BREAKER_STATE_USE_CASE) private readonly getBreakerState: GetBreakerStateUseCase,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Order counts by status and recent throughput' })
  @ApiOkResponse({ type: MetricsSummaryDto })
  async summary(): Promise<MetricsSummaryDto> {
    return this.getSummary.execute();
  }

  @Get('throughput')
  @ApiOperation({ summary: 'Completed and failed orders bucketed over a time window' })
  @ApiOkResponse({ type: ThroughputSeriesDto })
  async throughput(@Query() query: ThroughputQueryDto): Promise<ThroughputSeriesDto> {
    return this.getThroughput.execute(query);
  }

  @Get('breaker')
  @ApiOperation({ summary: 'Current circuit-breaker state, as recorded by the worker' })
  @ApiOkResponse({ type: BreakerStatusListDto })
  async breaker(): Promise<BreakerStatusListDto> {
    return this.getBreakerState.execute();
  }
}
