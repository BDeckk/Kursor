"use-client"; 

import Navbar from "@/components/homepage-navbar";
import { Main } from "next/document";
import React from "react";

export default function SchoolPage() {
return (
    <main className="min-h-screen bg-white">
        <Navbar />
        <h1>School Page</h1>
    </main>
)
}