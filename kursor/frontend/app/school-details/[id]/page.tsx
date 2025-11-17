import { Suspense } from "react";
import SchoolDetailsPage from "./SchoolDetailsClient"; // adjust your path

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SchoolDetailsPage />
    </Suspense>
  );
}