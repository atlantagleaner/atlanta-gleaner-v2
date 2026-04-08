# AWS Lambda Setup for Atlanta Gleaner News Feed Backup

This guide provides step-by-step instructions to deploy and configure AWS Lambda for automated news feed refresh as a backup to the primary Vercel cron job.

## Architecture Overview

- **Primary**: Vercel Cron Job at 5 AM UTC daily (runs `refresh-news` endpoint)
- **Backup**: AWS Lambda at 5 PM UTC daily (12 hours later, independent)
- **Data**: Both write to Vercel Blob (same storage) with fallback chain
- **Failover**: `/api/news` route tries: live → previous → backup caches

## Prerequisites

1. **AWS Account**: Active AWS account with IAM permissions
2. **Vercel Credentials**:
   - BLOB_READ_WRITE_TOKEN
   - EDGE_CONFIG_ID
   - VERCEL_API_TOKEN
3. **API Keys** (same as Vercel):
   - SERPER_API_KEY (Google Serper)
   - SPOTIFY_CLIENT_ID
   - SPOTIFY_CLIENT_SECRET
   - YOUTUBE_API_KEY (optional)
4. **Node.js 18+**: For local testing/bundling

## Step 1: Prepare Lambda Code

### Option A: Use Provided TypeScript (Recommended)

The Lambda function is provided at `aws/lambda/news-feed-refresh.ts`.

Compile to JavaScript:

```bash
cd aws/lambda
npx esbuild news-feed-refresh.ts --bundle --platform=node --target=node18 --outfile=index.js --external:stream
```

Or use a build script:

```bash
npm install --save-dev esbuild
npm run build:lambda
```

### Option B: Use AWS Lambda Console

Skip to Step 2 and paste the JavaScript directly into AWS Lambda console.

## Step 2: Create Lambda Function

### Via AWS Console:

1. **Go to Lambda Dashboard**:
   - AWS Console → Lambda → Create function
   - Function name: `atlanta-gleaner-news-refresh`
   - Runtime: **Node.js 18.x** (or later)
   - Architecture: **x86_64** or **arm64**
   - Click **Create function**

2. **Configure Function**:
   - **Timeout**: 60 seconds (required for API calls + Blob upload)
   - **Memory**: 512 MB (sufficient for feed processing)
   - **Ephemeral storage**: 512 MB (default, sufficient)

3. **Upload Code**:
   - **Option A (Recommended)**: ZIP file
     ```bash
     cd aws/lambda
     zip function.zip index.js node_modules/
     aws lambda update-function-code --function-name atlanta-gleaner-news-refresh --zip-file fileb://function.zip
     ```
   - **Option B**: Paste directly into console editor (if <4 KB)

### Via AWS CLI:

```bash
# Create execution role (see Step 3 first)
ROLE_ARN="arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-news-feed-role"

aws lambda create-function \
  --function-name atlanta-gleaner-news-refresh \
  --runtime nodejs18.x \
  --role "$ROLE_ARN" \
  --handler index.handler \
  --timeout 60 \
  --memory-size 512 \
  --zip-file fileb://function.zip
```

## Step 3: Create IAM Role & Policy

### Create Execution Role:

1. **AWS Console**:
   - IAM → Roles → Create role
   - Service: **Lambda**
   - Permissions: 
     - Attach `AWSLambdaBasicExecutionRole` (for CloudWatch Logs)
   - Role name: `atlanta-gleaner-news-feed-role`
   - Click **Create role**

2. **Attach Custom Policy**:
   - Role → Permissions → Add inline policy
   - Copy the policy below:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

Note: External API calls (Serper, YouTube, Spotify, Vercel Blob, Edge Config) are made via HTTP from Lambda, so no additional AWS IAM permissions are needed.

### Via AWS CLI:

```bash
# Create role
aws iam create-role \
  --role-name atlanta-gleaner-news-feed-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name atlanta-gleaner-news-feed-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

## Step 4: Set Environment Variables

In Lambda function configuration, add these environment variables:

| Variable | Source | Example |
|----------|--------|---------|
| `SERPER_API_KEY` | Vercel env | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `SPOTIFY_CLIENT_ID` | Vercel env | `abcd1234efgh5678` |
| `SPOTIFY_CLIENT_SECRET` | Vercel env | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `SPOTIFY_SHOW_IDS` | Vercel env | `id1,id2,id3,id4,id5,id6,id7,id8` |
| `YOUTUBE_API_KEY` | Vercel env (optional) | `AIzaSyDxxxx...` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob settings | `vercel_blob_rw_xxxx...` |
| `EDGE_CONFIG_ID` | Vercel project settings | `ecfg_xxxx...` |
| `VERCEL_API_TOKEN` | Vercel account settings | `vercel_xxxx...` |

**Retrieve from Vercel**:

```bash
# Pull all Vercel env vars
cd atlanta-gleaner-v2
vercel env pull

