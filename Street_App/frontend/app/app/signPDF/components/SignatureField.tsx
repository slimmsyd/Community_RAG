import React from 'react';

export interface SignatureFieldData {
  id: string;
  type: "draw" | "type" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  page: number;
}

interface SignatureFieldProps {
  field: SignatureFieldData;
  isSelected: boolean;
  onClick: (fieldId: string) => void;
  onMouseDown: (e: React.MouseEvent, fieldId: string) => void;
}

/**
 * SignatureField component - Represents a single signature field on the PDF
 * This component is responsible for:
 * 1. Rendering the signature field with the correct styling
 * 2. Handling mouse events for selection and dragging
 * 3. Displaying the content (typed signature, drawn signature, or image)
 */
const SignatureField: React.FC<SignatureFieldProps> = ({ 
  field, 
  isSelected, 
  onClick, 
  onMouseDown 
}) => {
  return (
    <div
      className={`signature-field absolute border-2 cursor-move ${
        isSelected
          ? 'border-blue-500 bg-white/50 z-50'
          : 'border-gray-400 bg-gray-100/80 z-40'
      }`}
      style={{
        left: `${field.x}px`,
        top: `${field.y}px`,
        width: `${field.width}px`,
        height: `${field.height}px`,
        position: 'absolute',
        pointerEvents: 'auto'
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown(e, field.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(field.id);
      }}
    >
      {field.content && (
        <div className="w-full h-full flex items-center justify-center">
          {field.type === 'type' ? (
            <p className="text-lg text-black font-medium select-none">{field.content}</p>
          ) : field.type === 'image' || field.type === 'draw' ? (
            <img
              src={field.content}
              alt="Signature"
              className="max-w-full max-h-full object-contain select-none"
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SignatureField; 