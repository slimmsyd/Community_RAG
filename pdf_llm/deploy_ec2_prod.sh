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
  echo "Please export EC2_HOST=<ec2-username>@<ec2-ip-address>"
  exit 1
fi

if [ -z "${EC2_DOMAIN}" ]; then
  echo "EC2_DOMAIN environment variable not set."
  echo "If you want to set up SSL, please export EC2_DOMAIN=<your-domain>"
  EC2_DOMAIN="localhost"
fi

if [ -z "${EC2_EMAIL}" ]; then
  echo "EC2_EMAIL environment variable not set."
  echo "If you want to set up SSL, please export EC2_EMAIL=<your-email>"
  EC2_EMAIL="admin@example.com"
fi

# Save the Docker image to a tar file
echo "Saving Docker image to a tar file..."
docker save ${LATEST_IMAGE} | gzip > ${APP_NAME}.tar.gz

# Create necessary directories on EC2
echo "Creating deployment directories on EC2..."
ssh ${EC2_HOST} "mkdir -p ~/pdf-llm-app ~/pdf-llm-app/certbot/conf ~/pdf-llm-app/certbot/www"

# Copy files to EC2
echo "Copying files to EC2 instance..."
scp ${APP_NAME}.tar.gz ${EC2_HOST}:~/pdf-llm-app/
scp docker-compose.prod.yml ${EC2_HOST}:~/pdf-llm-app/docker-compose.yml
scp nginx.conf ${EC2_HOST}:~/pdf-llm-app/
scp .env ${EC2_HOST}:~/pdf-llm-app/ || echo "Warning: No .env file found. You'll need to create one on the server."

# Set up SSL and deploy on EC2
echo "Setting up application on EC2 instance..."
ssh ${EC2_HOST} << EOF
  cd ~/pdf-llm-app
  
  # Update nginx.conf with the actual domain
  sed -i "s/api.yourdomain.com/${EC2_DOMAIN}/g" nginx.conf
  
  # Load the Docker image
  docker load < ${APP_NAME}.tar.gz
  
  # Stop any running containers
  docker-compose down || true
  
  # Start the containers
  docker-compose up -d
  
  # Clean up
  rm ${APP_NAME}.tar.gz
  
  echo "Checking if application is running..."
  sleep 10
  if curl -s http://localhost:5002/health > /dev/null; then
    echo "Application is running successfully!"
  else
    echo "Warning: Application might not be running properly. Check logs with: docker-compose logs"
  fi
EOF

# Clean up local tar file
rm ${APP_NAME}.tar.gz

# Instructions for setting up SSL
echo "Deployment complete! Application is running on EC2."
echo "Access the API at http://${EC2_DOMAIN}"
echo ""
echo "To set up SSL with Let's Encrypt:"
echo "1. Make sure your domain ${EC2_DOMAIN} is pointing to your EC2 instance"
echo "2. SSH into your EC2 instance and run:"
echo "   cd ~/pdf-llm-app"
echo "   docker-compose down"
echo "   # Uncomment the certbot section in docker-compose.yml"
echo "   # Update email and domain in docker-compose.yml"
echo "   docker-compose up -d"
echo "   # After certificates are issued, uncomment the SSL section in nginx.conf"
echo "   docker-compose restart nginx" 