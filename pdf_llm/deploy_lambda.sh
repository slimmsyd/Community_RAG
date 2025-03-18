#!/bin/bash

# This script packages and deploys the PDF processing Lambda function to AWS
# Required: AWS CLI installed and configured with appropriate permissions

# Configuration
LAMBDA_FUNCTION_NAME="pdf-llm-processor"
S3_BUCKET="${S3_BUCKET:-pdf-llm-storage}" # Use env var or default
REGION="${AWS_REGION:-us-east-1}" # Use env var or default
LAYER_NAME="pdf-llm-dependencies"
TIMEOUT=300 # Lambda timeout in seconds
MEMORY_SIZE=2048 # Lambda memory in MB

echo "=== PDF LLM Lambda Deployment ==="
echo "Function: $LAMBDA_FUNCTION_NAME"
echo "S3 Bucket: $S3_BUCKET"
echo "Region: $REGION"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it and configure your credentials."
    exit 1
fi

# Create temporary directory for packaging
TEMP_DIR=$(mktemp -d)
echo "Creating deployment package in $TEMP_DIR"

# Create the S3 bucket if it doesn't exist
echo "Checking if S3 bucket exists..."
if ! aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
    echo "Creating S3 bucket: $S3_BUCKET"
    aws s3api create-bucket --bucket "$S3_BUCKET" --region "$REGION" --create-bucket-configuration LocationConstraint="$REGION"
    
    # Enable versioning on the bucket
    aws s3api put-bucket-versioning --bucket "$S3_BUCKET" --versioning-configuration Status=Enabled
    
    echo "Configuring bucket policy for Lambda access..."
    cat > "${TEMP_DIR}/bucket-policy.json" << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::${S3_BUCKET}",
                "arn:aws:s3:::${S3_BUCKET}/*"
            ]
        }
    ]
}
EOF
    aws s3api put-bucket-policy --bucket "$S3_BUCKET" --policy file://"${TEMP_DIR}/bucket-policy.json"
fi

# Create the Lambda function package
echo "Creating Lambda function package..."
mkdir -p "${TEMP_DIR}/function"
cp lambda_handler.py "${TEMP_DIR}/function/"
cp .env "${TEMP_DIR}/function/" 2>/dev/null || echo "Warning: .env file not found, make sure environment variables are set in Lambda console"

# Create a zip file for the function
cd "${TEMP_DIR}/function"
zip -r "../function.zip" .
cd -

# Create a Lambda layer for dependencies
echo "Creating Lambda layer for dependencies..."
mkdir -p "${TEMP_DIR}/layer/python"
pip install -r requirements-lambda.txt -t "${TEMP_DIR}/layer/python" --no-cache-dir

# Create a zip file for the layer
cd "${TEMP_DIR}/layer"
zip -r "../layer.zip" .
cd -

# Check if the Lambda function already exists
FUNCTION_EXISTS=$(aws lambda list-functions --region "$REGION" --query "Functions[?FunctionName=='$LAMBDA_FUNCTION_NAME'].FunctionName" --output text)

# Upload the layer to AWS
echo "Uploading Lambda layer..."
LAYER_VERSION=$(aws lambda publish-layer-version \
    --layer-name "$LAYER_NAME" \
    --description "Dependencies for PDF LLM processor" \
    --zip-file "fileb://${TEMP_DIR}/layer.zip" \
    --compatible-runtimes python3.9 python3.10 python3.11 \
    --region "$REGION" \
    --query 'LayerVersionArn' \
    --output text)

echo "Layer ARN: $LAYER_VERSION"

if [ -z "$FUNCTION_EXISTS" ]; then
    # Create the Lambda function
    echo "Creating new Lambda function..."
    
    # Create IAM role for Lambda
    ROLE_NAME="pdf-llm-lambda-role"
    ROLE_EXISTS=$(aws iam list-roles --query "Roles[?RoleName=='$ROLE_NAME'].RoleName" --output text)
    
    if [ -z "$ROLE_EXISTS" ]; then
        echo "Creating IAM role for Lambda..."
        
        # Create trust policy document
        cat > "${TEMP_DIR}/trust-policy.json" << EOF
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

        # Create the role
        ROLE_ARN=$(aws iam create-role \
            --role-name "$ROLE_NAME" \
            --assume-role-policy-document file://"${TEMP_DIR}/trust-policy.json" \
            --query 'Role.Arn' \
            --output text)
        
        # Attach policies
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/AmazonS3FullAccess"
        
        # Wait for role propagation
        echo "Waiting for IAM role propagation..."
        sleep 10
    else
        ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
    fi
    
    echo "Role ARN: $ROLE_ARN"
    
    # Create the Lambda function
    FUNCTION_ARN=$(aws lambda create-function \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --runtime python3.9 \
        --handler lambda_handler.lambda_handler \
        --role "$ROLE_ARN" \
        --zip-file "fileb://${TEMP_DIR}/function.zip" \
        --environment "Variables={S3_BUCKET=$S3_BUCKET}" \
        --timeout $TIMEOUT \
        --memory-size $MEMORY_SIZE \
        --region "$REGION" \
        --layers "$LAYER_VERSION" \
        --query 'FunctionArn' \
        --output text)
    
    echo "Function created: $FUNCTION_ARN"
