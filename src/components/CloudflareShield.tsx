import React, { useEffect, useState } from 'react';
import { Shield, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export function CloudflareShield({ children }: { children: React.ReactNode }) {
  const [isVerifying, setIsVerifying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Simulate Cloudflare Turnstile / Under Attack mode
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          return 100;
        }
        return p + Math.floor(Math.random() * 15) + 5;
      });
    }, 300);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100 && !success) {
      setSuccess(true);
      setTimeout(() => {
        setIsVerifying(false);
      }, 1000);
    }
  }, [progress, success]);

  if (!isVerifying) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center font-sans text-neutral-800">
      <div className="max-w-md w-full p-8 flex flex-col items-center text-center">
        {!success ? (
          <div className="w-16 h-16 mb-6 relative">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div 
              className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-orange-500">
               <Shield className="w-6 h-6 animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="w-16 h-16 mb-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 animate-in zoom-in">
             <Check className="w-8 h-8" />
          </div>
        )}
        
        <h1 className="text-2xl font-semibold mb-2">
          {success ? "Verification successful" : "Checking your browser before accessing..."}
        </h1>
        
        <p className="text-sm text-neutral-500 mb-8">
          This process is automatic. Your browser will redirect to your requested content shortly.
        </p>

        <div className="text-xs text-neutral-400 mt-12 flex flex-col items-center">
           <div>Ray ID: <span className="font-mono">{Math.random().toString(36).substring(2, 18).toUpperCase()}</span></div>
           <div className="mt-1">Performance & security by Cloudflare</div>
        </div>
      </div>
    </div>
  );
}
