"use client"; // Add this if using App Router

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";

// Create the context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const UserAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("UserAuth must be used within an AuthProvider");
  }
  
  return context;
};