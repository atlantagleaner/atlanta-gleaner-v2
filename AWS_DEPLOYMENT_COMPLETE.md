# AWS Lambda Deployment - Complete ✓

**Date:** 2026-04-08  
**Status:** Production Ready

## Summary

Lambda + EventBridge are now your **primary** news feed refresh mechanism, with Vercel Cron as **backup**.

## Deployment Details

### Lambda Function
- **Name:** atlanta-gleaner-news-refresh
- **Region:** us-east-2
- **Account ID:** 947978600865
- **Runtime:** Node.js 24.x
- **Memory:** 512 MB
- **Timeout:** 60 seconds
- **Status:** Active ✓

### Environment Variables (Complete)
- [x] SPOTIFY_SHOW_IDS (30 podcasts)
- [x] SPOTIFY_CLIENT_ID
- [x] SPOTIFY_CLIENT_SECRET
- [x] SERPER_API_KEY
- [x] YOUTUBE_API_KEY
- [x] BLOB_READ_WRITE_TOKEN
- [x] EDGE_CONFIG_ID
- [x] EDGE_CONFIG
- [x] VERCEL_API_TOKEN

### EventBridge Triggers
| Rule Name | Schedule | Time | Status |
|-----------|----------|------|--------|
| atlanta-gleaner-refresh-6am | cron(0 6 * * ? *) | 6 AM UTC | Enabled ✓ |
| atlanta-gleaner-refresh-7am | cron(0 7 * * ? *) | 7 AM UTC | Enabled ✓ |
| atlanta-gleaner-news-refresh-daily | cron(0 17 * * ? *) | 5 PM UTC | Enabled |

### Vercel Cron (Backup)
| Schedule | Time | Status |
|----------|------|--------|
| cron(30 2 * * *) | 2:30 AM UTC | Enabled |
| cron(30 3 * * *) | 3:30 AM UTC | Enabled |
| cron(0 4 * * *) | 4 AM UTC | Enabled |
| cron(0 5 * * *) | 5 AM UTC | Enabled |

## Test Results

**Last invocation:** 2026-04-08 13:35:30 UTC
- Status: Success ✓
- Items returned: 20
- Duration: 7663ms
- Spotify episodes: Included ✓

## Architecture

```
┌─────────────────────────────────────────┐
│         EventBridge (UTC Times)          │
├─────────────────────────────────────────┤
│ • 6 AM - atlanta-gleaner-refresh-6am    │
│ • 7 AM - atlanta-gleaner-refresh-7am    │
│ • 5 PM - atlanta-gleaner-news-refresh   │
│         (legacy, can be removed)        │
└──────────────┬──────────────────────────┘
               │ Primary
               ↓
   ┌──────────────────────────┐
   │   AWS Lambda Function    │
   │ atlanta-gleaner-         │
   │ news-refresh             │
   │ • 512 MB RAM             │
   │ • 60s timeout            │
   └──────────────┬───────────┘
                  │
                  ↓
    ┌─────────────────────────┐
    │   Vercel Blob + Edge    │
    │   Config (Feed Cache)   │
    └────────────┬────────────┘
                 │
                 ↓
        ┌────────────────┐
        │  Live Website  │
        │  news endpoint │
        └────────────────┘

BACKUP: Vercel Cron (4 AM & 5 AM UTC)
        └─ Only runs if Lambda fails
```

## How It Works

1. **6 AM & 7 AM UTC:** EventBridge triggers Lambda
2. **Lambda executes:**
   - Fetches news via Serper API
   - Fetches Spotify podcast episodes (30 shows)
   - Fetches YouTube series (StarTalk, PBS Space Time, Grab Bag)
   - Scores & deduplicates
   - Saves to Vercel Blob
   - Updates Edge Config
3. **Website reads from Edge Config** → News is live
4. **Backup:** If Lambda fails, Vercel Cron triggers at 4/5 AM

## Monitoring

### View Lambda Logs
Go to AWS CloudWatch:
- Log Group: `/aws/lambda/atlanta-gleaner-news-refresh`
- Recent logs: Filter by date/time

### Manual Test
```bash
# Configure AWS credentials first
aws configure

# View logs
aws logs tail /aws/lambda/atlanta-gleaner-news-refresh --follow

# Invoke manually
aws lambda invoke --function-name atlanta-gleaner-news-refresh response.json
cat response.json
```

## Next Steps (Optional)

1. **Remove legacy 5 PM rule** (optional, doesn't hurt):
   ```bash
   aws events delete-rule --name atlanta-gleaner-news-refresh-daily
   ```

2. **Set up CloudWatch alarms** for errors:
   - Monitor Lambda error rate
   - Alert on feed update failures

3. **Store credentials securely:**
   - Use AWS Secrets Manager (not env vars)
   - Rotate API keys periodically

## Troubleshooting

### Feed not updating
1. Check Lambda logs in CloudWatch
2. Verify EventBridge rule is enabled
3. Test manually with AWS CLI invoke

### Spotify episodes missing
- Verify SPOTIFY_SHOW_IDS env var is set
- Check Spotify API quota/status
- Review Lambda error logs

### Rate limiting errors
- Spotify: Built-in 5-show concurrency limit
- Serper: Check monthly quota
- YouTube: Increase Lambda timeout if needed

## Security Notes

⚠️ **Credentials are stored in Lambda environment variables**
- In production, use AWS Secrets Manager
- Rotate API keys periodically
- Review CloudWatch logs regularly
- Never share AWS credentials in git/chat

## Contact

For issues or updates, check:
- AWS CloudWatch Logs
- Lambda function configuration
- EventBridge rule status
- Vercel Edge Config + Blob status
