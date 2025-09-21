"use client";

import Navbar from "@/components/homepage-navbar";
import { useState, useEffect } from "react";
 
type RIASEC = "R" | "I" | "A" | "S" | "E" | "C";



export default function () {
const [scores, setScores] = useState<Record<RIASEC, number> | null>(null);

useEffect(() => {
    // Get scores from localStorage
    const savedScores = localStorage.getItem('scores');
    if (savedScores) {
      setScores(JSON.parse(savedScores));
    }
  }, []);

    return (
        <div className="min-h-screen bg-gray-100">
            < Navbar />
            <h1> Result Page</h1>

                <div className="bg-red-100 p-4 m-4">
                    <h3>Debug Info:</h3>
                    <pre>{JSON.stringify(scores, null,2 )}</pre>
                    </div>
            
        </div>
    )
}