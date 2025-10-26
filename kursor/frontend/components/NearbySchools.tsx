"use client";
import { useNearbySchools } from "@/hooks/userNearbySchools";

export default function NearbySchools() {
  const { nearbySchools, loading, error } = useNearbySchools();

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Nearby Schools</h2>

      {loading && <p>Finding nearby schools...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <ul className="mt-5 space-y-3">   
        {nearbySchools.map((school) => (
          <li key={school.rank} className="p-3 border rounded-lg hover:bg-gray-50">
            <p className="font-semibold">{school.schoolname}</p>
            <p className="text-sm text-gray-500">{school.distance} km away</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
