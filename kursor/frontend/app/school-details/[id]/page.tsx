"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/supabaseClient";
import Navbar from "@/components/homepage-navbar";

interface School {
  id: string;
  name: string;
  details: string;
  school_logo: string;
  school_picture: string;
  location: string;
  institutional_email: string;
  contact_number: string;
  critique_review?: number;
}

export default function SchoolDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchSchoolDetails() {
      try {
        setLoading(true);
        
        // Fetch school data from Supabase
        const { data, error: fetchError } = await supabase
          .from('schools')
          .select('*')
          .eq('id', id)
          .single();
        
        console.log('Fetch result:', { data, fetchError });
        
        if (fetchError) {
          console.error('Supabase error details:', {
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint,
            code: fetchError.code
          });
          throw new Error(`Database error: ${fetchError.message}`);
        }
        
        if (!data) {
          setSchool(null);
          setLoading(false);
          return;
        }

        // Get public URLs for images from storage
        let logoUrl = '';
        let pictureUrl = '';

        if (data.school_logo) {
          const { data: logoData } = supabase.storage
            .from('school_logos')
            .getPublicUrl(data.school_logo);
          if (logoData) logoUrl = logoData.publicUrl;
        }

        if (data.school_picture) {
          const { data: pictureData } = supabase.storage
            .from('school_picture')
            .getPublicUrl(data.school_picture);
          if (pictureData) pictureUrl = pictureData.publicUrl;
        }

        setSchool({
          ...data,
          school_logo: logoUrl,
          school_picture: pictureUrl
        } as School);
      } catch (err) {
        console.error('Error fetching school:', err);
        setError((err as Error).message || 'Failed to load school details');
      } finally {
        setLoading(false);
      }
    }

    fetchSchoolDetails();
  }, [id]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  if (!school) {
    return <div className="p-8">School not found</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <h1 className="pt-30 text-2xl font-bold mb-4">School Data</h1>
      <div className="space-y-2">
        <p><strong>ID:</strong> {school.id}</p>
        <p><strong>Name:</strong> {school.name}</p>
        <p><strong>Location:</strong> {school.location}</p>
        <p><strong>Email:</strong> {school.institutional_email}</p>
        <p><strong>Contact:</strong> {school.contact_number}</p>
        <p><strong>Details:</strong> {school.details}</p>
        {school.critique_review && (
          <p><strong>Review:</strong> {school.critique_review}</p>
        )}
        <p><strong>Logo URL:</strong> {school.school_logo}</p>
        <p><strong>Picture URL:</strong> {school.school_picture}</p>
      </div>
    </div>
  );
} 