# Copy values from .env.local to Lambda console
```

### Via AWS CLI:

```bash
aws lambda update-function-configuration \
  --function-name atlanta-gleaner-news-refresh \
  --environment Variables={
    SERPER_API_KEY=xxxxxxxx,
    SPOTIFY_CLIENT_ID=xxxxxxxx,
    SPOTIFY_CLIENT_SECRET=xxxxxxxx,
    SPOTIFY_SHOW_IDS=id1,id2,id3,
    BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxx,
    EDGE_CONFIG_ID=ecfg_xxxx,
    VERCEL_API_TOKEN=vercel_xxxx
  }
```

## Step 5: Configure EventBridge Trigger

### Via AWS Console:

1. **Create Rule**:
   - EventBridge → Rules → Create rule
   - Name: `atlanta-gleaner-news-refresh-schedule`
   - Event bus: **Default**
   - Rule type: **Schedule**

2. **Set Schedule**:
   - **Pattern**: Cron expression
   - **Cron**: `0 17 * * ? *` (5 PM UTC daily)
   - Or: `0 12 * * ? *` (12 PM UTC for Eastern) 
   - Click **Next**

3. **Select Target**:
   - Target 1: **AWS Lambda function**
   - Function: `atlanta-gleaner-news-refresh`
   - Click **Create rule**

### Via AWS CLI:

```bash
# Create rule
aws events put-rule \
  --name atlanta-gleaner-news-refresh-schedule \
  --schedule-expression 'cron(0 17 * * ? *)' \
  --state ENABLED

# Add Lambda target
aws events put-targets \
  --rule atlanta-gleaner-news-refresh-schedule \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:atlanta-gleaner-news-refresh","RoleArn"="arn:aws:iam::YOUR_ACCOUNT_ID:role/eventbridge-lambda-role"

# Create role for EventBridge → Lambda (one-time)
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

aws iam put-role-policy \
  --role-name eventbridge-lambda-role \
  --policy-name allow-lambda-invoke \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:atlanta-gleaner-news-refresh"
    }]
  }'
```

## Step 6: Test Lambda Function

### Test Directly:

1. **In AWS Console**:
   - Lambda → Function → Test
   - Event name: `refresh-event`
   - Event JSON: `{}`
   - Click **Test**

2. **Check Logs**:
   - CloudWatch → Logs → `/aws/lambda/atlanta-gleaner-news-refresh`
   - View recent execution logs

### Test via CLI:

```bash
aws lambda invoke \
  --function-name atlanta-gleaner-news-refresh \
  --payload '{}' \
  response.json

cat response.json
```

**Expected Response** (successful):

```json
{
  "statusCode": 200,
  "body": "{\"ok\":true,\"message\":\"News feed refresh successful\",\"items\":20,\"duration\":\"2500ms\",\"cachedAt\":\"2026-04-08T17:00:00Z\",\"blobUrl\":\"https://...\"}"
}
```

**Check Vercel**: After successful Lambda run, verify Blob was updated:
- Go to Vercel Project → Storage → Blob
- Look for `news-feed/backup.json` with recent timestamp

## Step 7: Monitor & Set Alarms

### CloudWatch Logs:

```bash
# View recent Lambda logs
aws logs tail /aws/lambda/atlanta-gleaner-news-refresh --follow

# View errors only
aws logs filter-log-events \
  --log-group-name /aws/lambda/atlanta-gleaner-news-refresh \
  --filter-pattern "ERROR"
```

### CloudWatch Alarms:

1. **Lambda Failure Alarm**:
   - CloudWatch → Alarms → Create alarm
   - Metric: `aws/lambda:Errors` (function: `atlanta-gleaner-news-refresh`)
   - Threshold: ≥ 1 error in 1 execution
   - Action: SNS email notification
   - Click **Create alarm**

2. **Lambda Duration Alarm** (performance):
   - Metric: `aws/lambda:Duration`
   - Threshold: > 30 seconds (adjust to your baseline)
   - Action: SNS email notification

### Via CLI:

```bash
# Create failure alarm
aws cloudwatch put-metric-alarm \
  --alarm-name atlanta-gleaner-lambda-failures \
  --alarm-description "Alert on Lambda function errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=atlanta-gleaner-news-refresh \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:my-alert-topic
