import type { QueueDepths } from '@conveyor/core';
import type { QueueMetrics } from '../ports/queue-metrics';

export class GetQueueDepthsUseCase {
  constructor(private readonly queueMetrics: QueueMetrics) {}

  execute(): Promise<QueueDepths> {
    return this.queueMetrics.getDepths();
  }
}
