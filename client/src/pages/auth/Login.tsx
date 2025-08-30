import React, { useState, useEffect } from 'react';
import { useAuthentikAuth } from '@/shared/contexts/AuthentikAuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const { signIn } = useAuthentikAuth();

  useEffect(() => {
    // Add a small delay for the entrance animation
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signIn();
      
      if (!result.success) {
        setError(result.error || 'Failed to initiate authentication');
      }
      // If successful, the user will be redirected to Authentik automatically
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: 'url(/marcoby_authentik_logos/flow_background.jpg)',
        }}
      />
             {/* Overlay for better text readability */}
       <div className="absolute inset-0 bg-gradient-to-br from-slate-900/30 via-green-900/10 to-slate-900/30" />
             {/* Animated background elements */}
       <div className="absolute inset-0">
         <div className="absolute top-0 -left-4 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
         <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
         <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
       </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className={`w-full max-w-md transform transition-all duration-700 ease-out ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
                     {/* Logo and branding */}
           <div className="text-center mb-8">
             <div className="flex justify-center mb-6">
               <img
                 src="/Nexus/Nexus by Marcoby - Transparent (500x250).png"
                 alt="Nexus by Marcoby"
                 className="w-64 h-auto drop-shadow-2xl animate-float"
               />
             </div>
             <div className="mt-4 w-16 h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mx-auto"></div>
           </div>

          {/* Login card */}
          <div className="backdrop-blur-2xl bg-black/20 border border-white/30 rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome Back
              </h2>
                             <p className="text-green-200 text-sm">
                 Sign in to access your business intelligence platform
               </p>
            </div>

            <div className="space-y-6">
                             <div className="text-center">
                 <p className="text-sm text-green-200 mb-6">
                   Sign in with your Marcoby account
                 </p>
               </div>

                             <button
                 type="button"
                 onClick={handleSignIn}
                 disabled={loading}
                 className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
               >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span className="animate-pulse">Redirecting to Marcoby...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Sign in with Marcoby
                  </>
                )}
              </button>

              {error && (
                <div className="backdrop-blur-md bg-red-500/20 border border-red-500/30 rounded-xl p-4 animate-pulse">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
                                {/* Footer */}
           <div className="text-center mt-8 space-y-4">
             <p className="text-sm text-green-300">
               Don't have an account yet?{' '}
               <Link 
                 to="/signup" 
                 className="text-green-200 hover:text-white transition-colors duration-200 font-medium underline"
               >
                 Sign up now
               </Link>
             </p>
             <p className="text-sm text-green-300">
               <Link 
                 to="/" 
                 className="text-green-200 hover:text-white transition-colors duration-200 flex items-center justify-center group"
               >
                <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to home page
               </Link>
             </p>
           </div>
        </div>
      </div>
    </div>
  );
} 