```

## Step 8: Verify Integration

### Check Fallback Chain:

1. **Temporarily disable Vercel cron** (to test Lambda as primary backup):
   - Vercel Project → Settings → Cron Jobs
   - Disable or delay `refresh-news`

2. **Wait for Lambda to execute** at scheduled time (5 PM UTC)

3. **Verify feed is served**:
   ```bash
   curl https://your-site.vercel.app/api/news
   # Should return items from Blob backup cache
   ```

4. **Check response headers**:
   - `source` field should be `news_cache_backup` (if live/previous failed)
   - `isStale` should be `false`

### Manual Lambda Invocation:

```bash
# Trigger Lambda anytime for testing
aws lambda invoke \
  --function-name atlanta-gleaner-news-refresh \
  --payload '{}' \
  response.json && cat response.json
```

## Troubleshooting

### Issue: Lambda Timeout (>60s)

**Cause**: Slow API responses (Serper, YouTube, Spotify)  
**Fix**:
1. Increase timeout to 120 seconds:
   ```bash
   aws lambda update-function-configuration \
     --function-name atlanta-gleaner-news-refresh \
     --timeout 120
   ```
2. Check CloudWatch logs for slow API calls
3. Reduce number of queries (edit Lambda code)

### Issue: "Missing SERPER_API_KEY" Error

**Cause**: Environment variables not set  
**Fix**:
1. Verify all variables are set:
   ```bash
   aws lambda get-function-configuration \
     --function-name atlanta-gleaner-news-refresh | grep Environment
   ```
2. Re-add missing variables
3. Invoke again

### Issue: Blob Upload Fails (403)

**Cause**: `BLOB_READ_WRITE_TOKEN` is invalid or expired  
**Fix**:
1. Get fresh token from Vercel:
   ```bash
   vercel env ls
   # Copy BLOB_READ_WRITE_TOKEN value
   ```
2. Update Lambda environment:
   ```bash
   aws lambda update-function-configuration \
     --function-name atlanta-gleaner-news-refresh \
     --environment Variables={...,BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...}
   ```

### Issue: EventBridge Rule Not Triggering

**Cause**: Rule is disabled or has wrong timezone  
**Check**:
```bash
aws events describe-rule --name atlanta-gleaner-news-refresh-schedule

# Should show: "State": "ENABLED"
# And: "ScheduleExpression": "cron(0 17 * * ? *)" (or your time)
```

**Fix**:
```bash
# Enable rule
aws events put-rule \
  --name atlanta-gleaner-news-refresh-schedule \
  --schedule-expression 'cron(0 17 * * ? *)' \
  --state ENABLED
```

## Costs

**Estimated monthly cost** (as of 2024):

| Service | Metric | Cost |
|---------|--------|------|
| Lambda | 1 invocation/day (30/month) at 2s = 0.6GB-seconds | **Free** (within free tier) |
| CloudWatch Logs | ~1 KB/invocation × 30 = 30 KB/month | **Free** (within free tier) |
| Vercel Blob | No additional cost (existing service) | $0 |
| EventBridge | 1 rule, trigger 1× daily | **Free** (within free tier) |
| **Total** | | **~$0** (free tier) |

Beyond free tier (if applicable):
- Lambda: $0.20 per 1M invocations + $0.0000166667 per GB-second
- CloudWatch: $0.50 per GB (logs)

## Next Steps

1. **Deploy & Test**: Follow Steps 1-8 above
2. **Monitor**: Check CloudWatch Logs for first week
3. **Verify Failover**: Intentionally disable Vercel cron once to test Lambda backup
4. **Alert Setup**: Configure SNS email alerts (Step 7)
5. **Documentation**: Update runbook with Lambda recovery procedures

## Maintenance

### Weekly:
- Check CloudWatch Logs for errors
- Verify feed quality (spot check Blob output)

### Monthly:
- Review CloudWatch Alarms
- Check Vercel Edge Config for cache age
- Verify both Vercel cron and Lambda executed

### Quarterly:
- Update API credentials if rotated in Vercel
- Review & update Lambda code if news sources change
- Test failover scenario (disable Vercel, rely on Lambda)

## Support & Rollback

### If Lambda Causes Issues:

1. **Disable EventBridge Rule** (stop scheduled invocations):
   ```bash
   aws events put-rule \
     --name atlanta-gleaner-news-refresh-schedule \
     --state DISABLED
   ```

2. **Rely on Vercel Cron** (primary) only:
   - Feed will use `live` cache from Vercel (until it expires)
   - No change needed to `/api/news` route (fallback chain still works)

3. **Re-enable after fix**:
   ```bash
   aws events put-rule \
     --name atlanta-gleaner-news-refresh-schedule \
     --state ENABLED
   ```

---

**Questions?** Check Lambda function code comments in `aws/lambda/news-feed-refresh.ts`.
