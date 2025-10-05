"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/homepage-navbar";

interface Program {
  id?: string;
  title: string;
  school?: string;
  reason: string;
}

export default function ProgramDetailsPage() {
  const [program, setProgram] = useState<Program | null>(null);
  const searchParams = useSearchParams();
  const programId = searchParams.get('id');

  useEffect(() => {
    const storedProgram = localStorage.getItem('selectedProgram');
    if (storedProgram) {
      setProgram(JSON.parse(storedProgram));
    }
  }, [programId]);

  if (!program) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
        <Navbar />
      <h1 className="text-4xl font-bold mb-4 pt-[9%]">{program.title}</h1>
      {program.school && <p className="text-xl text-gray-600 mb-4">{program.school}</p>}
      <p className="text-gray-700">{program.reason}</p>
    </div>
  );
}