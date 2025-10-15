    "use client";

    import { useEffect, useState } from "react";
    import Image from "next/image";
    import { supabase } from "@/supabaseClient";

    interface MainImageProps {
    programData: {
        id?: string;
        title: string;
        description?: string;
        school?: string;
    };
    }

    export default function MainImage({ programData }: MainImageProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const bucketName = "course-images";
    const fileName = `${programData.id || programData.title}.jpg`;

    useEffect(() => {
        if (programData?.id || programData?.title) {
        fetchOrGenerateImage();
        }
    }, [programData]);

    async function fetchOrGenerateImage() {
        try {
        setLoading(true);

        // 1️⃣ Check if the program already has an image URL in the "programs" table
        if (programData.id) {
            const { data: dbRecord, error: dbError } = await supabase
            .from("programs")
            .select("image_url")
            .eq("id", programData.id)
            .single();

            if (dbError) {
            console.warn("⚠️ Error checking existing image_url:", dbError);
            } else if (dbRecord?.image_url) {
            setImageUrl(dbRecord.image_url);
            setLoading(false);
            return;
            }
        }

        // 2️⃣ Try to retrieve image from Supabase Storage
        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
            const { data: exists } = await supabase.storage
            .from(bucketName)
            .list("", { search: fileName });

            if (exists && exists.length > 0) {
            const url = publicUrlData.publicUrl;
            setImageUrl(url);

            // ✅ Save it in the database for next time
            if (programData.id) {
                await supabase
                .from("programs")
                .update({ image_url: url })
                .eq("id", programData.id);
            }

            setLoading(false);
            return;
            }
        }

        // 3️⃣ If not found, generate one using Pexels
        const generatedUrl = await generateImage(programData.title);
        if (!generatedUrl) throw new Error("Failed to generate image from Pexels.");

        // 4️⃣ Upload generated image to Supabase Storage
        const imageBlob = await fetch(generatedUrl).then((res) => res.blob());
        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, imageBlob, {
            upsert: true,
            contentType: "image/jpeg",
            });

        if (uploadError) throw uploadError;

        // 5️⃣ Get the public URL after upload
        const { data: uploadedPublicUrl } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        if (uploadedPublicUrl?.publicUrl) {
            const url = uploadedPublicUrl.publicUrl;
            setImageUrl(url);

            // ✅ Save generated URL in database
            if (programData.id) {
            await supabase
                .from("programs")
                .update({ image_url: url })
                .eq("id", programData.id);
            }
        }
        } catch (err) {
        console.error("❌ Error fetching or generating image:", err);
        } finally {
        setLoading(false);
        }
    }

    // Fetch image from Pexels API
    async function generateImage(query: string): Promise<string | null> {
        try {
        const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
        if (!PEXELS_API_KEY) {
            console.error("❌ Missing Pexels API key! Add NEXT_PUBLIC_PEXELS_API_KEY to .env.local");
            return null;
        }

        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
            {
            headers: {
                Authorization: PEXELS_API_KEY,
            },
            }
        );

        if (!response.ok) throw new Error("Pexels API request failed");

        const data = await response.json();
        return data.photos?.[0]?.src?.large || null;
        } catch (error) {
        console.error("⚠️ Error fetching from Pexels:", error);
        return null;
        }
    }

    return (
  <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen h-[400px] md:h-[500px] mb-10 rounded-none overflow-hidden bg-gray-100">
    {loading ? (
      <div className="flex items-center justify-center h-full text-gray-400 text-lg animate-pulse">
        Loading image...
      </div>
    ) : imageUrl ? (
      <Image
        src={imageUrl}
        alt={programData.title}
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
    ) : (
      <div className="flex items-center justify-center h-full text-gray-400 text-lg">
        No image available
      </div>
    )}
  </div>
);
    }
