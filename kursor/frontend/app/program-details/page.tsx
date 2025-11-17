"use client";

import { Suspense } from "react";
import ProgramDetailsClient from "./ProgramDetailsClient";

export default function ProgramDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProgramDetailsClient />
    </Suspense>
  );
}