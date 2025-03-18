import React, { useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, Download, Loader2, ImageIcon } from "lucide-react";
import SignaturePad from 'signature_pad';
import { useToast } from "@/components/ui/use-toast";

interface SignatureInfo {
  name: string;
  date: string;
  title?: string;
  company?: string;
}

interface SignatureToolsProps {
  signatureInfo: SignatureInfo;
  onSignatureInfoChange: (info: SignatureInfo) => void;
  onAddField: () => void;
  onSaveSignature: (type: string, content: string) => void;
  onSavePdf: () => void;
  isAddingField: boolean;
  isProcessing: boolean;
  selectedField: string | null;
  signatureType: "draw" | "type" | "image";
  onSignatureTypeChange: (type: "draw" | "type" | "image") => void;
}

/**
 * SignatureTools component - Provides tools for creating and managing signatures
 * This component is responsible for:
 * 1. Providing interfaces for drawing, typing, and uploading signatures
 * 2. Managing signature information like name, date, title, company
 * 3. Providing buttons for adding signature fields and saving the PDF
 */
const SignatureTools: React.FC<SignatureToolsProps> = ({
  signatureInfo,
  onSignatureInfoChange,
  onAddField,
  onSaveSignature,
  onSavePdf,
  isAddingField,
  isProcessing,
  selectedField,
  signatureType,
  onSignatureTypeChange
}) => {
  const { toast } = useToast();
  const signaturePadRef = useRef<HTMLCanvasElement>(null);
  const signaturePadInstance = useRef<SignaturePad | null>(null);
  
  // Initialize signature pad
  useEffect(() => {
    if (signaturePadRef.current) {
      signaturePadInstance.current = new SignaturePad(signaturePadRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
      });
      
      return () => {
        if (signaturePadInstance.current) {
          signaturePadInstance.current.off();
        }
      };
    }
  }, [signaturePadRef.current]);
  
  // Clear the signature pad
  const clearSignaturePad = () => {
    if (signaturePadInstance.current) {
      signaturePadInstance.current.clear();
    }
  };
  
  // Save the signature from the pad
  const saveDrawnSignature = () => {
    if (!signaturePadInstance.current) return;
    
    if (signaturePadInstance.current.isEmpty()) {
      toast({
        title: "Error",
        description: "Please provide a signature first",
        variant: "destructive",
      });
      return;
    }
    
    const dataURL = signaturePadInstance.current.toDataURL();
    onSaveSignature("draw", dataURL);
  };
  
  // Save typed signature
  const saveTypedSignature = () => {
    if (!signatureInfo.name.trim()) {
      toast({
        title: "Error",
        description: "Please type your signature first",
        variant: "destructive",
      });
      return;
    }
    
    onSaveSignature("type", signatureInfo.name);
  };
  
  // Handle signature info change
  const handleInfoChange = (key: keyof SignatureInfo, value: string) => {
    onSignatureInfoChange({
      ...signatureInfo,
      [key]: value
    });
    
    // If editing a type signature field, update it immediately
    if (key === 'name' && selectedField && signatureType === 'type') {
      onSaveSignature("type", value);
    }
  };
  
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 space-y-6">
        {/* Add Signature Field Button */}
        <Button
          onClick={onAddField}
          className="w-full bg-[#2BAC3E] hover:bg-[#1F8A2F] text-white"
          disabled={isAddingField}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Signature Field
        </Button>
        
        {/* Signature Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Signature Type
          </label>
          <Tabs
            value={signatureType}
            onValueChange={(value) => onSignatureTypeChange(value as "draw" | "type" | "image")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="draw">Draw</TabsTrigger>
              <TabsTrigger value="type">Type</TabsTrigger>
              <TabsTrigger value="image">Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="draw">
              <Card>
                <CardContent className="p-4">
                  <canvas
                    ref={signaturePadRef}
                    className="border border-gray-300 rounded-lg w-full h-32 bg-white"
                  />
                  <div className="flex justify-end mt-2 space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearSignaturePad}
                    >
                      Clear
                    </Button>
                    <Button 
                      size="sm"
                      onClick={saveDrawnSignature}
                    >
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="type">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <Input
                    placeholder="Type your signature"
                    value={signatureInfo.name}
                    onChange={(e) => handleInfoChange('name', e.target.value)}
                  />
                  <Select
                    onValueChange={(font) => {
                      console.log("Font changed to:", font);
                      // Apply font styling
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cursive">Cursive</SelectItem>
                      <SelectItem value="handwritten">Handwritten</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      onClick={saveTypedSignature}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="image">
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col items-center space-y-4">
                    <Button variant="outline" onClick={() => {
                      // Handle image upload
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const imageUrl = event.target?.result as string;
                            onSaveSignature("image", imageUrl);
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Upload Signature Image
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Signature Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Signature Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Full Name
              </label>
              <Input
                value={signatureInfo.name}
                onChange={(e) => handleInfoChange('name', e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Date
              </label>
              <Input
                type="date"
                value={signatureInfo.date}
                onChange={(e) => handleInfoChange('date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Title (Optional)
              </label>
              <Input
                value={signatureInfo.title}
                onChange={(e) => handleInfoChange('title', e.target.value)}
                placeholder="CEO"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Company (Optional)
              </label>
              <Input
                value={signatureInfo.company}
                onChange={(e) => handleInfoChange('company', e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Save and Download Buttons */}
        <div className="space-y-2">
          <Button 
            className="w-full" 
            onClick={onSavePdf}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Signed PDF
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={onSavePdf}
            disabled={isProcessing}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Signed PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignatureTools; 