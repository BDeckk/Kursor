"use client"; 

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

  const insertUser = async (userData) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select();

      if (error) {
        console.error("Insert user error:", error);
        return { success: false, error };
      }
      return { success: true, data };
    } catch (err) {
      console.error("Unexpected error in insertUser:", err);
      return { success: false, error: err };
    }
  };

  const isUserExist = async (userID) => {
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userID)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking user:", checkError);
        return { success: false, error: checkError };
      }

      if (existingUser) {
        // User exists
        return { success: true, user: existingUser };
      }
      
      // User does not exist
      return { success: false, user: null };
    } catch (err) {
      console.error("Unexpected error in isUserExist:", err);
      return { success: false, error: err };
    }
  };

  //retrieve user profile (users)
  const getProfile = async (userId) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ session, loading, insertUser, isUserExist, getProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("UserAuth must be used within an AuthProvider");
  }
  
  return context;
};