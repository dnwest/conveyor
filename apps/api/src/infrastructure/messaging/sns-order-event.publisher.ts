import { PublishCommand, type SNSClient } from '@aws-sdk/client-sns';
import type { OrderCreatedMessage } from '@conveyor/core';
import { Logger } from '@nestjs/common';
import type { OrderEventPublisher } from '../../core/ports/order-event.publisher';

export class SnsOrderEventPublisher implements OrderEventPublisher {
  private readonly logger = new Logger(SnsOrderEventPublisher.name);

  constructor(
    private readonly client: SNSClient,
    private readonly topicArn: string,
  ) {}

  async publishOrderCreated(message: OrderCreatedMessage): Promise<void> {
    await this.client.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Message: JSON.stringify(message),
        MessageAttributes: {
          type: { DataType: 'String', StringValue: message.type },
        },
      }),
    );

    this.logger.log({
      msg: 'order event published',
      type: message.type,
      orderId: message.order.id,
    });
  }
}
