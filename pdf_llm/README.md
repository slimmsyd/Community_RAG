# PDF LLM API

A robust API service for extracting information from PDF documents using Large Language Models.

## Features

- Upload PDF documents for processing
- Extract structured information from research papers
- Query the content of PDFs with natural language questions
- Stateful sessions for maintaining context during document analysis
- Docker-ready for easy deployment

## Local Development Setup

### Prerequisites

- Python 3.9+
- Docker and Docker Compose (for containerized deployment)
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pdf_llm
   ```

2. Set up a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

5. Run the application:
   ```bash
   python api.py
   ```
   Or use the provided script:
   ```bash
   ./run_api.sh
   ```

The API will be accessible at http://localhost:5002.

## Docker Deployment (Local)

1. Build and start the Docker container:
   ```bash
   docker-compose up --build
   ```

2. The API will be accessible at http://localhost:5002.

## AWS EC2 Deployment

### Prerequisites

- AWS account with EC2 access
- Domain name (optional, for SSL)
- SSH key pair for EC2 instance

### Step 1: Launch an EC2 Instance

1. Launch an EC2 instance with at least 2 vCPUs and 4GB RAM
2. Choose Ubuntu 22.04 LTS as the operating system
3. Configure security groups to allow:
   - SSH (port 22)
   - HTTP (port 80)
   - HTTPS (port 443)
   - Custom TCP (port 5002) - Optional for direct API access

### Step 2: Set Up the EC2 Instance

1. SSH into your EC2 instance:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-public-ip
   ```

2. Run the setup script to install Docker and Docker Compose:
   ```bash
   curl -s https://raw.githubusercontent.com/your-repo/pdf-llm/main/ec2_setup.sh | bash
   ```
   
   Or manually copy and run the `ec2_setup.sh` script from this repository.

### Step 3: Deploy the Application

#### Method 1: Automated Deployment

1. Set environment variables for deployment:
   ```bash
   export EC2_HOST=ubuntu@your-ec2-public-ip
   export EC2_DOMAIN=your-domain.com  # Optional, for SSL
   export EC2_EMAIL=your-email@example.com  # Optional, for SSL
   ```

2. Run the deployment script:
   ```bash
   ./deploy_ec2_prod.sh
   ```

#### Method 2: Manual Deployment

1. Build the Docker image locally:
   ```bash
   docker build -t pdf-llm-api:latest .
   ```

2. Save the image to a tar file:
   ```bash
   docker save pdf-llm-api:latest | gzip > pdf-llm-api.tar.gz
   ```

3. Copy files to EC2:
   ```bash
   scp pdf-llm-api.tar.gz docker-compose.prod.yml nginx.conf .env ubuntu@your-ec2-public-ip:~/pdf-llm-app/
   ```

4. SSH into the EC2 instance and set up the application:
   ```bash
   ssh ubuntu@your-ec2-public-ip
   cd ~/pdf-llm-app
   mv docker-compose.prod.yml docker-compose.yml
   docker load < pdf-llm-api.tar.gz
   docker-compose up -d
   ```

### Step 4: Set Up SSL (Optional)

1. Make sure your domain is pointing to your EC2 instance's IP address
2. SSH into your EC2 instance
3. Edit the `docker-compose.yml` file to uncomment the certbot service
4. Update the email and domain in the certbot service
5. Restart the containers:
   ```bash
   docker-compose down
   docker-compose up -d
   ```
6. After certificates are issued, edit the `nginx.conf` file to uncomment the SSL server block
7. Restart Nginx:
   ```bash
   docker-compose restart nginx
   ```

## API Usage

### Health Check

```
GET /health
```

### Upload a PDF

```
POST /upload
```
Form data:
- `file`: PDF file

Response:
```json
{
  "success": true,
  "session_id": "unique-session-id",
  "summary": "Document summary",
  "message": "PDF processed successfully"
}
```

### Query a Document

```
POST /query
```
JSON payload:
```json
{
  "session_id": "unique-session-id",
  "question": "What is the main topic of this paper?",
  "structured": false
}
```

Response:
```json
{
  "answer": "The main topic of this paper is..."
}
```

For structured information, set `structured: true` in the request.

## Monitoring and Maintenance

### Viewing Logs

```bash
docker-compose logs -f
```

### Updating the Application

1. Pull the latest code changes
2. Rebuild and restart the containers:
   ```bash
   docker-compose down
   docker-compose up --build -d
   ```

### Backup and Restore

The application uses Docker volumes for persistent storage. To backup:

```bash
docker run --rm -v pdf-llm-app_pdf_uploads:/uploads -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz /uploads
docker run --rm -v pdf-llm-app_pdf_vectorstores:/vectorstores -v $(pwd):/backup alpine tar czf /backup/vectorstores-backup.tar.gz /vectorstores
```

To restore:

```bash
docker run --rm -v pdf-llm-app_pdf_uploads:/uploads -v $(pwd):/backup alpine sh -c "rm -rf /uploads/* && tar xzf /backup/uploads-backup.tar.gz -C /"
docker run --rm -v pdf-llm-app_pdf_vectorstores:/vectorstores -v $(pwd):/backup alpine sh -c "rm -rf /vectorstores/* && tar xzf /backup/vectorstores-backup.tar.gz -C /"
```

## Troubleshooting

- **API returns a 500 error**: Check the logs for errors: `docker-compose logs -f pdf-llm-api`
- **Vector store not found**: Ensure the session ID is correct and the PDF was processed successfully
- **Rate limits from OpenAI**: Check your OpenAI API usage and limits
- **Memory issues**: Increase the memory allocation in the Docker configuration

## License

[MIT License](LICENSE) 