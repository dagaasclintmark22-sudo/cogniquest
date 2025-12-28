import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDangerous = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm p-4 md:inset-0 h-modal md:h-full">
      <div className="relative w-full max-w-md h-full md:h-auto">
        <div className="relative bg-white rounded-lg shadow-xl">
          <button
            type="button"
            className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
            <span className="sr-only">Close modal</span>
          </button>
          <div className="p-6 text-center">
            <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center ${isDangerous ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="mb-2 text-lg font-normal text-gray-900">{title}</h3>
            <div className="mb-5 text-sm text-gray-500">{message}</div>
            <div className="flex justify-center gap-4">
                <button
                    onClick={onClose}
                    type="button"
                    className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
                >
                    {cancelText}
                </button>
                <button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    type="button"
                    className={`text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center ${isDangerous ? 'bg-red-600 hover:bg-red-800 focus:ring-red-300' : 'bg-indigo-600 hover:bg-indigo-800 focus:ring-indigo-300'}`}
                >
                    {confirmText}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
