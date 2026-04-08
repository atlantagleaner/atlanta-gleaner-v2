# AWS Lambda Deployment Guide

## Overview
This Lambda function serves as the **primary** news feed refresh mechanism for Atlanta Gleaner, with Vercel Cron as backup.

## Prerequisites
- AWS Account with appropriate permissions (Lambda, IAM, EventBridge, CloudWatch Logs)
- AWS CLI installed and configured (`aws configure`)
- Node.js 18+ installed locally

## Deployment Steps

### 1. Set Up IAM Role (One-time)

Create an IAM role for Lambda:

```bash
# Create trust policy file
cat > /tmp/lambda-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name atlanta-gleaner-lambda-role \
  --assume-role-policy-document file:///tmp/lambda-trust-policy.json

# Attach basic Lambda execution policy
aws iam attach-role-policy \
  --role-name atlanta-gleaner-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

Wait ~30 seconds for the role to be available.

### 2. Create Lambda Function

```bash
cd aws/lambda

# Build and zip
npm run build
npm run zip

# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create function
aws lambda create-function \
  --function-name atlanta-gleaner-news-refresh \
  --runtime nodejs18.x \
  --role arn:aws:iam::$AWS_ACCOUNT_ID:role/atlanta-gleaner-lambda-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables='{ \
    SERPER_API_KEY=YOUR_SERPER_KEY, \
    SPOTIFY_CLIENT_ID=YOUR_SPOTIFY_ID, \
    SPOTIFY_CLIENT_SECRET=YOUR_SPOTIFY_SECRET, \
    SPOTIFY_SHOW_IDS=YOUR_SPOTIFY_SHOW_IDS_CSV, \
    BLOB_READ_WRITE_TOKEN=YOUR_BLOB_TOKEN, \
    EDGE_CONFIG_ID=YOUR_EDGE_CONFIG_ID, \
    VERCEL_API_TOKEN=YOUR_VERCEL_TOKEN \
  }'
```

⚠️ **Replace the `YOUR_*` values** with actual credentials from your `.env.local` file.

### 3. Set Environment Variables

Once the function is created, update environment variables (safer than CLI):

```bash
aws lambda update-function-configuration \
  --function-name atlanta-gleaner-news-refresh \
  --environment Variables='{
    "SERPER_API_KEY": "YOUR_SERPER_API_KEY",
    "SPOTIFY_CLIENT_ID": "YOUR_SPOTIFY_CLIENT_ID",
    "SPOTIFY_CLIENT_SECRET": "YOUR_SPOTIFY_CLIENT_SECRET",
    "SPOTIFY_SHOW_IDS": "comma-separated-spotify-show-ids",
    "BLOB_READ_WRITE_TOKEN": "YOUR_VERCEL_BLOB_TOKEN",
    "EDGE_CONFIG_ID": "YOUR_EDGE_CONFIG_ID",
    "VERCEL_API_TOKEN": "REDACTED_TOKEN"
  }'
```

Fill in your actual API keys and tokens for each environment variable.

### 4. Create EventBridge Trigger

Schedule the function to run at your desired times (6 AM & 7 AM UTC = 2 hours before & after Vercel cron):

```bash
# Create EventBridge rule for 6 AM UTC daily
aws events put-rule \
  --name atlanta-gleaner-refresh-6am \
  --schedule-expression "cron(0 6 * * ? *)" \
  --state ENABLED

# Create EventBridge rule for 7 AM UTC daily
aws events put-rule \
  --name atlanta-gleaner-refresh-7am \
  --schedule-expression "cron(0 7 * * ? *)" \
  --state ENABLED

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Add Lambda as target for 6 AM rule
aws events put-targets \
  --rule atlanta-gleaner-refresh-6am \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:$AWS_ACCOUNT_ID:function:atlanta-gleaner-news-refresh"

# Add Lambda as target for 7 AM rule
aws events put-targets \
  --rule atlanta-gleaner-refresh-7am \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:$AWS_ACCOUNT_ID:function:atlanta-gleaner-news-refresh"

# Grant EventBridge permission to invoke Lambda
aws lambda add-permission \
  --function-name atlanta-gleaner-news-refresh \
  --statement-id AllowEventBridgeInvoke \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn "arn:aws:events:us-east-1:$AWS_ACCOUNT_ID:rule/atlanta-gleaner-refresh-*"
```

**Note:** Replace `us-east-1` with your AWS region if different.

### 5. Test the Function

```bash
# Manual invocation test
npm run test

# View CloudWatch logs
npm run logs

# Check for errors
npm run errors
```

### 6. Deploy Updates

After code changes:

```bash
cd aws/lambda
npm run deploy
```

## Architecture

```
EventBridge (6 AM & 7 AM UTC)
    ↓
Lambda Function (atlanta-gleaner-news-refresh)
    ├─ Fetches news via Serper API
    ├─ Fetches Spotify episodes
    └─ Saves to Vercel Blob + Edge Config

Vercel Cron (4 AM & 5 AM UTC) ← BACKUP
    ↓
Next.js /api/cron/refresh-news endpoint
```

**Primary:** Lambda (6 AM, 7 AM UTC)  
**Backup:** Vercel Cron (4 AM, 5 AM UTC)

## Troubleshooting

### Function fails to invoke
- Check CloudWatch Logs: `npm run logs`
- Verify all environment variables are set
- Check EventBridge rule is enabled: `aws events list-rules`

### Feed not updating
- Verify Lambda has executed: `npm run logs | grep "Successfully"`
- Check Vercel Blob write permissions (BLOB_READ_WRITE_TOKEN)
- Verify Edge Config token (EDGE_CONFIG_ID, VERCEL_API_TOKEN)

### Rate limiting errors
- Spotify: Lambda has 5-show concurrency limit built-in
- Serper: Verify API key and monthly quota
- Adjust Lambda timeout if needed: `aws lambda update-function-configuration --function-name atlanta-gleaner-news-refresh --timeout 90`

## Security Notes

- ⚠️ Never commit `.env.local` or AWS credentials to git
- Use AWS Secrets Manager for sensitive values in production
- Rotate API keys periodically
- Monitor CloudWatch Logs for errors
