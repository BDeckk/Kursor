"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/supabaseClient";
import { useRouter } from "next/navigation";
import { Bell, Home } from "lucide-react";
import { UserAuth } from "@/Context/AuthContext";
import SettingsModal from "@/app/settings/page";

type NotificationItem = {
  id: string;
  recipient_user_id: string;
  sender_user_id?: string | null;
  type: string;
  is_read: boolean;
  metadata: any;
  created_at: string;
};

export default function Navbar() {
  const router = useRouter();
  const { session } = UserAuth();
  const user = session?.user;

  // Profile
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Other states
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [schoolMap, setSchoolMap] = useState<Record<string, string>>({});
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const channelRef = useRef<any | null>(null);
  const pollingRef = useRef<any | null>(null);

  // AUTH CHECK
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setNotLoggedIn(true);
        setTimeout(() => router.replace("/"), 1500);
      }
    };
    checkAuth();
  }, [router]);

  // FETCH PROFILE (FIXED)
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoadingProfile(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("full_name, profile_image_url, email")
          .eq("id", user.id)
          .maybeSingle();

        if (!error && data) {
          setProfileData({
            full_name: data.full_name || "",
            profile_image_url: data.profile_image_url || null,
            email: data.email || user.email || "",
          });
        }
      } catch (err) {
        console.error("Profile error:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const getInitial = () => {
    if (profileData?.full_name?.length > 0)
      return profileData.full_name.charAt(0).toUpperCase();
    if (profileData?.email?.length > 0)
      return profileData.email.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  // FETCH NOTIFICATIONS
  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifs = (data || []) as NotificationItem[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.is_read).length);

      // Fetch school names
      const schoolIds = Array.from(
        new Set(notifs.map((n) => n.metadata?.school_id).filter(Boolean))
      );
      schoolIds.forEach((id) => fetchSchoolName(id));
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const fetchSchoolName = async (schoolId: string) => {
    if (!schoolId || schoolMap[schoolId]) return;
    try {
      const { data } = await supabase
        .from("schools")
        .select("name")
        .eq("id", schoolId)
        .maybeSingle();

      if (data) {
        setSchoolMap((prev) => ({ ...prev, [schoolId]: data.name }));
      }
    } catch (err) {
      console.error("School name fetch error:", err);
    }
  };

  // REALTIME + POLLING
  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    const channel = supabase
      .channel(`notifications:user=${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload: any) => {
          const ev = payload.eventType || payload.event;
          const newRecord = payload.new;
          const oldRecord = payload.old;

          if (ev === "INSERT") {
            setNotifications((p) => [newRecord, ...p].slice(0, 50));
            if (!newRecord.is_read) setUnreadCount((c) => c + 1);
          } else if (ev === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) => (n.id === newRecord.id ? newRecord : n))
            );
            const totalUnread = notifications.filter((n) => !n.is_read).length;
            setUnreadCount(totalUnread);
          } else if (ev === "DELETE") {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== oldRecord.id)
            );
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    pollingRef.current = setInterval(fetchNotifications, 5000);

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const markAllAsRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_user_id", user?.id);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleClickNotification = async (n: NotificationItem) => {
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
    }

    if (n.metadata?.school_id && n.metadata?.review_id) {
      router.push(`/school-details/${n.metadata.school_id}#review-${n.metadata.review_id}`);
    } else {
      router.push("/dashboard");
    }

    setNotifDropdownOpen(false);
  };

  return (
    <>
      {/* NOT LOGGED IN OVERLAY */}
      {notLoggedIn && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999] text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            You're not logged in
          </h2>
          <p className="text-gray-600">
            Redirecting to website's landing page...
          </p>
        </div>
      )}

      {/* NAVBAR */}
      <header className="flex justify-between items-center h-20 fixed left-0 w-full z-50 bg-gradient-to-b from-white to-white/85 pr-[3%] pl-[3%]">
        <div className="flex items-center">
          <img src="/Kursor.png" alt="Kursor logo" className="h-12 w-auto" />
        </div>

        <div className="flex items-center gap-4 pt-1">
          {/* Home */}
          <button
            onClick={() => router.push("/dashboard")}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          >
            <Home className="w-5 h-5 text-gray-700" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() =>
                (setNotifDropdownOpen((o) => !o),
                setProfileDropdownOpen(false))
              }
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center relative"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 text-xs bg-red-300 text-red-800 rounded-full px-2 py-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-96 max-h-[420px] bg-white shadow-lg rounded-lg py-2 z-50">
                <div className="flex justify-between px-4 py-2 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No notifications
                  </div>
                ) : (
                  <ul className="max-h-[360px] overflow-y-auto">
                    {notifications.slice(0, 6).map((n) => (
                      <li
                        key={n.id}
                        className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer ${
                          n.is_read ? "" : "bg-gray-50"
                        }`}
                        onClick={() => handleClickNotification(n)}
                      >
                        <div className="flex justify-between">
                          <p className="text-sm">{n.type}</p>
                          <span className="text-xs text-gray-400">
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                        </div>

                        {n.metadata?.school_id && (
                          <p className="text-xs text-gray-600 mt-1">
                            On school{" "}
                            <strong>
                              {schoolMap[n.metadata.school_id] ||
                                n.metadata.school_id}
                            </strong>
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() =>
                (setProfileDropdownOpen((o) => !o), setNotifDropdownOpen(false))
              }
              className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold hover:bg-yellow-500 overflow-hidden"
            >
              {loadingProfile ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : profileData?.profile_image_url ? (
                <img
                  src={profileData.profile_image_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitial()
              )}
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg py-2 z-50">
                <button
                  onClick={() => router.push("/profile")}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Profile
                </button>

                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Settings Modal (unchanged) */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
