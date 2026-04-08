# AWS Lambda Deployment Quick Start

Fast-track deployment of Lambda news feed refresh. See `SETUP.md` for detailed instructions.

## Prerequisites

- AWS CLI configured: `aws configure`
- Node.js 18+
- Vercel credentials (BLOB_READ_WRITE_TOKEN, EDGE_CONFIG_ID, VERCEL_API_TOKEN)
- API keys (SERPER_API_KEY, SPOTIFY_*, YOUTUBE_API_KEY optional)

## 1. Build Lambda Function

```bash
cd aws/lambda
npm install
npm run build
# Creates index.js
```

## 2. Create Execution Role

```bash
aws iam create-role \
  --role-name lambda-news-feed-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy \
  --role-name lambda-news-feed-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name lambda-news-feed-role --query 'Role.Arn' --output text)
echo $ROLE_ARN
```

## 3. Create Lambda Function

```bash
cd aws/lambda
npm run zip  # Creates function.zip

aws lambda create-function \
  --function-name atlanta-gleaner-news-refresh \
  --runtime nodejs18.x \
  --role "$ROLE_ARN" \
  --handler index.handler \
  --timeout 60 \
  --memory-size 512 \
  --zip-file fileb://function.zip
```

## 4. Set Environment Variables

```bash
# Get tokens from Vercel
cd ../../  # Back to project root
vercel env pull

# Extract values and set in Lambda
aws lambda update-function-configuration \
  --function-name atlanta-gleaner-news-refresh \
  --environment Variables={
    SERPER_API_KEY="$(grep SERPER_API_KEY .env.local | cut -d'=' -f2)",
    SPOTIFY_CLIENT_ID="$(grep SPOTIFY_CLIENT_ID .env.local | cut -d'=' -f2)",
    SPOTIFY_CLIENT_SECRET="$(grep SPOTIFY_CLIENT_SECRET .env.local | cut -d'=' -f2)",
    SPOTIFY_SHOW_IDS="$(grep SPOTIFY_SHOW_IDS .env.local | cut -d'=' -f2)",
    BLOB_READ_WRITE_TOKEN="$(grep BLOB_READ_WRITE_TOKEN .env.local | cut -d'=' -f2)",
    EDGE_CONFIG_ID="$(grep EDGE_CONFIG_ID .env.local | cut -d'=' -f2)",
    VERCEL_API_TOKEN="$(grep VERCEL_API_TOKEN .env.local | cut -d'=' -f2)"
  }
```

## 5. Test Lambda

```bash
cd aws/lambda
npm run test
# Should return statusCode 200 with items count
```

## 6. Schedule with EventBridge

```bash
# Create rule (5 PM UTC daily)
aws events put-rule \
  --name atlanta-gleaner-news-refresh-schedule \
  --schedule-expression 'cron(0 17 * * ? *)' \
  --state ENABLED

# Create role for EventBridge → Lambda
aws iam create-role \
  --role-name eventbridge-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "events.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

LAMBDA_ARN=$(aws lambda get-function --function-name atlanta-gleaner-news-refresh --query 'Configuration.FunctionArn' --output text)
EB_ROLE_ARN=$(aws iam get-role --role-name eventbridge-lambda-role --query 'Role.Arn' --output text)

aws iam put-role-policy \
  --role-name eventbridge-lambda-role \
  --policy-name allow-lambda-invoke \
  --policy-document "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Effect\": \"Allow\",
      \"Action\": \"lambda:InvokeFunction\",
      \"Resource\": \"$LAMBDA_ARN\"
    }]
  }"

aws events put-targets \
  --rule atlanta-gleaner-news-refresh-schedule \
  --targets "Id=1,Arn=$LAMBDA_ARN,RoleArn=$EB_ROLE_ARN"
```

## 7. Verify

```bash
# Check execution
aws cloudwatch describe-alarms

# View logs
aws logs tail /aws/lambda/atlanta-gleaner-news-refresh --follow

# Check Vercel Blob was updated
# → Go to Vercel Project → Storage → Blob
# → Look for news-feed/backup.json with recent timestamp
```

## Common Tasks

### View Recent Logs
```bash
cd aws/lambda
npm run logs
```

### View Errors Only
```bash
npm run errors
```

### Redeploy After Code Changes
```bash
npm run deploy
```

### Manually Invoke
```bash
npm run test
```

## Rollback

If issues, disable the scheduled trigger:

```bash
aws events put-rule \
  --name atlanta-gleaner-news-refresh-schedule \
  --state DISABLED
```

Feed will continue using Vercel cron (primary) with fallback chain intact.

---

See `SETUP.md` for detailed troubleshooting and monitoring.
