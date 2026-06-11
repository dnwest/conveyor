#!/usr/bin/env bash
set -euo pipefail

REGION="us-east-1"
ACCOUNT_ID="000000000000"
TOPIC_NAME="orders"
QUEUE_NAME="orders-queue"
DLQ_NAME="orders-dlq"

queue_url() {
  echo "http://localhost:4566/${ACCOUNT_ID}/$1"
}

awslocal sns create-topic --name "$TOPIC_NAME" --region "$REGION"
awslocal sqs create-queue --queue-name "$DLQ_NAME" --region "$REGION"

DLQ_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url "$(queue_url "$DLQ_NAME")" \
  --attribute-names QueueArn \
  --query 'Attributes.QueueArn' --output text --region "$REGION")

REDRIVE_POLICY="{\"deadLetterTargetArn\":\"${DLQ_ARN}\",\"maxReceiveCount\":\"3\"}"
awslocal sqs create-queue \
  --queue-name "$QUEUE_NAME" \
  --attributes "{\"RedrivePolicy\":\"$(echo "$REDRIVE_POLICY" | sed 's/"/\\"/g')\"}" \
  --region "$REGION"

QUEUE_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url "$(queue_url "$QUEUE_NAME")" \
  --attribute-names QueueArn \
  --query 'Attributes.QueueArn' --output text --region "$REGION")

TOPIC_ARN=$(awslocal sns list-topics \
  --query "Topics[?contains(TopicArn, ':${TOPIC_NAME}')].TopicArn" \
  --output text --region "$REGION")

# Grant the SNS topic permission to deliver into the queue; SNS->SQS delivery
# silently drops messages without this policy.
QUEUE_POLICY="{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"sns.amazonaws.com\"},\"Action\":\"sqs:SendMessage\",\"Resource\":\"${QUEUE_ARN}\",\"Condition\":{\"ArnEquals\":{\"aws:SourceArn\":\"${TOPIC_ARN}\"}}}]}"
python3 -c 'import json, sys; open("/tmp/queue-policy.json", "w").write(json.dumps({"Policy": sys.argv[1]}))' "$QUEUE_POLICY"
awslocal sqs set-queue-attributes \
  --queue-url "$(queue_url "$QUEUE_NAME")" \
  --attributes file:///tmp/queue-policy.json \
  --region "$REGION"

awslocal sns subscribe \
  --topic-arn "$TOPIC_ARN" \
  --protocol sqs \
  --notification-endpoint "$QUEUE_ARN" \
  --attributes RawMessageDelivery=true \
  --region "$REGION"

echo "LocalStack provisioned:"
echo "  topic = ${TOPIC_ARN}"
echo "  queue = ${QUEUE_ARN}"
echo "  dlq   = ${DLQ_ARN}"
