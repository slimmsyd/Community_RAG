"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { 
  Card, 
  CardContent, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useSession } from "next-auth/react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Edit, Upload } from "lucide-react";
import { PDFIcon } from "@/components/icons/PDFIcon";
import { useToast } from "@/components/ui/use-toast";
import { PDFDocument } from 'pdf-lib';

// Import our new components
import PDFViewer from './components/PDFViewer';
import SignatureOverlay from './components/SignatureOverlay';
import SignatureTools from './components/SignatureTools';
import { SignatureFieldData } from './components/SignatureField';

// Import our new utilities
import { processPdfWithSignatures, saveAsPdfScreenshot } from './utils/pdfSigner';

// Define the Flask API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";

interface SignatureInfo {
  name: string;
  date: string;
  title?: string;
  company?: string;
}

export default function SignPDFPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { userProfile } = useUserProfile();
  const { toast } = useToast();
  
  // PDF state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [browserDimensions, setBrowserDimensions] = useState({ width: 0, height: 0 });
  
  // Signature state
  const [signatureFields, setSignatureFields] = useState<SignatureFieldData[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [signatureInfo, setSignatureInfo] = useState<SignatureInfo>({
    name: "",
    date: new Date().toISOString().split('T')[0],
    title: "",
    company: ""
  });
  const [currentSignatureType, setCurrentSignatureType] = useState<"draw" | "type" | "image">("draw");
  const [isAddingField, setIsAddingField] = useState(false);
  
  // UI state
  const [dragActive, setDragActive] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  
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
    
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    setPdfName(file.name);
    setIsProcessing(true);
    
    try {
      // Use the PDF document to determine total pages and dimensions
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      setTotalPages(pageCount);
      
      // Get dimensions of the first page
      const firstPage = pdfDoc.getPages()[0];
      const { width, height } = firstPage.getSize();
      setPdfDimensions({ width, height });
      
      console.log(`PDF loaded with ${pageCount} pages, dimensions: ${width}x${height}`);
      
      toast({
        title: "PDF Loaded",
        description: `Document with ${pageCount} pages loaded. You can now add signature fields.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({
        title: "Error",
        description: "Failed to process PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle PDF viewer ready event
  const handlePdfViewerReady = (dimensions: { width: number; height: number; pageCount: number }) => {
    console.log("PDF viewer ready:", dimensions);
    setPdfDimensions({ width: dimensions.width, height: dimensions.height });
    setTotalPages(dimensions.pageCount);
    
    // Get browser dimensions
    if (pdfContainerRef.current) {
      const { width, height } = pdfContainerRef.current.getBoundingClientRect();
      setBrowserDimensions({ width, height });
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    console.log("Page changed to:", page);
    setCurrentPage(page);
  };

  // Handle adding a signature field
  const handleAddField = () => {
    setIsAddingField(true);
    
    toast({
      title: "Adding Signature Field",
      description: "Click anywhere on the PDF to place the signature field.",
      variant: "default",
    });
  };

  // Handle field creation
  const handleCreateField = (x: number, y: number) => {
    const newField: SignatureFieldData = {
      id: Date.now().toString(),
      type: currentSignatureType,
      x,
      y,
      width: 200,
      height: 100,
      page: currentPage,
      content: currentSignatureType === 'type' ? signatureInfo.name : undefined
    };
    
    setSignatureFields(prev => [...prev, newField]);
    setSelectedField(newField.id);
    setIsAddingField(false);
    
    toast({
      title: "Signature Field Added",
      description: "You can now add your signature to this field.",
      variant: "default",
    });
  };

  // Handle field movement
  const handleFieldMove = (fieldId: string, x: number, y: number) => {
    setSignatureFields(prev => prev.map(field => 
      field.id === fieldId 
        ? { ...field, x, y }
        : field
    ));
  };

  // Update signature content
  const handleSaveSignature = (type: string, content: string) => {
    if (!selectedField) {
      toast({
        title: "Error",
        description: "Please select a signature field first",
        variant: "destructive",
      });
      return;
    }
    
    setSignatureFields(prev => prev.map(field => 
      field.id === selectedField
        ? { ...field, content, type: type as "draw" | "type" | "image" }
        : field
    ));
    
    toast({
      title: "Signature Saved",
      description: "Your signature has been added to the field.",
      variant: "default",
    });
  };

  // Handle saving the PDF
  const handleSavePdf = async () => {
    if (!pdfUrl) {
      toast({
        title: "Error",
        description: "Please upload a PDF first",
        variant: "destructive",
      });
      return;
    }

    // Check if we have any signature fields
    if (signatureFields.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one signature field to the document",
        variant: "destructive",
      });
      return;
    }

    // Check if any signature fields are empty
    const emptyFields = signatureFields.filter(field => !field.content);
    if (emptyFields.length > 0) {
      toast({
        title: "Warning",
        description: `You have ${emptyFields.length} empty signature ${emptyFields.length === 1 ? 'field' : 'fields'}. Please add signatures to all fields.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      toast({
        title: "Processing",
        description: "Preparing your signed PDF...",
        variant: "default",
      });

      // Process the PDF
      let signedPdfUrl = '';
      
      try {
        // Try the primary PDF signing method
        signedPdfUrl = await processPdfWithSignatures(
          pdfUrl,
          signatureFields,
          pdfDimensions,
          browserDimensions
        );
        
        // Open in a new tab for inspection
        window.open(signedPdfUrl, '_blank');
      } catch (primaryError) {
        console.error('Primary PDF signing method failed:', primaryError);
        
        // Try the fallback method
        toast({
          title: "Warning",
          description: "Primary PDF modification failed. Trying alternative method...",
          variant: "default",
        });
        
        signedPdfUrl = await saveAsPdfScreenshot(pdfContainerRef, pdfName);
      }

      // Create download link
      const link = document.createElement('a');
      link.href = signedPdfUrl;
      link.download = `signed_${pdfName || 'document'}.pdf`;
      console.log("Triggering download:", link.download);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(signedPdfUrl);
      }, 3000);

      toast({
        title: "Success",
        description: "PDF has been signed and saved successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Error saving signed PDF:', error);
      toast({
        title: "Error",
        description: "Failed to save signed PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <DashboardSidebar 
        activePage="signPDF" 
        onNavigate={handleNavigation}
        userName={userProfile?.user?.name?.split(" ")[0] || "User"}
        userAvatar={userProfile?.user?.profileImage || ""}
        rewardPoints={10}
      />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Main PDF Viewer Panel */}
        <ResizablePanel defaultSize={70} minSize={40} className="flex-1">
          <main className="flex flex-col h-full bg-[#F0EFFF]/10">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center">
                <PDFIcon className="h-5 w-5 mr-2 text-[#2BAC3E]" />
                PDF Signature
              </h1>
              <p className="text-sm text-gray-500">Add signatures to your PDF document</p>
            </div>
            
            {/* PDF Viewer with Canvas Overlay */}
            <div className="flex-1 p-4 overflow-auto" ref={pdfContainerRef}>
              {!pdfUrl ? (
                // Upload area
                <div 
                  ref={dropAreaRef}
                  className="flex flex-col items-center justify-center h-full"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const file = e.dataTransfer.files[0];
                    processFile(file);
                  }}
                >
                  <Card className={`w-full max-w-md border-dashed border-2 ${
                    dragActive ? 'border-[#2BAC3E] bg-[#2BAC3E]/5' : 'border-gray-300'
                  }`}>
                    <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                      <PDFIcon className="h-16 w-16 text-gray-400" />
                      <CardTitle>Upload a PDF to Sign</CardTitle>
                      <p className="text-sm text-gray-500 text-center">
                        Drag and drop a PDF file here, or click to select
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
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Select PDF
                      </Button>
                    </CardContent>
                  </Card>

              
                </div>
              ) : (
                // PDF Viewer with Signature Overlay
                <PDFViewer 
                  pdfUrl={pdfUrl}
                  onPageChange={handlePageChange}
                  onViewerReady={handlePdfViewerReady}
                >
                  <SignatureOverlay
                    pdfDimensions={pdfDimensions}
                    fields={signatureFields}
                    currentPage={currentPage}
                    selectedField={selectedField}
                    isAddingField={isAddingField}
                    onSelectField={setSelectedField}
                    onFieldMove={handleFieldMove}
                    onAddField={handleCreateField}
                  />
                </PDFViewer>
              )}
            </div>
          </main>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-gray-200 border-l border-r border-gray-300" />
        
        {/* Signature Tools Panel */}
        <ResizablePanel defaultSize={30} minSize={25} maxSize={50} className="flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Edit className="h-5 w-5 mr-2 text-[#2BAC3E]" />
              Signature Tools
            </h2>
          </div>
          
          {pdfUrl && (
            <SignatureTools
              signatureInfo={signatureInfo}
              onSignatureInfoChange={setSignatureInfo}
              onAddField={handleAddField}
              onSaveSignature={handleSaveSignature}
              onSavePdf={handleSavePdf}
              isAddingField={isAddingField}
              isProcessing={isProcessing}
              selectedField={selectedField}
              signatureType={currentSignatureType}
              onSignatureTypeChange={setCurrentSignatureType}
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}