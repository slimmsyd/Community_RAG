import { X } from "lucide-react";

interface PopupProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

export const Popup = ({ type, message, onClose }: PopupProps) => {
  const isSuccess = type === 'success';
  const color = isSuccess ? '#38D479' : 'red-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className={`bg-neutral-900 border border-${color}/20 rounded-lg p-6 max-w-md w-full mx-4 relative`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 text-${color} hover:text-${color}/80 transition-colors`}
        >
          <X size={20} />
        </button>
        <div className={`mb-2 text-${color}`}>{isSuccess ? 'Success' : 'Error'}</div>
        <p className="text-neutral-200">{message}</p>
      </div>
    </div>
  );
}; 