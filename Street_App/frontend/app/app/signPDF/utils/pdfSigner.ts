import { PDFDocument, rgb } from 'pdf-lib';
import { SignatureFieldData } from '../components/SignatureField';
import { browserToPdfCoordinates } from './pdfCoordinates';
import html2canvas from 'html2canvas';

/**
 * Process a PDF with signature fields
 * @param pdfUrl URL to the PDF document
 * @param signatureFields Array of signature fields to add
 * @param pdfDimensions The dimensions of the PDF pages
 * @param browserDimensions The dimensions of the browser viewport
 * @returns A Blob URL to the processed PDF
 */
export async function processPdfWithSignatures(
  pdfUrl: string,
  signatureFields: SignatureFieldData[],
  pdfDimensions: { width: number; height: number },
  browserDimensions: { width: number; height: number }
): Promise<string> {
  console.log("=== Starting PDF signing process ===");
  console.log("Signature fields:", signatureFields);
  
  // Fetch the PDF
  console.log("Fetching PDF from URL:", pdfUrl);
  const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
  console.log("PDF loaded, size:", existingPdfBytes.byteLength, "bytes");
  
  // Parse the PDF document
  console.log("Parsing PDF with pdf-lib...");
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  console.log("PDF parsed successfully");
  
  // Get the pages
  const pages = pdfDoc.getPages();
  console.log("PDF has", pages.length, "pages");
  
  // Calculate scaling factors
  const { width, height } = pdfDimensions;
  console.log("PDF dimensions:", width, "x", height);
  
  // Process each signature field
  for (const field of signatureFields) {
    try {
      // Get the appropriate page
      const pageIndex = Math.min(Math.max(field.page - 1, 0), pages.length - 1);
      const page = pages[pageIndex];
      
      console.log(`\nProcessing signature field: ${field.id}`);
      console.log(`- Type: ${field.type}`);
      console.log(`- Browser position: (${field.x}, ${field.y}), Size: ${field.width}x${field.height}`);
      console.log(`- Page: ${field.page}`);
      
      // Convert coordinates to PDF space
      const pdfCoords = browserToPdfCoordinates(
        field.x,
        field.y,
        field.width,
        field.height,
        browserDimensions,
        pdfDimensions
      );
      
      console.log(`- PDF position: (${pdfCoords.x}, ${pdfCoords.y}), Size: ${pdfCoords.width}x${pdfCoords.height}`);
      
      // Process the signature based on its type
      if (field.content) {
        if (field.type === 'draw' || field.type === 'image') {
          await addImageSignature(pdfDoc, page, field.content, pdfCoords);
        } else if (field.type === 'type') {
          await addTextSignature(pdfDoc, page, field.content, pdfCoords);
        }
      }
    } catch (fieldError) {
      console.error(`Error adding field ${field.id}:`, fieldError);
      // Continue with other fields
    }
  }
  
  // Save the PDF
  console.log("\n=== Saving PDF document ===");
  const pdfBytes = await pdfDoc.save();
  console.log("PDF saved successfully, size:", pdfBytes.length, "bytes");
  
  // Create blob URL
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  console.log("Blob URL created for signed PDF");
  
  return url;
}

/**
 * Add a drawn or uploaded image signature to a PDF
 * @param pdfDoc The PDF document
 * @param page The page to add the signature to
 * @param content The image content (data URL)
 * @param coords The PDF coordinates
 */
async function addImageSignature(
  pdfDoc: PDFDocument,
  page: any,
  content: string,
  coords: { x: number; y: number; width: number; height: number }
) {
  if (content.startsWith('data:image/')) {
    console.log("Processing image data");
    
    try {
      // Extract the base64 data
      const base64Data = content.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid image data');
      }
      
      // Decode the base64 data to bytes
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Determine image type and embed
      let image;
      if (content.includes('data:image/png')) {
        image = await pdfDoc.embedPng(imageBytes);
      } else if (content.includes('data:image/jpeg') || content.includes('data:image/jpg')) {
        image = await pdfDoc.embedJpg(imageBytes);
      } else {
        // Default to PNG for other formats
        image = await pdfDoc.embedPng(imageBytes);
      }
      
      // Draw the image on the PDF
      page.drawImage(image, {
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
      });
      
      console.log("Image embedded in PDF successfully");
    } catch (error) {
      console.error("Error embedding image:", error);
      // Fallback to text
      page.drawText('Signature', {
        x: coords.x + (coords.width / 2) - 30,
        y: coords.y + (coords.height / 2),
        size: 16,
        color: rgb(0, 0, 0),
      });
    }
  }
}