else
    # Update the existing Lambda function
    echo "Updating existing Lambda function..."
    
    aws lambda update-function-code \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --zip-file "fileb://${TEMP_DIR}/function.zip" \
        --region "$REGION" \
        --publish \
        --output text > /dev/null
    
    aws lambda update-function-configuration \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --layers "$LAYER_VERSION" \
        --environment "Variables={S3_BUCKET=$S3_BUCKET}" \
        --timeout $TIMEOUT \
        --memory-size $MEMORY_SIZE \
        --region "$REGION" \
        --output text > /dev/null
    
    echo "Function updated: $LAMBDA_FUNCTION_NAME"
fi

# Configure API Gateway if not already
API_ID=$(aws apigateway get-rest-apis --region "$REGION" --query "items[?name=='pdf-llm-api'].id" --output text)

if [ -z "$API_ID" ]; then
    echo "Creating API Gateway..."
    
    API_ID=$(aws apigateway create-rest-api \
        --name "pdf-llm-api" \
        --description "API for PDF LLM processor" \
        --region "$REGION" \
        --endpoint-configuration "types=REGIONAL" \
        --query 'id' \
        --output text)
    
    echo "API created: $API_ID"
    
    # Get the root resource ID
    ROOT_RESOURCE_ID=$(aws apigateway get-resources \
        --rest-api-id "$API_ID" \
        --region "$REGION" \
        --query 'items[?path==`/`].id' \
        --output text)
    
    # Create resources
    PDF_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id "$API_ID" \
        --parent-id "$ROOT_RESOURCE_ID" \
        --path-part "pdf" \
        --region "$REGION" \
        --query 'id' \
        --output text)
    
    # Create upload resource
    UPLOAD_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id "$API_ID" \
        --parent-id "$PDF_RESOURCE_ID" \
        --path-part "upload" \
        --region "$REGION" \
        --query 'id' \
        --output text)
    
    # Create query resource
    QUERY_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id "$API_ID" \
        --parent-id "$PDF_RESOURCE_ID" \
        --path-part "query" \
        --region "$REGION" \
        --query 'id' \
        --output text)
    
    # Create health resource
    HEALTH_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id "$API_ID" \
        --parent-id "$PDF_RESOURCE_ID" \
        --path-part "health" \
        --region "$REGION" \
        --query 'id' \
        --output text)
    
    # Set up CORS
    # For the upload endpoint
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$UPLOAD_RESOURCE_ID" \
        --http-method "OPTIONS" \
        --authorization-type "NONE" \
        --region "$REGION"
    
    aws apigateway put-method-response \
        --rest-api-id "$API_ID" \
        --resource-id "$UPLOAD_RESOURCE_ID" \
        --http-method "OPTIONS" \
        --status-code "200" \
        --response-parameters "method.response.header.Access-Control-Allow-Origin=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Headers=true" \
        --region "$REGION"
    
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$UPLOAD_RESOURCE_ID" \
        --http-method "OPTIONS" \
        --type "MOCK" \
        --integration-http-method "OPTIONS" \
        --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
        --region "$REGION"
    
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$UPLOAD_RESOURCE_ID" \
        --http-method "OPTIONS" \
        --status-code "200" \
        --response-parameters "method.response.header.Access-Control-Allow-Origin='\"*\"',method.response.header.Access-Control-Allow-Methods='\"POST,OPTIONS\"',method.response.header.Access-Control-Allow-Headers='\"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token\"'" \
        --region "$REGION"
    
    # For the query endpoint
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$QUERY_RESOURCE_ID" \
        --http-method "OPTIONS" \
        --authorization-type "NONE" \
        --region "$REGION"
    
    aws apigateway put-method-response \
        --rest-api-id "$API_ID" \
        --resource-id "$QUERY_RESOURCE_ID" \
        --http-method "OPTIONS" \
        --status-code "200" \
        --response-parameters "method.response.header.Access-Control-Allow-Origin=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Headers=true" \
        --region "$REGION"
    
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$QUERY_RESOURCE_ID" \
        --http-method "OPTIONS" \
        --type "MOCK" \
        --integration-http-method "OPTIONS" \
        --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
        --region "$REGION"
    
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$QUERY_RESOURCE_ID" \
        --http-method "OPTIONS" \
        --status-code "200" \
        --response-parameters "method.response.header.Access-Control-Allow-Origin='\"*\"',method.response.header.Access-Control-Allow-Methods='\"POST,OPTIONS\"',method.response.header.Access-Control-Allow-Headers='\"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token\"'" \
        --region "$REGION"
    
    # Set up Lambda integration for upload endpoint (POST)
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$UPLOAD_RESOURCE_ID" \
        --http-method "POST" \
        --authorization-type "NONE" \
        --region "$REGION"
    
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$UPLOAD_RESOURCE_ID" \
        --http-method "POST" \
        --type "AWS_PROXY" \
        --integration-http-method "POST" \
        --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${REGION}:$(aws sts get-caller-identity --query 'Account' --output text):function:${LAMBDA_FUNCTION_NAME}/invocations" \
        --region "$REGION"
    
    aws apigateway put-method-response \
        --rest-api-id "$API_ID" \
        --resource-id "$UPLOAD_RESOURCE_ID" \
        --http-method "POST" \
        --status-code "200" \
        --response-parameters "method.response.header.Access-Control-Allow-Origin=true" \
        --region "$REGION"
    
    # Set up Lambda integration for query endpoint (POST)
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$QUERY_RESOURCE_ID" \
        --http-method "POST" \
        --authorization-type "NONE" \
        --region "$REGION"
    
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$QUERY_RESOURCE_ID" \
        --http-method "POST" \
        --type "AWS_PROXY" \
        --integration-http-method "POST" \
        --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${REGION}:$(aws sts get-caller-identity --query 'Account' --output text):function:${LAMBDA_FUNCTION_NAME}/invocations" \
        --region "$REGION"
    
    aws apigateway put-method-response \
        --rest-api-id "$API_ID" \
        --resource-id "$QUERY_RESOURCE_ID" \
        --http-method "POST" \
        --status-code "200" \
        --response-parameters "method.response.header.Access-Control-Allow-Origin=true" \
        --region "$REGION"
    
    # Set up Lambda integration for health endpoint (GET)
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$HEALTH_RESOURCE_ID" \
        --http-method "GET" \
        --authorization-type "NONE" \
        --region "$REGION"
    
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$HEALTH_RESOURCE_ID" \
        --http-method "GET" \
        --type "AWS_PROXY" \
        --integration-http-method "POST" \
        --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${REGION}:$(aws sts get-caller-identity --query 'Account' --output text):function:${LAMBDA_FUNCTION_NAME}/invocations" \
        --region "$REGION"
    
    aws apigateway put-method-response \
        --rest-api-id "$API_ID" \
        --resource-id "$HEALTH_RESOURCE_ID" \
        --http-method "GET" \
        --status-code "200" \
        --response-parameters "method.response.header.Access-Control-Allow-Origin=true" \
        --region "$REGION"
    
    # Grant API Gateway permission to invoke Lambda
    aws lambda add-permission \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --statement-id "apigateway-pdf-upload" \
        --action "lambda:InvokeFunction" \
        --principal "apigateway.amazonaws.com" \
        --source-arn "arn:aws:execute-api:${REGION}:$(aws sts get-caller-identity --query 'Account' --output text):${API_ID}/*/POST/pdf/upload" \
        --region "$REGION"
    
    aws lambda add-permission \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --statement-id "apigateway-pdf-query" \
        --action "lambda:InvokeFunction" \
        --principal "apigateway.amazonaws.com" \
        --source-arn "arn:aws:execute-api:${REGION}:$(aws sts get-caller-identity --query 'Account' --output text):${API_ID}/*/POST/pdf/query" \
        --region "$REGION"
    
    aws lambda add-permission \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --statement-id "apigateway-pdf-health" \
        --action "lambda:InvokeFunction" \
        --principal "apigateway.amazonaws.com" \
        --source-arn "arn:aws:execute-api:${REGION}:$(aws sts get-caller-identity --query 'Account' --output text):${API_ID}/*/GET/pdf/health" \
        --region "$REGION"
    
    # Deploy the API
    DEPLOYMENT_ID=$(aws apigateway create-deployment \
        --rest-api-id "$API_ID" \
        --stage-name "prod" \
        --region "$REGION" \
        --query 'id' \
        --output text)
    
    echo "API deployed: $DEPLOYMENT_ID"
else
    echo "API Gateway already exists: $API_ID"
    
    # Deploy the API again to update
    DEPLOYMENT_ID=$(aws apigateway create-deployment \
        --rest-api-id "$API_ID" \
        --stage-name "prod" \
        --region "$REGION" \
        --query 'id' \
        --output text)
    
    echo "API redeployed: $DEPLOYMENT_ID"
fi

# Display API endpoint URLs
API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"
echo ""
echo "=== Deployment Complete ==="
echo "API Endpoints:"
echo "Health Check: ${API_URL}/pdf/health"
echo "Upload PDF: ${API_URL}/pdf/upload"
echo "Query PDF: ${API_URL}/pdf/query"
echo ""
echo "Update your frontend .env.local with:"
echo "NEXT_PUBLIC_API_URL=${API_URL}/pdf"
echo ""

# Clean up temporary directory
rm -rf "$TEMP_DIR"
echo "Temporary files cleaned up" 