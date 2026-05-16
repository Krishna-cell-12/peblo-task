// src/components/GoogleLoginButton.jsx
import React from 'react';

// In dev, use the Vite proxy (/api → backend). In production, set VITE_BACKEND_URL.
const googleAuthUrl = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')}/api/auth/google`
  : '/api/auth/google';

const GoogleLoginButton = () => {
  const handleGoogleLogin = () => {
    window.location.href = googleAuthUrl;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      type="button"
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 
                 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 
                 rounded-xl text-gray-700 dark:text-gray-200 font-medium 
                 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors duration-200"
    >
      <img 
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
        alt="Google" 
        className="w-5 h-5"
      />
      Continue with Google
    </button>
  );
};

export default GoogleLoginButton;
