"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/homepage-navbar";
import { supabase } from "@/supabaseClient";

interface Program {
  id?: string;
  title: string;
  school?: string;
  reason: string;
  description?: string;
  image_url?: string | null;
}

export default function ProgramDetailsPage() {
  const [program, setProgram] = useState<Program | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const programId = searchParams.get("id");

  useEffect(() => {
    if (programId) {
      fetchProgramFromDatabase(programId);
    } else {
      const storedProgram = localStorage.getItem("selectedProgram");
      if (storedProgram) {
        const parsed = JSON.parse(storedProgram);
        setProgram(parsed);
        handleImageUrl(parsed);
      }
    }
  }, [programId]);

  async function fetchProgramFromDatabase(id: string) {
    try {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      console.log("📋 Program data from DB:", data);
      console.log("🖼️ Image URL from DB:", data.image_url);

      setProgram(data);
      handleImageUrl(data);
    } catch (err) {
      console.error("Error fetching program:", err);
      setError("Failed to load program");
      setLoadingImage(false);
    }
  }

  async function handleImageUrl(programData: Program) {
    try {
      setError(null);
      setLoadingImage(true);

      // 1️⃣ Check if image_url exists and is not null/empty
      if (programData.image_url && programData.image_url.trim() !== "") {
        console.log("✅ Image already exists in database, using it:", programData.image_url);
        setImageUrl(programData.image_url);
        setLoadingImage(false);
        return; // ← STOP HERE, don't fetch or upload
      }

      console.log("⚠️ No image in database, generating new one...");

      // 2️⃣ Fetch image from AI-powered service (changed from /api/pexels)
      const response = await fetch(
        `/api/generate-image?query=${encodeURIComponent(programData.title)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to generate image: ${response.status}`);
      }

      const { photoUrl } = await response.json();

      if (!photoUrl) {
        console.log("No photo found, using placeholder");
        const placeholderUrl = "https://placehold.co/800x400/e2e8f0/64748b?text=No+Image+Available";
        setImageUrl(placeholderUrl);
        setLoadingImage(false);
        return;
      }

      console.log("📸 Got photo URL:", photoUrl);

      // 3️⃣ Upload to Supabase Storage
      const fileName = `${programData.title.replace(/\s+/g, "_")}.jpg`;
      console.log("📤 Uploading as:", fileName);

      const uploadResponse = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: photoUrl,
          fileName,
          programId: programData.id,
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || `Upload failed: ${uploadResponse.status}`);
      }

      const { publicUrl } = await uploadResponse.json();
      console.log("✅ Image uploaded and saved to database:", publicUrl);

      setImageUrl(publicUrl);

      // Refresh program data to reflect the updated image_url
      if (programData.id) {
        const { data: refreshed } = await supabase
          .from("programs")
          .select("*")
          .eq("id", programData.id)
          .single();

        if (refreshed) {
          setProgram(refreshed);
        }
      }
    } catch (err) {
      console.error("❌ Error handling image:", err);
      setError(err instanceof Error ? err.message : "Failed to load image");
      setImageUrl("https://placehold.co/800x400/e2e8f0/64748b?text=Image+Error");
    } finally {
      setLoadingImage(false);
    }
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto pt-[9%] px-4 pb-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">{program.title}</h1>
        {program.school && (
          <p className="text-xl text-gray-600 mb-6">{program.school}</p>
        )}

        {/* Image section */}
        {loadingImage ? (
          <div className="w-full h-[400px] bg-gray-200 rounded-2xl mb-8 animate-pulse flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-2"></div>
              <p className="text-gray-500">Loading image...</p>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <img
              src={imageUrl || "https://placehold.co/800x400/e2e8f0/64748b?text=No+Image"}
              alt={program.title}
              className="w-full h-[400px] object-cover rounded-2xl shadow-lg"
              onError={(e) => {
                console.error("Image failed to load");
                e.currentTarget.src = "https://placehold.co/800x400/e2e8f0/64748b?text=Image+Not+Found";
              }}
            />
            {error && (
              <p className="text-sm text-red-500 mt-2 flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </p>
            )}
          </div>
        )}

        {/* Program Details */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">
            Why this program?
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
            {program.reason}
          </p>

          {program.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Program Description
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {program.description}
              </p>
            </div>
          )}
        </div>

        {/* Additional Info (if needed) */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            💡 Next Steps
          </h3>
          <p className="text-blue-800">
            Ready to pursue this program? Consider researching admission requirements,
            scholarship opportunities, and career paths in this field.
          </p>
        </div>
      </div>
    </div>
  );
}