import { Metadata } from "next";
import PdfProcessor from "@/components/PdfProcessor";

export const metadata: Metadata = {
  title: "PDF Processor | StreetCode",
  description: "Upload and analyze PDF documents with AI",
};

export default function PdfProcessorPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">PDF Document Analysis</h1>
      <PdfProcessor />
    </div>
  );
} 