import React, { useState, useEffect } from 'react';
import { CLIENT_CONFIG } from '../config/clientConfig';
import { ShieldAlert } from 'lucide-react';

export default function DomainGuard({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthorization = () => {
      const currentHost = window.location.hostname;
      const now = new Date();

      // 1. Check if the current domain is in the allowed list
      const isDomainValid = CLIENT_CONFIG.authorizedDomains.includes(currentHost);

      // 2. Check if the hardcoded expiry date has passed (if one is set)
      let isNotExpired = true;
      if (CLIENT_CONFIG.expiryDate) {
        const expiry = new Date(CLIENT_CONFIG.expiryDate);
        if (now > expiry) {
          isNotExpired = false;
        }
      }

      if (isDomainValid && isNotExpired) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
      
      setLoading(false);
    };

    checkAuthorization();
  }, []);

  if (loading) {
    return null; // Silent load
  }

  // If authorized, silently render the app normally! The client never knows it checked.
  if (isAuthorized) {
    return children;
  }

  // If NOT authorized (stolen code on another domain, or expired), block the app entirely.
  return (
    <div className="h-screen w-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center space-y-4">
        <ShieldAlert size={64} className="mx-auto text-red-600 mb-4" />
        <h1 className="text-3xl font-black text-gray-900">403 Forbidden</h1>
        <p className="text-gray-600 font-medium">
          This software is not authorized to run on this domain server.
        </p>
        <p className="text-sm text-gray-500 pt-4 border-t border-gray-100">
          Current Host: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-red-600">{window.location.hostname}</span>
        </p>
        <p className="text-xs text-gray-400">Please contact the ERP Provider.</p>
      </div>
    </div>
  );
}
