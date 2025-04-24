import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import LandingScreen from '@/components/landingScreen';

export default function Index() {
  const { initializeAuthListener } = useAuthStore();
  
  // Initialize Firebase auth listener when app loads
  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    
    // Clean up listener on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initializeAuthListener]);

  // The LandingScreen component handles its own authentication state
  // and navigation logic, so we simply render it here
  return <LandingScreen />;
}