/**
 * Add a typed signature to a PDF
 * @param pdfDoc The PDF document
 * @param page The page to add the signature to
 * @param content The text content
 * @param coords The PDF coordinates
 */
async function addTextSignature(
  pdfDoc: PDFDocument,
  page: any,
  content: string,
  coords: { x: number; y: number; width: number; height: number }
) {
  console.log(`Drawing typed signature: "${content}"`);
  
  try {
    // Try embedding the font
    const helveticaFont = await pdfDoc.embedFont('Helvetica-Bold');
    
    // Calculate font size and position for centering
    const fontSize = Math.min(18, coords.height * 0.7);
    const textWidth = helveticaFont.widthOfTextAtSize(content, fontSize);
    
    // Center the text
    const textX = coords.x + (coords.width - textWidth) / 2;
    const textY = coords.y + (coords.height / 2) - (fontSize / 3);
    
    console.log(`Text positioned at: (${textX}, ${textY}), Font size: ${fontSize}`);
    
    // Draw the text
    page.drawText(content, {
      x: textX,
      y: textY,
      size: fontSize,
      color: rgb(0, 0, 0),
      font: helveticaFont
    });
  } catch (error) {
    console.error("Error with custom font, falling back to standard font:", error);
    
    // Fallback to standard font
    const fontSize = Math.min(18, coords.height * 0.7);
    const textX = coords.x + (coords.width / 2) - (content.length * fontSize * 0.3);
    const textY = coords.y + (coords.height / 2) - (fontSize / 3);
    
    page.drawText(content, {
      x: textX,
      y: textY,
      size: fontSize,
      color: rgb(0, 0, 0)
    });
  }
}

/**
 * Fallback method to save PDF using screenshot
 * @param containerRef Reference to the container element
 * @param pdfName Original PDF name
 * @returns Blob URL to the screenshot PDF
 */
export async function saveAsPdfScreenshot(
  containerRef: React.RefObject<HTMLDivElement>,
  pdfName: string | null
): Promise<string> {
  console.log("Attempting to capture PDF using screenshot approach...");
  
  if (!containerRef.current) {
    throw new Error("PDF container reference not found");
  }
  
  // Capture the container as an image
  const canvas = await html2canvas(containerRef.current, {
    scale: 2, // Higher quality
    useCORS: true,
    logging: true,
    onclone: (clonedDoc) => {
      console.log("Document cloned for screenshot");
      
      // Make signature fields look better in the screenshot
      const signatureFields = clonedDoc.querySelectorAll('.signature-field');
      signatureFields.forEach((el) => {
        const field = el as HTMLElement;
        
        // Remove borders and background
        field.style.border = 'none';
        field.style.background = 'transparent';
        field.style.boxShadow = 'none';
        
        // Style text signatures
        const textElement = field.querySelector('p');
        if (textElement) {
          textElement.style.color = '#000000';
          textElement.style.fontWeight = 'bold';
          textElement.style.fontFamily = 'Helvetica, Arial, sans-serif';
          textElement.style.fontSize = '16px';
          
          // Center the text
          textElement.style.display = 'flex';
          textElement.style.justifyContent = 'center';
          textElement.style.alignItems = 'center';
          textElement.style.height = '100%';
          textElement.style.margin = '0';
          textElement.style.padding = '0';
        }
        
        // Make images fit properly
        const imgElement = field.querySelector('img');
        if (imgElement) {
          imgElement.style.maxWidth = '100%';
          imgElement.style.maxHeight = '100%';
          imgElement.style.objectFit = 'contain';
        }
      });
    }
  });
  
  console.log("Canvas captured, dimensions:", canvas.width, "x", canvas.height);
  
  // Create a new PDF with the screenshot
  const pdfDoc = await PDFDocument.create();
  const jpgImage = await pdfDoc.embedJpg(canvas.toDataURL('image/jpeg', 0.95));
  
  const page = pdfDoc.addPage([canvas.width, canvas.height]);
  page.drawImage(jpgImage, {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
  });
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  console.log("Screenshot PDF created successfully");
  
  return url;
} 