import React, { useState, useEffect } from 'react';
import SignatureField, { SignatureFieldData } from './SignatureField';

interface SignatureOverlayProps {
  pdfDimensions: {
    width: number;
    height: number;
    pageCount: number;
  };
  fields: SignatureFieldData[];
  currentPage: number;
  selectedField: string | null;
  isAddingField: boolean;
  onSelectField: (fieldId: string | null) => void;
  onFieldMove: (fieldId: string, x: number, y: number) => void;
  onAddField: (x: number, y: number) => void;
}

/**
 * SignatureOverlay component - Manages the signature fields on top of the PDF
 * This component is responsible for:
 * 1. Rendering all signature fields at their correct positions
 * 2. Handling click events for field selection and creation
 * 3. Handling drag events for field repositioning
 * 4. Synchronizing coordinate systems between browser and PDF
 */
const SignatureOverlay: React.FC<SignatureOverlayProps> = ({
  pdfDimensions,
  fields,
  currentPage,
  selectedField,
  isAddingField,
  onSelectField,
  onFieldMove,
  onAddField,
}) => {
  // Filter fields for the current page
  const currentPageFields = fields.filter(field => field.page === currentPage);
  
  // Handle canvas click for adding a new field
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking on a signature field, don't do anything (handled by the SignatureField component)
    if ((e.target as HTMLElement).closest('.signature-field')) {
      return;
    }
    
    // If we're not adding a field, just deselect
    if (!isAddingField) {
      onSelectField(null);
      return;
    }
    
    // Calculate position relative to the canvas
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Get the iframe for scroll position
    const iframe = document.getElementById('pdf-viewer-iframe') as HTMLIFrameElement;
    if (!iframe || !iframe.contentWindow) {
      console.error("PDF iframe not found");
      return;
    }
    
    // Adjust for scroll position
    let scrollX = 0;
    let scrollY = 0;
    
    try {
      scrollX = iframe.contentWindow.scrollX || 0;
      scrollY = iframe.contentWindow.scrollY || 0;
    } catch (error) {
      console.warn("Could not access iframe's contentWindow:", error);
    }
    
    // Add position with scroll offset
    const adjustedX = x + scrollX;
    const adjustedY = y + scrollY;
    
    // Add the new field
    onAddField(adjustedX, adjustedY);
  };
  
  // Handle field mouse down for dragging
  const handleFieldMouseDown = (e: React.MouseEvent, fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    // Get the iframe for coordinate calculation
    const iframe = document.getElementById('pdf-viewer-iframe') as HTMLIFrameElement;
    if (!iframe) {
      console.error("PDF iframe not found");
      return;
    }
    
    // Get iframe position
    const iframeRect = iframe.getBoundingClientRect();
    
    // Initial mouse position relative to the iframe
    const initialX = e.clientX - iframeRect.left;
    const initialY = e.clientY - iframeRect.top;
    
    // Offset from the field's corner
    const offsetX = initialX - field.x;
    const offsetY = initialY - field.y;
    
    // Current scroll position
    let initialScrollX = 0;
    let initialScrollY = 0;
    
    try {
      if (iframe.contentWindow) {
        initialScrollX = iframe.contentWindow.scrollX || 0;
        initialScrollY = iframe.contentWindow.scrollY || 0;
      }
    } catch (error) {
      console.warn("Could not access iframe's contentWindow:", error);
    }
    
    // Mouse move handler
    const handleMouseMove = (moveEvent: MouseEvent) => {
      // New position relative to iframe
      const newX = moveEvent.clientX - iframeRect.left - offsetX;
      const newY = moveEvent.clientY - iframeRect.top - offsetY;
      
      // Current scroll position
      let currentScrollX = initialScrollX;
      let currentScrollY = initialScrollY;
      
      try {
        if (iframe.contentWindow) {
          currentScrollX = iframe.contentWindow.scrollX || 0;
          currentScrollY = iframe.contentWindow.scrollY || 0;
        }
      } catch (error) {
        // Use initial scroll values
      }
      
      // Final position with scroll adjustment
      const adjustedX = newX + (currentScrollX - initialScrollX);
      const adjustedY = newY + (currentScrollY - initialScrollY);
      
      // Update the field position
      onFieldMove(fieldId, adjustedX, adjustedY);
    };
    
    // Mouse up handler
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div
      className="absolute inset-0 w-full h-full"
      onClick={handleCanvasClick}
      style={{ 
        pointerEvents: isAddingField ? 'auto' : 'none',
      }}
    >
      {/* Render all signature fields for the current page */}
      {currentPageFields.map(field => (
        <SignatureField
          key={field.id}
          field={field}
          isSelected={field.id === selectedField}
          onClick={onSelectField}
          onMouseDown={handleFieldMouseDown}
        />
      ))}
    </div>
  );
};

export default SignatureOverlay; 