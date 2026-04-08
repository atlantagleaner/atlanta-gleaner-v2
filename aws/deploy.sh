#!/bin/bash
set -e

# Atlanta Gleaner Lambda Deployment Script
# Automates AWS Lambda setup and EventBridge configuration

FUNCTION_NAME="atlanta-gleaner-news-refresh"
ROLE_NAME="atlanta-gleaner-lambda-role"
REGION=${AWS_REGION:-us-east-1}
RUNTIME="nodejs18.x"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
  echo -e "${YELLOW}Checking prerequisites...${NC}"

  if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Install it: https://aws.amazon.com/cli/${NC}"
    exit 1
  fi

  if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Install it: https://nodejs.org/${NC}"
    exit 1
  fi

  echo -e "${GREEN}✓ Prerequisites OK${NC}"
}

# Get AWS account ID
get_account_id() {
  AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Failed to get AWS account ID. Check your AWS credentials.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ AWS Account: $AWS_ACCOUNT_ID${NC}"
}

# Create IAM role
create_iam_role() {
  echo -e "${YELLOW}Setting up IAM role...${NC}"

  # Check if role exists
  if aws iam get-role --role-name $ROLE_NAME &> /dev/null; then
    echo -e "${GREEN}✓ IAM role already exists${NC}"
    return
  fi

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

  aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file:///tmp/lambda-trust-policy.json \
    --region $REGION > /dev/null

  aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
    --region $REGION

  echo -e "${GREEN}✓ IAM role created${NC}"
  sleep 10  # Wait for role to propagate
}

# Build and package
build_function() {
  echo -e "${YELLOW}Building Lambda function...${NC}"

  cd aws/lambda
  npm run build > /dev/null 2>&1
  npm run zip > /dev/null 2>&1

  echo -e "${GREEN}✓ Function packaged${NC}"
  cd - > /dev/null
}

# Create or update Lambda function
deploy_function() {
  echo -e "${YELLOW}Deploying Lambda function...${NC}"

  ROLE_ARN="arn:aws:iam::$AWS_ACCOUNT_ID:role/$ROLE_NAME"

  # Check if function exists
  if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &> /dev/null; then
    echo "Updating existing function..."
    aws lambda update-function-code \
      --function-name $FUNCTION_NAME \
      --zip-file fileb://aws/lambda/function.zip \
      --region $REGION > /dev/null
  else
    echo "Creating new function..."
    aws lambda create-function \
      --function-name $FUNCTION_NAME \
      --runtime $RUNTIME \
      --role $ROLE_ARN \
      --handler index.handler \
      --zip-file fileb://aws/lambda/function.zip \
      --timeout 60 \
      --memory-size 512 \
      --region $REGION > /dev/null
  fi

  echo -e "${GREEN}✓ Lambda function deployed${NC}"
}

# Update environment variables
update_env_vars() {
  echo -e "${YELLOW}Updating environment variables...${NC}"

  # Load from .env.local if it exists
  if [ -f .env.local ]; then
    source .env.local
  else
    echo -e "${RED}❌ .env.local not found${NC}"
    exit 1
  fi

  aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment "Variables={
      SERPER_API_KEY=$SERPER_API_KEY,
      SPOTIFY_CLIENT_ID=$SPOTIFY_CLIENT_ID,
      SPOTIFY_CLIENT_SECRET=$SPOTIFY_CLIENT_SECRET,
      SPOTIFY_SHOW_IDS=07SjDmKb9iliEzpNcN2xGD,1lUPomulZRPquVAOOd56EW,6mTel3azvnK8isLs4VujvF,3IcA76e8ZV0NNSJ81XHQUg,4hI3rQ4C0e15rP3YKLKPut,7Cvsbcjhtur7nplC148TWy,4Zkj8TTa7XAZYI6aFetlec,3Lk9LufHHM9AzVoyYvcI7R,2ejvdShhn5D9tlVbb5vj9B,05lvdf9T77KE6y4gyMGEsD,3iCqE2fH3ETuXx67BWqFPV,34RuD4w8IVNm49Ge9qzjwT,6Z0jGDQp46d69cja0EUFQe,1mNsuXfG95Lf76YQeVMuo1,5nvRkVMH58SelKZYZFZx1S,2hmkzUtix0qTqvtpPcMzEL,2rTT1klKUoQNuaW2Ah19Pa,6Ijz5uEUxN6FvJI49ZGJAJ,0QCiNINmwgA6X4Z4nlnh5G,5lY4b5PGOvMuOYOjOVEcb9,0ofXAdFIQQRsCYj9754UFx,2VRS1IJCTn2Nlkg33ZVfkM,4ZTHlQzCm7ipnRn1ypnl1Z,08F60fHBihlcqWZTr7Thzc,1vfOw64nKjQ8LzZDPCfRaO,1sgWaKtQxwfjUpZnnK8r7J,6XKe8xy5P16OLrkBW9oz0k,08F60fHBihlcqWZTr7Thzc,6Mwp0XM22DGXDva9SE3J8x,269rqhbJIyaCbIzEI4BzCz,
      BLOB_READ_WRITE_TOKEN=$BLOB_READ_WRITE_TOKEN,
      EDGE_CONFIG_ID=$EDGE_CONFIG_ID,
      VERCEL_API_TOKEN=$VERCEL_API_TOKEN
    }" \
    --region $REGION > /dev/null

  echo -e "${GREEN}✓ Environment variables updated${NC}"
}

