"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/supabaseClient"

interface NearbySchool {
  rank: number
  schoolname: string
  image: string
  distance?: string
}

export function useNearbySchools() {
  const [nearbySchools, setNearbySchools] = useState<NearbySchool[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNearbySchools = async () => {
      setLoading(true)
      try {
        // ✅ 1. Get logged-in user
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData?.user) {
          setError("User not logged in")
          return
        }

        const userId = userData.user.id

        // ✅ 2. Get user's saved coordinates
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("latitude, longitude")
          .eq("id", userId)
          .single()

        if (profileError || !profile?.latitude || !profile?.longitude) {
          setError("No saved location found for this user")
          return
        }

        const { latitude, longitude } = profile

        // ✅ 3. Call your nearby schools API
        const res = await fetch(`/api/nearby-school?lat=${latitude}&lng=${longitude}`)
        const data = await res.json()

        if (Array.isArray(data)) {
          const formatted = data.map((school: any, index: number) => ({
            rank: index + 1,
            schoolname: school.name,
            image: "/temporary-school-logo/default-school.png",
            distance: school.distance_km?.toFixed(2),
          }))
          setNearbySchools(formatted)
        } else {
          setError("No nearby schools found.")
        }
      } catch (err) {
        console.error("Failed to fetch nearby schools:", err)
        setError("Error fetching nearby schools.")
      } finally {
        setLoading(false)
      }
    }

    fetchNearbySchools()
  }, [])

  return { nearbySchools, loading, error }
}
