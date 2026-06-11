import { SNSClient } from '@aws-sdk/client-sns';
import type { Env } from '../../config/env.schema';

type SnsClientConfig = Pick<
  Env,
  'AWS_REGION' | 'AWS_ENDPOINT_URL' | 'AWS_ACCESS_KEY_ID' | 'AWS_SECRET_ACCESS_KEY'
>;

export function createSnsClient(config: SnsClientConfig): SNSClient {
  return new SNSClient({
    region: config.AWS_REGION,
    endpoint: config.AWS_ENDPOINT_URL,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
  });
}
