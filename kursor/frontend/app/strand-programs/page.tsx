"use client";

import { Suspense } from "react";
import StrandProgramsPage from "./StrandProgramsClient"; // adjust path if needed

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StrandProgramsPage />
    </Suspense>
  );
}