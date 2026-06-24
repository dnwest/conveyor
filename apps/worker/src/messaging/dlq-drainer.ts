import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  type Message,
  type SQSClient,
} from '@aws-sdk/client-sqs';
import { orderCreatedMessageSchema } from '@conveyor/core';
import type { Logger } from 'pino';
import type { DeadLetterRecord, DeadLetterStore } from '../processing/dead-letter-store';

export interface DlqDrainerOptions {
  queueUrl: string;
  waitTimeSeconds: number;
  maxMessages: number;
}

export function toDeadLetterRecord(message: Message): DeadLetterRecord {
  const payload = message.Body ?? '';
  return {
    messageId: message.MessageId ?? '',
    orderId: extractOrderId(payload),
    payload,
    error: null,
    receiveCount: Number(message.Attributes?.ApproximateReceiveCount ?? '0'),
  };
}

function extractOrderId(payload: string): string | null {
  try {
    const parsed = orderCreatedMessageSchema.safeParse(JSON.parse(payload));
    return parsed.success ? parsed.data.order.id : null;
  } catch {
    return null;
  }
}

export class DlqDrainer {
  private running = false;

  constructor(
    private readonly client: SQSClient,
    private readonly options: DlqDrainerOptions,
    private readonly store: DeadLetterStore,
    private readonly logger: Logger,
  ) {}

  async start(): Promise<void> {
    this.running = true;
    this.logger.info({ queueUrl: this.options.queueUrl }, 'dlq drainer started');

    while (this.running) {
      await this.poll();
    }

    this.logger.info('dlq drainer stopped');
  }

  stop(): void {
    this.running = false;
  }

  private async poll(): Promise<void> {
    let messages: Message[] = [];

    try {
      const result = await this.client.send(
        new ReceiveMessageCommand({
          QueueUrl: this.options.queueUrl,
          MaxNumberOfMessages: this.options.maxMessages,
          WaitTimeSeconds: this.options.waitTimeSeconds,
          MessageSystemAttributeNames: ['ApproximateReceiveCount'],
        }),
      );
      messages = result.Messages ?? [];
    } catch (error) {
      this.logger.error({ err: error }, 'failed to receive dead letters');
      return;
    }

    for (const message of messages) {
      await this.handleMessage(message);
    }
  }

  private async handleMessage(message: Message): Promise<void> {
    const record = toDeadLetterRecord(message);

    try {
      await this.store.save(record);
    } catch (error) {
      this.logger.error(
        { err: error, messageId: record.messageId },
        'failed to persist dead letter; leaving it on the DLQ',
      );
      return;
    }

    await this.client.send(
      new DeleteMessageCommand({
        QueueUrl: this.options.queueUrl,
        ReceiptHandle: message.ReceiptHandle,
      }),
    );
    this.logger.warn(
      { messageId: record.messageId, orderId: record.orderId, receiveCount: record.receiveCount },
      'dead letter recorded',
    );
  }
}
