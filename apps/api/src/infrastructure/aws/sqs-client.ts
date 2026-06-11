import { SQSClient } from '@aws-sdk/client-sqs';
import type { Env } from '../../config/env.schema';

type SqsClientConfig = Pick<
  Env,
  'AWS_REGION' | 'AWS_ENDPOINT_URL' | 'AWS_ACCESS_KEY_ID' | 'AWS_SECRET_ACCESS_KEY'
>;

export function createSqsClient(config: SqsClientConfig): SQSClient {
  return new SQSClient({
    region: config.AWS_REGION,
    endpoint: config.AWS_ENDPOINT_URL,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
  });
}
