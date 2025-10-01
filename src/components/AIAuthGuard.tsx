import React, { useState, useEffect } from 'react';
import { isAIAuthenticated, authenticateAI } from '@/lib/ai/auth';

interface AIAuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AIAuthGuard: React.FC<AIAuthGuardProps> = ({ 
  children, 
  fallback = <div>AI features require authentication</div> 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    setIsAuthenticated(isAIAuthenticated());
  }, []);

  const handleAuth = () => {
    if (authenticateAI(passcode)) {
      setIsAuthenticated(true);
      setShowAuth(false);
      setAuthError('');
    } else {
      setAuthError('Invalid passcode');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  if (showAuth) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI Features Locked</h3>
            <p className="text-sm text-gray-500 mb-6">
              Enter the passcode to unlock AI-powered features.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passcode
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter passcode"
            />
            {authError && (
              <p className="mt-2 text-sm text-red-600">{authError}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAuth(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAuth}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Unlock AI Features
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => setShowAuth(true)} className="cursor-pointer">
      {fallback}
    </div>
  );
};
