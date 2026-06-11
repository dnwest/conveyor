import type { QueueDepths } from '@conveyor/core';

export interface QueueMetrics {
  getDepths(): Promise<QueueDepths>;
}
