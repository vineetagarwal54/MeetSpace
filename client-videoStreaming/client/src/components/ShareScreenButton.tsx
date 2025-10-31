import React, { useState } from 'react';

interface ShareScreenButtonProps {
  onClick: () => Promise<void>;
}

export const ShareScreenButton: React.FC<ShareScreenButtonProps> = ({ onClick }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      await onClick();
    } catch (error) {
      console.error('Error sharing screen:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClass = `
    p-4 rounded-lg text-xl text-white transition-all duration-200
    ${isLoading ? 'bg-gray-500 cursor-wait' : 'bg-rose-600 hover:bg-rose-800'}
  `;

  return (
    <button
      className={buttonClass}
      onClick={handleClick}
      disabled={isLoading}
      title="Share your screen"
    >
      {isLoading ? (
        // Loading spinner
        <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
          />
        </svg>
      )}
    </button>
  );
};
