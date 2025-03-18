#!/bin/bash
set -e

# Configuration
APP_NAME="pdf-llm-api"
VERSION=$(date +"%Y%m%d%H%M%S")
IMAGE_NAME="${APP_NAME}:${VERSION}"
LATEST_IMAGE="${APP_NAME}:latest"

# Build the Docker image
echo "Building Docker image: ${IMAGE_NAME}..."
docker build -t ${IMAGE_NAME} -t ${LATEST_IMAGE} .

# Check if EC2_HOST environment variable is set
if [ -z "${EC2_HOST}" ]; then
  echo "EC2_HOST environment variable not set."
  echo "If you want to deploy to EC2, please export EC2_HOST=<ec2-username>@<ec2-ip-address>"
  exit 0
else
  # Save the Docker image to a tar file
  echo "Saving Docker image to a tar file..."
  docker save ${LATEST_IMAGE} | gzip > ${APP_NAME}.tar.gz

  # Copy the Docker image to the EC2 instance
  echo "Copying Docker image to EC2 instance..."
  scp ${APP_NAME}.tar.gz ${EC2_HOST}:~/

  # Copy docker-compose.yml to the EC2 instance
  echo "Copying docker-compose.yml to EC2 instance..."
  scp docker-compose.yml ${EC2_HOST}:~/

  # Load the Docker image on the EC2 instance and start the container
  echo "Loading Docker image and starting container on EC2 instance..."
  ssh ${EC2_HOST} << 'EOF'
    # Load the Docker image
    docker load < ~/pdf-llm-api.tar.gz
    
    # Stop any running container
    docker-compose down || true
    
    # Start the container
    docker-compose up -d
    
    # Clean up
    rm ~/pdf-llm-api.tar.gz
EOF

  # Clean up local tar file
  rm ${APP_NAME}.tar.gz

  echo "Deployment complete! Application is running on EC2."
  echo "Access the API at http://<ec2-ip-address>:5002"
fi 