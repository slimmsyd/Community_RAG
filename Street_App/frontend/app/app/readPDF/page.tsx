"use client";

import React, { useState, useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import {
  FileText,
  Send,
  Loader2,
  MessageSquare,
  FileSearch,
  Code,
  FileCheck,
  SearchCheck,
  Copy,
  ListChecks
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useSession } from "next-auth/react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { 
  Upload, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  X,
  Clipboard
} from "lucide-react";

// Define the Flask API base URL
const API_BASE_URL =  "http://127.0.0.1:5002";
// const API_BASE_URL =  "http://agentp-Publi-bWOcL63CIdjh-1015568917.us-east-1.elb.amazonaws.com";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

type TabType = "chat" | "summary" | "codes" | "solicitation" | "requirements" | "analysis";

export default function ReadPDFPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { userProfile } = useUserProfile();
  const { toast } = useToast();
  
  // Add state for PDF session ID
  const [pdfSessionId, setPdfSessionId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Add new states for contract analysis
  const [contractSummary, setContractSummary] = useState<string>("");
  const [contractCodes, setContractCodes] = useState<string>("");
  const [isExtractingCodes, setIsExtractingCodes] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  
  // Add new states for solicitation analysis
  const [isSolicitationAnalyzing, setIsSolicitationAnalyzing] = useState(false);
  const [solicitationReport, setSolicitationReport] = useState<string | null>(null);
  const [solicitationDetails, setSolicitationDetails] = useState<any>(null);
  
  // Add these new state variables after the existing ones
  const [isExtractingRequirements, setIsExtractingRequirements] = useState(false);
  const [requirementsData, setRequirementsData] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const handleNavigation = (page: string) => {
    router.push(`/app/${page}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const processFile = async (file?: File) => {
    if (!file) return;
    
    if (file.type !== "application/pdf") {
      setDragError("Only PDF files are accepted");
      setTimeout(() => setDragError(null), 3000);
      return;
    }
    
    // Create object URL for display
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    setPdfName(file.name);
    
    // Set processing state
    setIsProcessing(true);
    
    try {
      // Create form data for API call
      const formData = new FormData();
      formData.append('file', file);
      
      // Call the Flask API to process the PDF
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to process PDF');
      }
      
      const data = await response.json();
      
      // Store the session ID for future queries
      setPdfSessionId(data.session_id);
      
      // Store the contract summary and codes
      setContractSummary(data.summary || "No summary available");
      setContractCodes(data.codes || "No codes extracted");
      
      // System message to inform PDF is loaded
      const loadedMessage: Message = {
        id: Date.now().toString(),
        content: `PDF "${file.name}" has been processed. You can now ask questions about it.`,
        role: "assistant",
        timestamp: new Date()
      };
      
      // Add the contract summary notification message
      const summaryMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `📄 I've analyzed this contract document. You can view the summary and extracted codes in the tabs above or ask me specific questions about the content.`,
        role: "assistant",
        timestamp: new Date()
      };
      
      // Add both messages
      setMessages(prev => [...prev, loadedMessage, summaryMessage]);
      
      toast({
        title: "Contract Processed",
        description: "Your contract document has been analyzed successfully.",
        variant: "default",
      });
      
      // Switch to the summary tab
      setActiveTab("summary");
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      
      // Show error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `There was an error processing "${file.name}". Please try again.`,
        role: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to process PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setDragError(null);
    }
  };

  const extractContractRequirements = async () => {
    if (!pdfSessionId) return;
    
    setIsExtractingCodes(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/extract_requirements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: pdfSessionId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to extract requirements');
      }
      
      const data = await response.json();
      
      // Create a formatted requirements message
      let requirementsText = "# Detailed Contract Requirements\n\n";
      
      if (data.far_clauses) {
        requirementsText += "## FAR Clauses\n" + data.far_clauses.answer + "\n\n";
      }
      
      if (data.regulatory_requirements) {
        requirementsText += "## Regulatory Requirements\n" + data.regulatory_requirements.answer + "\n\n";
      }
      
      if (data.certification_requirements) {
        requirementsText += "## Certification Requirements\n" + data.certification_requirements.answer + "\n\n";
      }
      
      if (data.technical_requirements) {
        requirementsText += "## Technical Requirements\n" + data.technical_requirements.answer + "\n\n";
      }
      
      if (data.experience_requirements) {
        requirementsText += "## Experience Requirements\n" + data.experience_requirements.answer + "\n\n";
      }
      
      // Add the requirements message to chat
      const requirementsMessage: Message = {
        id: Date.now().toString(),
        content: requirementsText,
        role: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, requirementsMessage]);
      
      // Switch to chat tab to show the results
      setActiveTab("chat");
      
      toast({
        title: "Requirements Extracted",
        description: "Detailed contract requirements have been extracted.",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error extracting requirements:', error);
      
      toast({
        title: "Error",
        description: "Failed to extract contract requirements. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtractingCodes(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !pdfUrl || !pdfSessionId) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: "user",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Call the Flask API to query the PDF
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: pdfSessionId,
          question: userMessage.content,
          structured: false, // Use simple answers for chat
          chat_history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get answer');
      }
      
      const data = await response.json();
      
      // Add AI response message
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: data.answer,
        role: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error querying PDF:', error);
      
      // Show error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, I couldn't process your question. Please try again.",
        role: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to get an answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to analyze solicitation
  const analyzeSolicitation = async () => {
    if (!pdfSessionId) {
      toast({
        title: "No Document Loaded",
        description: "Please upload a document before analyzing.",
        variant: "destructive",
      });
      return;
    }

    setIsSolicitationAnalyzing(true);
    setSolicitationReport("Analyzing solicitation document...");
    setActiveTab("solicitation");

    try {
      const response = await fetch(`${API_BASE_URL}/analyze_solicitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: pdfSessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze solicitation');
      }

      const data = await response.json();
      
      if (data.success) {
        setSolicitationReport(data.report);
        setSolicitationDetails(data);
        
        // Add message about completed analysis
        const analysisMessage: Message = {
          id: Date.now().toString(),
          content: `📋 **Solicitation Analysis Complete**\n\nI've analyzed the solicitation:\n- Number: ${data.solicitation_number || 'Unknown'}\n- Type: ${data.solicitation_type || 'Unknown'}\n- NAICS: ${data.naics_code || 'Unknown'}\n- Due Date: ${data.response_due_date || 'Unknown'}\n\nYou can view the complete analysis in the Solicitation tab.`,
          role: "assistant",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, analysisMessage]);

        toast({
          title: "Solicitation Analyzed",
          description: `Successfully analyzed ${data.solicitation_type || 'document'} ${data.solicitation_number || ''}`,
        });
      } else {
        setSolicitationReport("Failed to analyze solicitation. Please try again.");
        toast({
          title: "Analysis Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error analyzing solicitation:', error);
      setSolicitationReport("Error analyzing solicitation. Please try again.");
      toast({
        title: "Error",
        description: "Failed to analyze solicitation.",
        variant: "destructive",
      });
    } finally {
      setIsSolicitationAnalyzing(false);
    }
  };

  // Add this new function to extract detailed requirements
  const extractRequirements = async () => {
    if (!pdfSessionId || !solicitationDetails) {
      toast({
        title: "Analysis Required",
        description: "Please analyze the solicitation document first.",
        variant: "destructive",
      });
      return;
    }

    setIsExtractingRequirements(true);

    try {
      const response = await fetch(`${API_BASE_URL}/extract_requirements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: pdfSessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract requirements');
      }

      const data = await response.json();
      
      if (data.success && data.requirements) {
        setRequirementsData(data.requirements);
        
        // Add message about extracted requirements
        const reqMessage: Message = {
          id: Date.now().toString(),
          content: `📋 **Requirements Extracted**\n\nI've analyzed the solicitation in detail and extracted structured requirements data including:\n- Scope of work with ${data.requirements.scope_of_work?.primary_requirements?.length || 0} primary requirements\n- ${data.requirements.scope_of_work?.deliverables?.length || 0} deliverables\n- Evaluation criteria and methodology\n\nYou can view the detailed requirements in the Solicitation tab.`,
          role: "assistant",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, reqMessage]);

        toast({
          title: "Requirements Extracted",
          description: "Successfully extracted detailed requirements from the solicitation",
        });
      } else {
        toast({
          title: "Extraction Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error extracting requirements:', error);
      toast({
        title: "Error",
        description: "Failed to extract requirements.",
        variant: "destructive",
      });
    } finally {
      setIsExtractingRequirements(false);
    }
  };

  useEffect(() => {
   
  }, [isLoading]);
  const handleReset = () => {
    setPdfUrl(null);
    setPdfName(null);
    setPdfSessionId(null);
    setMessages([]);
    setInputMessage("");
    setContractSummary("");
    setContractCodes("");
    setActiveTab("chat");
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (activeTab === "chat" && messages.length > 0) {
      // Use a more robust approach with multiple attempts
      const scrollToBottom = () => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: "smooth",
            block: "end" 
          });
        }
      };
      
      // Initial scroll
      scrollToBottom();
      
      // Multiple attempts with increasing delays to ensure scroll happens after DOM updates
      const timeouts = [50, 150, 500].map(delay => 
        setTimeout(scrollToBottom, delay)
      );
      
      return () => timeouts.forEach(clearTimeout);
    }
  }, [messages, activeTab]);
  
  // Scroll to bottom when switching to chat tab
  useEffect(() => {
    if (activeTab === "chat" && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: "smooth",
          block: "end"
        });
      }, 100);
    }
  }, [activeTab, messages.length]);

  return (
    <div className="flex h-screen bg-white">
      <DashboardSidebar 
        activePage="readPDF" 
        onNavigate={handleNavigation}
        userName={userProfile?.user?.name?.split(" ")[0] || "User"}
        userAvatar={userProfile?.user?.profileImage || ""}
        rewardPoints={10}
      />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Main PDF Viewer Panel */}
        <ResizablePanel defaultSize={65} minSize={40} className="flex-1">
          <main className="flex flex-col h-full bg-[#F0EFFF]/10">
            {/* Header - always shown */}
            <div className="p-4 border-b border-gray-200 bg-white shadow-sm flex justify-between items-center">
              <div>
                <h1 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FileCheck className="h-5 w-5 mr-2 text-[#2BAC3E]" />
                  Contract Analysis Tool
                </h1>
                <p className="text-sm text-gray-500">Upload contract documents for detailed analysis</p>
              </div>
              {pdfUrl && (
                <Button 
                  onClick={handleReset}
                  variant="outline" 
                  size="sm"
                  className="text-gray-600"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
            
            <div className="flex-1 p-4 overflow-auto">
              {!pdfUrl ? (
                <div 
                  ref={dropAreaRef}
                  className="flex flex-col items-center justify-center h-full"
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Card 
                    className={`w-full max-w-md border-dashed border-2 ${
                      dragActive 
                        ? 'border-[#2BAC3E] bg-[#2BAC3E]/5' 
                        : dragError 
                          ? 'border-red-400 bg-red-50' 
                          : 'border-gray-300 bg-gray-50'
                    } transition-colors duration-200`}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                      {dragError ? (
                        <div className="text-red-500 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          <p>{dragError}</p>
                        </div>
                      ) : (
                        <>
                          <FileText className={`h-16 w-16 ${dragActive ? 'text-[#2BAC3E]' : 'text-gray-400'}`} />
                          <CardTitle className={`text-xl font-medium ${dragActive ? 'text-[#2BAC3E]' : 'text-gray-700'}`}>
                            {dragActive ? 'Drop contract here' : 'Upload a contract document'}
                          </CardTitle>
                        </>
                      )}
                      <p className="text-sm text-gray-500 text-center">
                        {dragActive 
                          ? 'Release to upload your PDF file' 
                          : 'Drag and drop a contract PDF here, or click the button below to select one'}
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#2BAC3E] hover:bg-[#1F8A2F] text-white"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Select Contract PDF
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="h-full w-full relative">
                  <div className="absolute top-2 left-2 z-10 bg-white/80 py-1 px-3 rounded-md text-sm font-medium">
                    {pdfName}
                  </div>
                  <iframe 
                    src={`${pdfUrl}#toolbar=0`} 
                    className="w-full h-full border border-gray-200 rounded-lg"
                    title="PDF Viewer"
                  />
                </div>
              )}
            </div>
          </main>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-gray-200 border-l border-r border-gray-300" />
        
        {/* Chat and Analysis Panel */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50} className="flex flex-col h-full">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Clipboard className="h-5 w-5 mr-2 text-[#2BAC3E]" />
                  Contract Analysis
                </h2>
                {pdfSessionId && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={extractContractRequirements}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      disabled={isExtractingCodes}
                    >
                      {isExtractingCodes ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Extracting...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Requirements
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        // Copy codes to clipboard
                        navigator.clipboard.writeText(contractCodes);
                        toast({
                          title: "Copied to Clipboard",
                          description: "Contract codes have been copied to your clipboard.",
                          variant: "default",
                        });
                      }}
                      variant="outline"
                      size="sm"
                      className="text-[#2BAC3E] border-[#2BAC3E] hover:bg-[#2BAC3E]/10"
                    >
                      <Clipboard className="h-4 w-4 mr-2" />
                      Copy Codes
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Content area - changes based on selected tab */}
            <div className="flex-1 overflow-hidden">
              {!pdfUrl ? (
                <div className="h-full p-4 flex flex-col items-center justify-center">
                  <motion.div
                    key="upload-prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center text-center"
                  >
                    <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Welcome to Contract Analysis</h3>
                    <p className="text-gray-500 max-w-xs mb-4">
                      Upload a contract document to start analyzing its content with AI
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#2BAC3E] hover:bg-[#1F8A2F] text-white"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Contract PDF
                    </Button>
                  </motion.div>
                </div>
              ) : pdfSessionId ? (
                <div className="h-full w-full flex flex-col">
                  <div className="flex justify-between items-center px-4 py-2 border-b">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setActiveTab("chat")}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeTab === "chat"
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </button>
                      <button
                        onClick={() => setActiveTab("summary")}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeTab === "summary"
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Summary
                      </button>
                      <button
                        onClick={() => setActiveTab("codes")}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeTab === "codes"
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <Code className="h-4 w-4 mr-2" />
                        Codes
                      </button>
                      <button
                        onClick={() => setActiveTab("solicitation")}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeTab === "solicitation"
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <SearchCheck className="h-4 w-4 mr-2" />
                        Solicitation
                      </button>
                      {requirementsData && (
                        <button
                          onClick={() => setActiveTab("requirements")}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            activeTab === "requirements"
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                        >
                          <ListChecks className="h-4 w-4 mr-2" />
                          Requirements
                        </button>
                      )}
                      {solicitationReport && (
                        <button
                          onClick={() => setActiveTab("analysis")}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            activeTab === "analysis"
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                        >
                          <FileSearch className="h-4 w-4 mr-2" />
                          Analysis
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Content area based on active tab */}
                  <div className="flex-1 overflow-hidden">
                    {/* Chat Tab */}
                    {activeTab === "chat" && (
                      <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto p-4">
                          <div className="space-y-4">
                            <AnimatePresence mode="wait">
                              {messages.length === 0 ? (
                                <motion.div
                                  key="ask-prompt"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="flex flex-col items-center justify-center h-64 text-center"
                                >
                                  <FileText className="h-12 w-12 text-[#2BAC3E]/30 mb-4" />
                                  <p className="text-gray-500 max-w-xs">
                                    {isProcessing ? "Processing document..." : "Ask questions about the contract document"}
                                  </p>
                                </motion.div>
                              ) : (
                                messages.map((message) => (
                                  <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                  >
                                    <div 
                                      className={`max-w-[90%] rounded-lg p-3 ${
                                        message.role === "user" 
                                          ? "bg-[#2BAC3E] text-white" 
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      <div className="text-sm prose prose-sm max-w-none overflow-x-auto">
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                      </div>
                                      <p className="text-xs mt-1 opacity-70">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </motion.div>
                                ))
                              )}
                              {isLoading && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="flex justify-start"
                                >
                                  <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                    <p className="text-sm text-gray-500">Thinking...</p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <div ref={messagesEndRef} className="h-10" />
                          </div>
                        </div>
                        
                        <div className="p-4 border-t border-gray-200 bg-white">
                          <div className="flex space-x-2">
                            <Input
                              value={inputMessage}
                              onChange={(e) => setInputMessage(e.target.value)}
                              placeholder={pdfSessionId ? "Ask a question about the contract..." : isProcessing ? "Processing document..." : "Upload a contract document first"}
                              disabled={!pdfSessionId || isLoading || isProcessing}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                              className="flex-1 border-gray-300 focus:ring-[#2BAC3E] focus:border-[#2BAC3E]"
                            />
                            <Button
                              onClick={handleSendMessage}
                              disabled={!pdfSessionId || !inputMessage.trim() || isLoading || isProcessing}
                              className="bg-[#2BAC3E] hover:bg-[#1F8A2F] text-white"
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Summary Tab */}
                    {activeTab === "summary" && (
                      <div className="h-full overflow-y-auto p-4">
                        <Card className="mb-4">
                          <CardHeader>
                            <CardTitle className="text-lg">Contract Summary</CardTitle>
                            <CardDescription>Key information extracted from the document</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown>{contractSummary}</ReactMarkdown>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
                    {/* Codes Tab */}
                    {activeTab === "codes" && (
                      <div className="h-full overflow-y-auto p-4">
                        <Card className="mb-4">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                              <CardTitle className="text-lg">Contract Codes & Regulations</CardTitle>
                              <CardDescription>References to standards and regulations found in the document</CardDescription>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => {
                                  if (!contractCodes || contractCodes === "No FAR clauses or regulatory references found in the document.") {
                                    toast({
                                      title: "No Codes Available",
                                      description: "Please extract FAR clauses first using the Extract Codes button.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  // Add a new message asking the AI to create a compliance matrix
                                  const userMessage: Message = {
                                    id: Date.now().toString(),
                                    content: "Create a compliance matrix table for all the FAR clauses you found, with columns for Clause Number, Title, Compliance Approach, and Implementation.",
                                    role: "user",
                                    timestamp: new Date()
                                  };
                                  
                                  setMessages(prev => [...prev, userMessage]);
                                  
                                  // Switch to chat tab
                                  setActiveTab("chat");
                                  
                                  // Fetch response from the AI
                                  setIsLoading(true);
                                  fetch(`${API_BASE_URL}/query`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      session_id: pdfSessionId,
                                      question: userMessage.content,
                                      structured: false
                                    }),
                                  })
                                  .then(response => {
                                    if (!response.ok) throw new Error('Failed to create compliance matrix');
                                    return response.json();
                                  })
                                  .then(data => {
                                    const aiMessage: Message = {
                                      id: Date.now().toString(),
                                      content: data.answer,
                                      role: "assistant",
                                      timestamp: new Date()
                                    };
                                    setMessages(prev => [...prev, aiMessage]);
                                  })
                                  .catch(error => {
                                    console.error('Error creating compliance matrix:', error);
                                    const errorMessage: Message = {
                                      id: Date.now().toString(),
                                      content: "Sorry, I couldn't create a compliance matrix. Please try again.",
                                      role: "assistant",
                                      timestamp: new Date()
                                    };
                                    setMessages(prev => [...prev, errorMessage]);
                                  })
                                  .finally(() => {
                                    setIsLoading(false);
                                  });
                                }}
                                variant="outline"
                                size="sm"
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                              >
                                <Clipboard className="h-4 w-4 mr-2" />
                                Compliance Matrix
                              </Button>
                              <Button
                                onClick={() => {
                                  setIsExtractingCodes(true);
                                  // Clear existing codes
                                  setContractCodes("Scanning for all FAR clauses and regulations...");
                                  
                                  // Call our new Scanner Agent endpoint
                                  fetch(`${API_BASE_URL}/extract_clauses`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      session_id: pdfSessionId
                                    }),
                                  })
                                  .then(response => {
                                    if (!response.ok) {
                                      throw new Error('Failed to extract clauses with Scanner Agent');
                                    }
                                    return response.json();
                                  })
                                  .then(data => {
                                    if (data.success && data.clause_inventory) {
                                      setContractCodes(data.clause_inventory);
                                      
                                      // Find count info
                                      const farCount = data.clauses?.far_clauses?.length || 0;
                                      const dfarsCount = data.clauses?.dfars_clauses?.length || 0;
                                      const altCount = data.clauses?.alternates?.length || 0;
                                      const totalCount = farCount + dfarsCount + altCount;
                                      
                                      toast({
                                        title: `${totalCount} Clauses Found`,
                                        description: `Scanner Agent identified ${farCount} FAR clauses, ${dfarsCount} DFARS clauses, and ${altCount} alternates.`,
                                        variant: "default",
                                      });
                                      
                                      // Add message about found clauses
                                      if (totalCount > 0) {
                                        const clauseMessage: Message = {
                                          id: Date.now().toString(),
                                          content: `📋 **Contract Clause Analysis Complete**\n\nI've identified ${totalCount} clauses in this document:\n- ${farCount} FAR clauses\n- ${dfarsCount} DFARS clauses\n- ${altCount} alternates\n\nYou can view the complete inventory in the Codes tab.`,
                                          role: "assistant",
                                          timestamp: new Date()
                                        };
                                        setMessages(prev => [...prev, clauseMessage]);
                                      }
                                    } else {
                                      setContractCodes("No FAR clauses or regulatory references found in the document.");
                                    }
                                  })
                                  .catch(error => {
                                    console.error('Error extracting clauses with Scanner Agent:', error);
                                    setContractCodes("Error extracting clauses. Falling back to LLM-based extraction...");
                                    
                                    // Fallback to standard FAR clause extraction
                                    fetch(`${API_BASE_URL}/extract_far_clauses`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        session_id: pdfSessionId
                                      }),
                                    })
                                    .then(response => response.json())
                                    .then(farData => {
                                      if (farData.success && farData.far_clauses) {
                                        setContractCodes(farData.far_clauses);
                                      } else {
                                        setContractCodes("Unable to extract clauses using either method.");
                                      }
                                    })
                                    .catch(() => {
                                      setContractCodes("Failed to extract clauses. Please try again.");
                                    });
                                    
                                    toast({
                                      title: "Error",
                                      description: "Scanner Agent extraction failed. Using fallback method.",
                                      variant: "destructive",
                                    });
                                  })
                                  .finally(() => {
                                    setIsExtractingCodes(false);
                                  });
                                }}
                                variant="outline"
                                size="sm"
                                className="bg-[#2BAC3E]/10 hover:bg-[#2BAC3E]/20 text-[#2BAC3E]"
                                disabled={isExtractingCodes}
                              >
                                {isExtractingCodes ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Scanning...
                                  </>
                                ) : (
                                  <>
                                    <Code className="h-4 w-4 mr-2" />
                                    Scan All Clauses
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {contractCodes ? (
                              <div className="prose prose-sm max-w-none">
                                <ReactMarkdown>{contractCodes}</ReactMarkdown>
                              </div>
                            ) : (
                              <div className="py-8 text-center">
                                <Code className="h-8 w-8 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500">No codes have been extracted yet</p>
                                <Button 
                                  onClick={() => {
                                    // Same code as above button
                                    setIsExtractingCodes(true);
                                    setContractCodes("Scanning for all FAR clauses and regulations...");
                                    
                                    fetch(`${API_BASE_URL}/extract_clauses`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        session_id: pdfSessionId
                                      }),
                                    })
                                    .then(response => {
                                      if (!response.ok) throw new Error('Failed to extract clauses with Scanner Agent');
                                      return response.json();
                                    })
                                    .then(data => {
                                      if (data.success && data.clause_inventory) {
                                        setContractCodes(data.clause_inventory);
                                        toast({
                                          title: `${data.clauses?.far_clauses?.length || 0} Clauses Found`,
                                          description: `Scanner Agent identified ${data.clauses?.far_clauses?.length || 0} FAR clauses.`,
                                          variant: "default",
                                        });
                                      } else {
                                        setContractCodes("No FAR clauses or regulatory references found in the document.");
                                      }
                                    })
                                    .catch(error => {
                                      console.error('Error extracting clauses with Scanner Agent:', error);
                                      setContractCodes("Error extracting clauses. Falling back to LLM-based extraction...");
                                      
                                      // Fallback to standard FAR clause extraction
                                      fetch(`${API_BASE_URL}/extract_far_clauses`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          session_id: pdfSessionId
                                        }),
                                      })
                                      .then(response => response.json())
                                      .then(farData => {
                                        if (farData.success && farData.far_clauses) {
                                          setContractCodes(farData.far_clauses);
                                        } else {
                                          setContractCodes("Unable to extract clauses using either method.");
                                        }
                                      })
                                      .catch(() => {
                                        setContractCodes("Failed to extract clauses. Please try again.");
                                      });
                                      
                                      toast({
                                        title: "Error",
                                        description: "Scanner Agent extraction failed. Using fallback method.",
                                        variant: "destructive",
                                      });
                                    })
                                    .finally(() => {
                                      setIsExtractingCodes(false);
                                    });
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="mt-4"
                                  disabled={isExtractingCodes}
                                >
                                  {isExtractingCodes ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Scanning...
                                    </>
                                  ) : (
                                    <>
                                      <Code className="h-4 w-4 mr-2" />
                                      Scan All Clauses
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
                    {/* Solicitation Tab */}
                    {activeTab === "solicitation" && (
                      <div className="h-full overflow-y-auto p-4">
                        {!solicitationReport ? (
                          <Card className="mx-auto max-w-4xl">
                            <CardHeader>
                              <CardTitle className="text-xl">Solicitation Analysis</CardTitle>
                              <CardDescription>
                                Click the "Analyze Solicitation" button to extract key information from 
                                this RFP/RFQ document, including solicitation details, dates, evaluation 
                                criteria, and submission requirements.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center py-10">
                              <Button
                                onClick={analyzeSolicitation}
                                disabled={isSolicitationAnalyzing || !pdfSessionId}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <SearchCheck className="h-5 w-5 mr-2" />
                                Analyze Solicitation
                              </Button>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="space-y-4 max-w-4xl mx-auto">
                            {solicitationDetails && (
                              <Card className="bg-blue-50 border-blue-200">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg text-blue-700 flex justify-between items-center">
                                    <span>Solicitation Overview</span>
                                    {!requirementsData && (
                                      <Button
                                        onClick={extractRequirements}
                                        disabled={isExtractingRequirements}
                                        variant="outline"
                                        size="sm"
                                        className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                                      >
                                        {isExtractingRequirements ? (
                                          <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Extracting...
                                          </>
                                        ) : (
                                          <>
                                            <FileCheck className="h-4 w-4 mr-2" />
                                            Extract Requirements
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-sm font-medium text-blue-800">Basic Details</h4>
                                      <dl className="mt-2 space-y-1">
                                        <div className="flex justify-between">
                                          <dt className="text-sm text-blue-700">Number:</dt>
                                          <dd className="text-sm font-medium">{solicitationDetails.solicitation_number || 'Unknown'}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                          <dt className="text-sm text-blue-700">Type:</dt>
                                          <dd className="text-sm font-medium">{solicitationDetails.solicitation_type || 'Unknown'}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                          <dt className="text-sm text-blue-700">NAICS:</dt>
                                          <dd className="text-sm font-medium">{solicitationDetails.naics_code || 'Unknown'}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                          <dt className="text-sm text-blue-700">Evaluation:</dt>
                                          <dd className="text-sm font-medium">{solicitationDetails.evaluation_method || 'Unknown'}</dd>
                                        </div>
                                      </dl>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-blue-800">Metrics</h4>
                                      <dl className="mt-2 space-y-1">
                                        <div className="flex justify-between">
                                          <dt className="text-sm text-blue-700">FAR Clauses:</dt>
                                          <dd className="text-sm font-medium">{solicitationDetails.metrics?.total_far_clauses || 0}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                          <dt className="text-sm text-blue-700">DFARS Clauses:</dt>
                                          <dd className="text-sm font-medium">{solicitationDetails.metrics?.total_dfars_clauses || 0}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                          <dt className="text-sm text-blue-700">Key 52.212 Clauses:</dt>
                                          <dd className="text-sm font-medium">{solicitationDetails.metrics?.key_clauses_found || 0}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                          <dt className="text-sm text-blue-700">Due Date:</dt>
                                          <dd className="text-sm font-medium">{solicitationDetails.response_due_date || 'Unknown'}</dd>
                                        </div>
                                      </dl>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            
                            {/* Add the requirements data display */}
                            {requirementsData && (
                              <Card className="border-green-200">
                                <CardHeader className="pb-2 bg-green-50">
                                  <CardTitle className="text-lg text-green-700">
                                    Detailed Requirements
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                  <div className="w-full">
                                    <div className="flex border-b">
                                      <button 
                                        onClick={() => setActiveTab("requirements")}
                                        className="px-4 py-2 text-sm font-medium border-b-2 border-green-600 text-green-700"
                                      >
                                        View Requirements
                                      </button>
                                    </div>
                                    <div className="p-4">
                                      <p className="text-sm text-gray-600">Click the tab above to view detailed requirements extracted from this solicitation.</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            
                            {/* Detailed Analysis Card */}
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex justify-between">
                                  <span>Detailed Analysis</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 text-blue-600"
                                    onClick={() => {
                                      // Copy to clipboard
                                      navigator.clipboard.writeText(solicitationReport)
                                        .then(() => {
                                          toast({ title: "Copied to clipboard" })
                                        })
                                        .catch(err => {
                                          console.error('Failed to copy: ', err);
                                          toast({ 
                                            title: "Failed to copy",
                                            variant: "destructive"
                                          })
                                        });
                                    }}
                                  >
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copy
                                  </Button>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="prose prose-sm max-w-none">
                                  <ReactMarkdown>{solicitationReport}</ReactMarkdown>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Requirements Tab */}
                    {activeTab === "requirements" && requirementsData && (
                      <div className="h-full overflow-y-auto p-4">
                        <div className="space-y-4 max-w-4xl mx-auto">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-xl flex justify-between items-center">
                                <span>Scope of Work</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    navigator.clipboard.writeText(requirementsData.scope_of_work?.formatted || "")
                                      .then(() => {
                                        toast({
                                          title: "Copied!",
                                          description: "Scope of work copied to clipboard",
                                        });
                                      })
                                      .catch(() => {
                                        toast({
                                          title: "Failed to copy",
                                          description: "Could not copy to clipboard",
                                          variant: "destructive",
                                        });
                                      });
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="prose prose-sm max-w-none">
                                {requirementsData.scope_of_work?.error ? (
                                  <div className="text-red-500">Error extracting scope: {requirementsData.scope_of_work.error}</div>
                                ) : (
                                  <div className="space-y-6">
                                    <div>
                                      <h3 className="text-lg font-medium mb-2">Primary Requirements</h3>
                                      <ul className="list-disc pl-5 space-y-1">
                                        {requirementsData.scope_of_work?.primary_requirements?.map((req: string, i: number) => (
                                          <li key={i}>{req}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    
                                    <div>
                                      <h3 className="text-lg font-medium mb-2">Deliverables</h3>
                                      <ul className="list-disc pl-5 space-y-1">
                                        {requirementsData.scope_of_work?.deliverables?.map((del: string, i: number) => (
                                          <li key={i}>{del}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    
                                    <div>
                                      <h3 className="text-lg font-medium mb-2">Frequency Requirements</h3>
                                      {requirementsData.scope_of_work?.frequency && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {Object.entries(requirementsData.scope_of_work.frequency).map(([period, tasks]: [string, any]) => (
                                            tasks && tasks.length > 0 ? (
                                              <div key={period} className="border rounded p-3">
                                                <h4 className="font-medium capitalize mb-2">{period}</h4>
                                                <ul className="list-disc pl-5 space-y-1">
                                                  {tasks.map((task: string, i: number) => (
                                                    <li key={i}>{task}</li>
                                                  ))}
                                                </ul>
                                              </div>
                                            ) : null
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-xl flex justify-between items-center">
                                <span>Evaluation Criteria</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    navigator.clipboard.writeText(requirementsData.evaluation_criteria?.formatted || "")
                                      .then(() => {
                                        toast({
                                          title: "Copied!",
                                          description: "Evaluation criteria copied to clipboard",
                                        });
                                      })
                                      .catch(() => {
                                        toast({
                                          title: "Failed to copy",
                                          description: "Could not copy to clipboard",
                                          variant: "destructive",
                                        });
                                      });
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="prose prose-sm max-w-none">
                                {requirementsData.evaluation_criteria?.error ? (
                                  <div className="text-red-500">Error extracting evaluation criteria: {requirementsData.evaluation_criteria.error}</div>
                                ) : (
                                  <div className="space-y-6">
                                    <div>
                                      <h3 className="text-lg font-medium mb-2">Evaluation Method</h3>
                                      <p className="font-medium text-blue-700">{requirementsData.evaluation_criteria?.evaluation_method || "Not specified"}</p>
                                    </div>
                                    
                                    <div>
                                      <h3 className="text-lg font-medium mb-2">Technical Factors</h3>
                                      <ul className="list-disc pl-5 space-y-1">
                                        {requirementsData.evaluation_criteria?.technical_factors?.map((factor: string, i: number) => (
                                          <li key={i}>{factor}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    
                                    <div>
                                      <h3 className="text-lg font-medium mb-2">Past Performance Evaluation</h3>
                                      <div className="border rounded p-3">
                                        {typeof requirementsData.evaluation_criteria?.past_performance === 'string' ? (
                                          <p>{requirementsData.evaluation_criteria?.past_performance}</p>
                                        ) : (
                                          <pre className="text-sm whitespace-pre-wrap">
                                            {JSON.stringify(requirementsData.evaluation_criteria?.past_performance, null, 2)}
                                          </pre>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h3 className="text-lg font-medium mb-2">Price Evaluation</h3>
                                      <p>{requirementsData.evaluation_criteria?.price_evaluation || "Not specified"}</p>
                                    </div>
                                    
                                    <div>
                                      <h3 className="text-lg font-medium mb-2">Minimum Requirements</h3>
                                      <ul className="list-disc pl-5 space-y-1">
                                        {requirementsData.evaluation_criteria?.minimum_requirements?.map((req: string, i: number) => (
                                          <li key={i}>{req}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}
                    
                    {/* Analysis Tab */}
                    {activeTab === "analysis" && solicitationReport && (
                      <div className="h-full overflow-y-auto p-4">
                        <Card className="mb-4">
                          <CardHeader>
                            <CardTitle className="text-lg flex justify-between items-center">
                              <span>Detailed Analysis</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(solicitationReport || "")
                                    .then(() => {
                                      toast({
                                        title: "Copied!",
                                        description: "Analysis copied to clipboard",
                                      });
                                    })
                                    .catch(() => {
                                      toast({
                                        title: "Failed to copy",
                                        description: "Could not copy to clipboard",
                                        variant: "destructive",
                                      });
                                    });
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown>{solicitationReport || ""}</ReactMarkdown>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full p-4 flex flex-col items-center justify-center">
                  <div className="flex items-center space-x-2 text-orange-600">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p>Processing contract document, please wait...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}