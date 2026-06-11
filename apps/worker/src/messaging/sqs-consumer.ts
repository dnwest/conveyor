import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  type Message,
  type SQSClient,
} from '@aws-sdk/client-sqs';
import type { Logger } from 'pino';

export interface ConsumerOptions {
  queueUrl: string;
  waitTimeSeconds: number;
  visibilityTimeoutSeconds: number;
  maxMessages: number;
}

export type MessageHandler = (message: Message) => Promise<void>;

export class SqsConsumer {
  private running = false;

  constructor(
    private readonly client: SQSClient,
    private readonly options: ConsumerOptions,
    private readonly handler: MessageHandler,
    private readonly logger: Logger,
  ) {}

  async start(): Promise<void> {
    this.running = true;
    this.logger.info({ queueUrl: this.options.queueUrl }, 'consumer started');

    while (this.running) {
      await this.poll();
    }

    this.logger.info('consumer stopped');
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
          VisibilityTimeout: this.options.visibilityTimeoutSeconds,
          MessageAttributeNames: ['All'],
        }),
      );
      messages = result.Messages ?? [];
    } catch (error) {
      this.logger.error({ err: error }, 'failed to receive messages');
      return;
    }

    for (const message of messages) {
      await this.handleMessage(message);
    }
  }

  private async handleMessage(message: Message): Promise<void> {
    try {
      await this.handler(message);
      await this.client.send(
        new DeleteMessageCommand({
          QueueUrl: this.options.queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        }),
      );
    } catch (error) {
      this.logger.error(
        { err: error, messageId: message.MessageId },
        'message processing failed; leaving it for SQS redrive',
      );
    }
  }
}