# Create EventBridge rules
create_eventbridge_rules() {
  echo -e "${YELLOW}Setting up EventBridge triggers...${NC}"

  # Create 6 AM UTC rule
  aws events put-rule \
    --name atlanta-gleaner-refresh-6am \
    --schedule-expression "cron(0 6 * * ? *)" \
    --state ENABLED \
    --region $REGION > /dev/null 2>&1 || true

  # Create 7 AM UTC rule
  aws events put-rule \
    --name atlanta-gleaner-refresh-7am \
    --schedule-expression "cron(0 7 * * ? *)" \
    --state ENABLED \
    --region $REGION > /dev/null 2>&1 || true

  FUNCTION_ARN="arn:aws:lambda:$REGION:$AWS_ACCOUNT_ID:function:$FUNCTION_NAME"

  # Add Lambda targets
  aws events put-targets \
    --rule atlanta-gleaner-refresh-6am \
    --targets "Id"="1","Arn"="$FUNCTION_ARN" \
    --region $REGION > /dev/null 2>&1 || true

  aws events put-targets \
    --rule atlanta-gleaner-refresh-7am \
    --targets "Id"="1","Arn"="$FUNCTION_ARN" \
    --region $REGION > /dev/null 2>&1 || true

  # Grant EventBridge permission to invoke Lambda
  aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id AllowEventBridgeInvoke \
    --action lambda:InvokeFunction \
    --principal events.amazonaws.com \
    --source-arn "arn:aws:events:$REGION:$AWS_ACCOUNT_ID:rule/atlanta-gleaner-refresh-*" \
    --region $REGION > /dev/null 2>&1 || true

  echo -e "${GREEN}✓ EventBridge triggers configured${NC}"
}

# Test the function
test_function() {
  echo -e "${YELLOW}Testing Lambda function...${NC}"

  cd aws/lambda
  npm run test > /dev/null 2>&1

  if [ -f response.json ]; then
    if grep -q "\"ok\": true" response.json; then
      echo -e "${GREEN}✓ Lambda test successful${NC}"
      cat response.json
    else
      echo -e "${YELLOW}⚠ Lambda test returned unexpected response${NC}"
      cat response.json
    fi
  fi
  cd - > /dev/null
}

# Main deployment flow
main() {
  echo -e "${GREEN}=====================================${NC}"
  echo -e "${GREEN}Atlanta Gleaner Lambda Deployment${NC}"
  echo -e "${GREEN}=====================================${NC}\n"

  check_prerequisites
  get_account_id
  create_iam_role
  build_function
  deploy_function
  update_env_vars
  create_eventbridge_rules

  echo -e "\n${GREEN}=====================================${NC}"
  echo -e "${GREEN}✓ Deployment Complete!${NC}"
  echo -e "${GREEN}=====================================${NC}\n"

  echo "Lambda Function: $FUNCTION_NAME"
  echo "AWS Region: $REGION"
  echo "EventBridge Triggers: 6 AM & 7 AM UTC"
  echo ""
  echo "Next steps:"
  echo "1. Run test: npm run test (from aws/lambda)"
  echo "2. View logs: npm run logs (from aws/lambda)"
  echo "3. Check EventBridge: aws events list-rules"
  echo ""
  echo "Vercel Cron (backup) runs at: 4 AM & 5 AM UTC"
}

main "$@"
