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
        const { data, error: fetchError } = await supabase
          .from("schools")
          .select("*")
          .eq("id", id)
          .single();

        console.log("Fetch result:", { data, fetchError });

        if (fetchError) throw new Error(fetchError.message);
        if (!data) {
          setSchool(null);
          return;
        }

        const logoUrl = data.school_logo;
        const pictureUrl = data.school_picture;

        setSchool({
          ...data,
          school_logo: logoUrl,
          school_picture: pictureUrl,
        });
      } catch (err) {
        console.error("Error fetching school:", err);
        setError((err as Error).message || "Failed to load school details");
      } finally {
        setLoading(false);
      }
    }

    fetchSchoolDetails();
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!school) return <div className="p-8">School not found</div>;

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

        <img
          src={school.school_logo || "/placeholder-logo.png"}
          alt={`${school.name} logo`}
          className="w-32 h-32 object-contain border rounded-lg"
        />

        <img
          src={school.school_picture || "/placeholder-picture.png"}
          alt={`${school.name} picture`}
          className="w-full max-w-md object-cover border rounded-lg"
        />
      </div>
    </div>
  );
}
