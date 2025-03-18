#!/bin/bash
set -e

# Update the system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
echo "Installing dependencies..."
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to the docker group
sudo usermod -aG docker ${USER}

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
echo "Setting up application directory..."
mkdir -p ~/pdf-llm-app
cd ~/pdf-llm-app

# Create .env file template
cat > .env << EOL
# Add your OpenAI API key here
OPENAI_API_KEY=your_openai_api_key_here
EOL

echo "Setup complete! Docker and Docker Compose have been installed."
echo "Please update the .env file with your actual API keys before running the application."
echo "To start the application, run: docker-compose up -d" 