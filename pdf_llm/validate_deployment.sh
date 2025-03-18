#!/bin/bash
set -e

# Configuration
if [ -z "$1" ]; then
  # If no argument provided, check localhost
  API_URL="http://localhost:5002"
else
  # Use the provided URL
  API_URL="$1"
fi

echo "Validating deployment at: $API_URL"

# Check health endpoint
echo "Checking health endpoint..."
HEALTH_RESPONSE=$(curl -s "$API_URL/health")
if [ "$HEALTH_RESPONSE" == '{"status":"healthy","version":"1.0.0"}' ]; then
  echo "✅ Health check passed!"
else
  echo "❌ Health check failed. Response: $HEALTH_RESPONSE"
  exit 1
fi

# Test PDF upload (requires a test PDF)
if [ -f "test.pdf" ]; then
  echo "Testing PDF upload..."
  UPLOAD_RESPONSE=$(curl -s -F "file=@test.pdf" "$API_URL/upload")
  if [[ "$UPLOAD_RESPONSE" == *"success"*"true"* ]]; then
    echo "✅ PDF upload test passed!"
    
    # Extract session_id from the response
    SESSION_ID=$(echo $UPLOAD_RESPONSE | grep -o '"session_id":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$SESSION_ID" ]; then
      echo "Session ID: $SESSION_ID"
      
      # Test querying the PDF
      echo "Testing PDF query..."
      QUERY_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"session_id\":\"$SESSION_ID\",\"question\":\"What is this document about?\",\"structured\":false}" "$API_URL/query")
      
      if [[ "$QUERY_RESPONSE" == *"answer"* ]]; then
        echo "✅ PDF query test passed!"
      else
        echo "❌ PDF query test failed. Response: $QUERY_RESPONSE"
      fi
    else
      echo "❌ Could not extract session ID from response: $UPLOAD_RESPONSE"
    fi
  else
    echo "❌ PDF upload test failed. Response: $UPLOAD_RESPONSE"
  fi
else
  echo "⚠️ No test.pdf found in current directory. Skipping upload and query tests."
fi

echo "Validation complete!" 