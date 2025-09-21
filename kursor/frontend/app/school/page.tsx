"use client"; 

import Navbar from "@/components/homepage-navbar";
import { useSearchParams } from "next/navigation";

export default function SchoolPage() {
  const params = useSearchParams();
  const schoolName = params.get("name");

  return (
    <div className="min-h-screen bg-white">
          {/* Navbar */}
          <Navbar />
        <h1 className="pt-[20%]">Welcome to {schoolName}</h1>
    </div>
  
);
}
