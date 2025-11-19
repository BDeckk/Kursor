import { Suspense } from "react";
import SchoolDetailsPage from "@/components/SchoolDetailsClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SchoolDetailsPage />
    </Suspense>
  );
}