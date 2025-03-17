import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Reader - Street Economics",
  description: "Upload and chat with PDF documents",
};

export default function ReadPDFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
} 