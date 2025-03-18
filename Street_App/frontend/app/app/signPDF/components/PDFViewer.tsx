import { useRef, useEffect, useState } from 'react';
import { PDFDocument } from 'pdf-lib';

interface PDFViewerProps {
  pdfUrl: string;
  onPageChange?: (page: number) => void;
  onViewerReady?: (dimensions: { width: number; height: number; pageCount: number }) => void;
  children?: React.ReactNode;
}

/**
 * PDFViewer component - Handles PDF display and provides coordinate system information
 * This component is responsible for:
 * 1. Displaying the PDF document
 * 2. Tracking scroll position and current page
 * 3. Providing viewport dimensions and coordinate information to child components
 */
const PDFViewer = ({ pdfUrl, onPageChange, onViewerReady, children }: PDFViewerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);
  
  // Get PDF dimensions and page count when loaded
  useEffect(() => {
    if (!pdfUrl) return;
    
    const loadPdfInfo = async () => {
      try {
        // Fetch the PDF and get its dimensions
        const response = await fetch(pdfUrl);
        const arrayBuffer = await response.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        const pageCount = pdfDoc.getPageCount();
        const firstPage = pdfDoc.getPages()[0];
        const { width, height } = firstPage.getSize();
        
        console.log(`PDF loaded: ${pageCount} pages, dimensions: ${width}x${height}`);
        
        if (onViewerReady) {
          onViewerReady({ width, height, pageCount });
        }
      } catch (error) {
        console.error("Error loading PDF info:", error);
      }
    };
    
    loadPdfInfo();
  }, [pdfUrl]);
  
  // Handle iframe load
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    
    const handleIframeLoad = () => {
      console.log("PDF iframe loaded");
      setIsReady(true);
      
      // Update dimensions
      const { width, height } = iframe.getBoundingClientRect();
      setDimensions({ width, height });
      
      // Try to detect current page
      try {
        if (iframe.contentWindow) {
          detectCurrentPage();
          
          // Add scroll listener to track page changes
          iframe.contentWindow.addEventListener('scroll', handleScroll);
          
          // Add resize listener to update dimensions
          window.addEventListener('resize', handleResize);
        }
      } catch (error) {
        console.warn("Could not access iframe's contentWindow:", error);
      }
    };
    
    const handleScroll = () => {
      detectCurrentPage();
    };
    
    const handleResize = () => {
      if (iframe) {
        const { width, height } = iframe.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };
    
    const detectCurrentPage = () => {
      if (!iframe.contentWindow) return;
      
      try {
        // Try to detect page from URL fragment
        const url = iframe.contentWindow.location.href;
        const pageMatch = url.match(/#page=(\d+)/);
        
        if (pageMatch && pageMatch[1]) {
          const page = parseInt(pageMatch[1], 10);
          if (onPageChange) {
            onPageChange(page);
          }
        }
      } catch (e) {
        // Ignore cross-origin errors
      }
    };
    
    iframe.addEventListener('load', handleIframeLoad);
    
    return () => {
      iframe.removeEventListener('load', handleIframeLoad);
      
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.removeEventListener('scroll', handleScroll);
        }
      } catch (e) {
        // Ignore cross-origin errors
      }
      
      window.removeEventListener('resize', handleResize);
    };
  }, [pdfUrl, onPageChange]);
  
  return (
    <div className="relative w-full h-full">
      <iframe
        ref={iframeRef}
        id="pdf-viewer-iframe"
        src={pdfUrl ? `${pdfUrl}#toolbar=0` : "about:blank"}
        className="absolute inset-0 w-full h-full border border-gray-200 rounded-lg"
        title="PDF Viewer"
      />
      
      {isReady && children}
    </div>
  );
};

export default PDFViewer; 