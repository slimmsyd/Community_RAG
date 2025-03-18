/**
 * Utilities for handling PDF coordinate transformations
 * 
 * PDF coordinates have (0,0) at the bottom-left corner of the page,
 * while browser coordinates have (0,0) at the top-left corner.
 * This file provides utilities to convert between the two systems.
 */

interface PDFDimensions {
  width: number;
  height: number;
}

interface BrowserDimensions {
  width: number;
  height: number;
}

/**
 * Convert browser coordinates to PDF coordinates
 * @param x Browser x coordinate
 * @param y Browser y coordinate
 * @param width Width of the element in browser
 * @param height Height of the element in browser
 * @param browserDimensions The dimensions of the browser viewport
 * @param pdfDimensions The dimensions of the PDF page
 * @returns PDF coordinates {x, y, width, height}
 */
export function browserToPdfCoordinates(
  x: number,
  y: number,
  width: number,
  height: number,
  browserDimensions: BrowserDimensions,
  pdfDimensions: PDFDimensions
) {
  // Calculate scaling factors
  const scaleX = pdfDimensions.width / browserDimensions.width;
  const scaleY = pdfDimensions.height / browserDimensions.height;
  
  // Convert coordinates
  const pdfX = x * scaleX;
  
  // For Y, we need to flip the coordinate system
  // PDF origin is at bottom-left, browser origin is at top-left
  const pdfY = pdfDimensions.height - ((y + height) * scaleY);
  
  // Scale dimensions
  const pdfWidth = width * scaleX;
  const pdfHeight = height * scaleY;
  
  return { x: pdfX, y: pdfY, width: pdfWidth, height: pdfHeight };
}

/**
 * Convert PDF coordinates to browser coordinates
 * @param x PDF x coordinate
 * @param y PDF y coordinate
 * @param width Width of the element in PDF
 * @param height Height of the element in PDF
 * @param browserDimensions The dimensions of the browser viewport
 * @param pdfDimensions The dimensions of the PDF page
 * @returns Browser coordinates {x, y, width, height}
 */
export function pdfToBrowserCoordinates(
  x: number,
  y: number,
  width: number,
  height: number,
  browserDimensions: BrowserDimensions,
  pdfDimensions: PDFDimensions
) {
  // Calculate scaling factors
  const scaleX = browserDimensions.width / pdfDimensions.width;
  const scaleY = browserDimensions.height / pdfDimensions.height;
  
  // Convert coordinates
  const browserX = x * scaleX;
  
  // For Y, we need to flip the coordinate system
  // PDF origin is at bottom-left, browser origin is at top-left
  const browserY = (pdfDimensions.height - y - height) * scaleY;
  
  // Scale dimensions
  const browserWidth = width * scaleX;
  const browserHeight = height * scaleY;
  
  return { x: browserX, y: browserY, width: browserWidth, height: browserHeight };
}

/**
 * Get scaling factors between browser and PDF
 * @param browserDimensions The dimensions of the browser viewport
 * @param pdfDimensions The dimensions of the PDF page
 * @returns Scaling factors { scaleX, scaleY }
 */
export function getScalingFactors(
  browserDimensions: BrowserDimensions,
  pdfDimensions: PDFDimensions
) {
  return {
    scaleX: pdfDimensions.width / browserDimensions.width,
    scaleY: pdfDimensions.height / browserDimensions.height
  };
}

/**
 * Adjust coordinates for a specific page based on the iframe scroll position
 * @param x X coordinate relative to viewport
 * @param y Y coordinate relative to viewport
 * @param scrollX Horizontal scroll position
 * @param scrollY Vertical scroll position
 * @returns Absolute coordinates { x, y } relative to the document
 */
export function adjustForScroll(
  x: number,
  y: number,
  scrollX: number,
  scrollY: number
) {
  return {
    x: x + scrollX,
    y: y + scrollY
  };
}

/**
 * Calculate the position of an element relative to an iframe,
 * accounting for scroll position
 * @param element The element to position
 * @param iframe The iframe to position relative to
 * @returns The position { x, y } relative to the iframe's document
 */
export function getPositionRelativeToIframe(
  clientX: number, 
  clientY: number, 
  iframe: HTMLIFrameElement
) {
  const iframeRect = iframe.getBoundingClientRect();
  const relX = clientX - iframeRect.left;
  const relY = clientY - iframeRect.top;
  
  let scrollX = 0;
  let scrollY = 0;
  
  try {
    if (iframe.contentWindow) {
      scrollX = iframe.contentWindow.scrollX || 0;
      scrollY = iframe.contentWindow.scrollY || 0;
    }
  } catch (e) {
    console.warn("Could not access iframe's contentWindow:", e);
  }
  
  return {
    x: relX + scrollX,
    y: relY + scrollY
  };
} 