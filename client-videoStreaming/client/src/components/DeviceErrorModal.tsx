import React from 'react';

interface DeviceErrorModalProps {
  isOpen: boolean;
  error: string;
  onRetry: () => void;
  onAudioOnly: () => void;
  onClose: () => void;
}

export const DeviceErrorModal: React.FC<DeviceErrorModalProps> = ({
  isOpen,
  error,
  onRetry,
  onAudioOnly,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Device Access Error</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mb-6">
          <p className="text-sm text-gray-500">{error}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onRetry}
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
          >
            Retry with Camera
          </button>
          <button
            onClick={onAudioOnly}
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
          >
            Join Audio Only
          </button>
        </div>
      </div>
    </div>
  );
};