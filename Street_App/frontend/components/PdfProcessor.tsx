'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface DocumentChunk {
  text: string;
  metadata: Record<string, any>;
}

interface PdfProcessorProps {
  apiEndpoint?: string;
}

export default function PdfProcessor({ apiEndpoint = '/api' }: PdfProcessorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [documentChunks, setDocumentChunks] = useState<DocumentChunk[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setFile(null);
      setError('Please select a valid PDF file.');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiEndpoint}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      setSessionId(data.session_id);
      setSummary(data.summary);
      setDocumentChunks(data.chunks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuestion = async () => {
    if (!question.trim()) {
      setError('Please enter a question.');
      return;
    }

    if (documentChunks.length === 0) {
      setError('Please upload a PDF first.');
      return;
    }

    setIsQuerying(true);
    setError('');

    try {
      const response = await fetch(`${apiEndpoint}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chunks: documentChunks,
          question: question,
        }),
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }

      const data = await response.json();
      setAnswer(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsQuerying(false);
    }
  };

  const resetForm = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFile(null);
    setSummary('');
    setQuestion('');
    setAnswer('');
    setSessionId('');
    setDocumentChunks([]);
    setError('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>PDF Document Processor</CardTitle>
          <CardDescription>
            Upload a PDF document and ask questions about its content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="pdf-upload" className="block text-sm font-medium mb-1">
                Upload PDF
              </label>
              <div className="flex gap-2">
                <Input
                  id="pdf-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Button 
                  onClick={handleUpload} 
                  disabled={!file || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : 'Upload'}
                </Button>
              </div>
              {file && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected file: {file.name}
                </p>
              )}
            </div>
            
            {summary && (
              <div>
                <h3 className="text-lg font-medium mb-2">Document Summary</h3>
                <div className="bg-muted rounded-md p-4 text-sm whitespace-pre-wrap">
                  {summary}
                </div>
              </div>
            )}
            
            {documentChunks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Ask a Question</h3>
                <Textarea
                  placeholder="What would you like to know about this document?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button 
                  onClick={handleQuestion} 
                  disabled={!question.trim() || isQuerying}
                  className="w-full"
                >
                  {isQuerying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting Answer...
                    </>
                  ) : 'Ask Question'}
                </Button>
              </div>
            )}
            
            {answer && (
              <div>
                <h3 className="text-lg font-medium mb-2">Answer</h3>
                <div className="bg-muted rounded-md p-4 whitespace-pre-wrap">
                  {answer}
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md">
                {error}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={resetForm}>
            Reset
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 