import { X } from "lucide-react";
import { Button } from "./button";

interface ConfirmPopupProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmPopup = ({ 
  title, 
  message, 
  onConfirm, 
  onCancel,
  isLoading 
}: ConfirmPopupProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-neutral-900 border border-red-500/20 rounded-lg p-6 max-w-md w-full mx-4 relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        <div className="mb-2 text-red-500">{title}</div>
        <p className="text-neutral-200 mb-6">{message}</p>
        <div className="flex gap-4 justify-end">
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-neutral-700 hover:bg-neutral-800 rounded-[40px]"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-500/20 border border-red-500 hover:bg-red-500/40 rounded-[40px]"
          >
            Delete Proposal
          </Button>
        </div>
      </div>
    </div>
  );
}; 