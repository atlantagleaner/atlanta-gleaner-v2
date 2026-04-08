# AWS Lambda News Feed Refresh

**Status:** Primary refresh mechanism (Vercel Cron as backup)

## Quick Start

```bash
# Make script executable
chmod +x aws/deploy.sh

# Run automated deployment
./aws/deploy.sh
```

The script will:
1. ✅ Check AWS CLI and credentials
2. ✅ Create IAM role
3. ✅ Build and package Lambda function
4. ✅ Deploy to AWS Lambda
5. ✅ Configure environment variables from `.env.local`
6. ✅ Set up EventBridge triggers (6 AM & 7 AM UTC)
7. ✅ Test the deployment

## Architecture

**Primary (Lambda + EventBridge):**
- Triggers: 6 AM & 7 AM UTC (2 independent runs)
- Saves to: Vercel Blob + Edge Config
- Logs: CloudWatch

**Backup (Vercel Cron):**
- Triggers: 4 AM & 5 AM UTC  
- Same save mechanism
- Runs only if primary fails

## Manual Commands

```bash
# From aws/lambda directory:

# Build & deploy updates
npm run deploy

# Test function
npm run test

# View logs
npm run logs

# Check errors
npm run errors
```

## Environment Variables

Set via `aws/deploy.sh` (reads from `.env.local`):

- `SERPER_API_KEY` — Google Serper API
- `SPOTIFY_CLIENT_ID` — Spotify API
- `SPOTIFY_CLIENT_SECRET` — Spotify API
- `SPOTIFY_SHOW_IDS` — 30 podcast IDs (comma-separated)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob
- `EDGE_CONFIG_ID` — Vercel Edge Config
- `VERCEL_API_TOKEN` — Vercel API

## Troubleshooting

**Function won't invoke:**
```bash
# Check EventBridge rules
aws events list-rules

# Check Lambda role permissions
aws iam get-role --role-name atlanta-gleaner-lambda-role
```

**Feed not updating:**
```bash
# View CloudWatch logs
npm run logs

# Check Blob write
curl https://blob.vercel-storage.com/news-feed-backup.json \
  -H "Authorization: Bearer $BLOB_READ_WRITE_TOKEN"
```

**Rate limiting:**
- Lambda has built-in concurrency limiting (5 shows at a time)
- Spotify API: Check quota in Spotify dashboard
- Serper: Check monthly quota at serper.dev

## Files

- `news-feed-refresh.ts` — Source code (TypeScript)
- `index.js` — Compiled Lambda handler
- `function.zip` — Deployable package
- `package.json` — Dependencies & deploy scripts
- `DEPLOYMENT.md` — Detailed setup guide

## Monitoring

Set up CloudWatch alarms (optional):

```bash
# Lambda error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name atlanta-gleaner-lambda-errors \
  --alarm-actions arn:aws:sns:REGION:ACCOUNT:YOUR_SNS_TOPIC \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 3600 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --dimensions Name=FunctionName,Value=atlanta-gleaner-news-refresh
```

## See Also

- [DEPLOYMENT.md](./DEPLOYMENT.md) — Full deployment instructions
