import { NextResponse } from 'next/server';
import OpenAI from 'openai/index.mjs';

const APIKEY = process.env.OPENAI_API_KEY;

if (!APIKEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({ apiKey: APIKEY });

export async function POST(request: Request) {
    try {
      const { message } = await request.json();

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: `You are an invoice information extraction agent. Your only task is to extract and return 3 pieces of information in JSON format:
          1. recipient: The name of who the invoice is for
          2. description: A brief description of the service/object
          3. suggestedName: A clean, formatted name for the invoice (No underscores, spaces if needed)
          
          Return ONLY the JSON object, nothing else.`
        },
        {
          role: "user",
          content: message
        }
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", 
        messages,
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0].message.content;
      return NextResponse.json({ message: response });
    } catch (error) {
      console.error("Error processing request:", error);
      return NextResponse.json(
        { error: "Error occurred while processing the request" },
        { status: 500 }
      );
    }
}