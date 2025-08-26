"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-6">Welcome to Kursor 🎓</h1>
      <p className="mb-6 text-gray-600">Helping students find their perfect course</p>

      <div className="flex gap-4">
        <Link href="/login" className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
          Login
        </Link>
        <Link href="/signup" className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700">
          Sign Up
        </Link>
      </div>
    </main>
  );
}
