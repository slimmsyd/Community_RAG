from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from twilio.rest import Client
import logging

load_dotenv()

app = FastAPI()

# Pydantic model for request validation
class IdeaSubmission(BaseModel):
    email: str
    phone: str
    company: str
    idea: str

# Initialize Twilio client
twilio_client = Client(
    os.getenv('TWILIO_ACCOUNT_SID'),
    os.getenv('TWILIO_AUTH_TOKEN')
)

@app.post("/analyze-idea")
async def analyze_idea(submission: IdeaSubmission):
    logger
    try:
        # Prepare encouraging response
        response_message = f"""Thank you for sharing your vision with us! 
        
We're excited about your idea for {submission.company} and look forward to exploring how we can bring it to life together.

Our team will reach out to you within the next 2 business days to discuss your project in detail. We can't wait to collaborate with you!

Best regards,
The Oncode Team"""

        # Send SMS notification to admin
        message = twilio_client.messages.create(
            body=f"""New Project Inquiry:
Company: {submission.company}
Email: {submission.email}
Phone: {submission.phone}
Idea: {submission.idea}""",
            from_=os.getenv('TWILIO_PHONE_NUMBER'),
            to=os.getenv('YOUR_PHONE_NUMBER')
        )

        return {
            "success": True,
            "message": response_message,
            "message_sid": message.sid
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 