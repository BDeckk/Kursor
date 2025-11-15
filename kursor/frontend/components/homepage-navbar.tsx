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

  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [schoolMap, setSchoolMap] = useState<Record<string, string>>({}); // school_id -> name
  const channelRef = useRef<any | null>(null);
  const pollingRef = useRef<number | null>(null);

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // --- AUTH CHECK ---
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

  // --- FETCH PROFILE ---
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoadingProfile(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("users")
          .select("full_name, profile_image_url")
          .eq("id", user.id)
          .maybeSingle();
        if (!error && data) setProfileData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [user?.id]);

  // --- FETCH NOTIFICATIONS ---
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

      // fetch school names for existing notifications
      const schoolIds = Array.from(new Set(notifs.map(n => n.metadata?.school_id).filter(Boolean)));
      schoolIds.forEach(id => fetchSchoolName(id));
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // --- FETCH SINGLE SCHOOL NAME ---
  const fetchSchoolName = async (schoolId: string) => {
    if (!schoolId || schoolMap[schoolId]) return;
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("name")
        .eq("id", schoolId)
        .maybeSingle();
      if (!error && data) {
        setSchoolMap(prev => ({ ...prev, [schoolId]: data.name }));
      }
    } catch (err) {
      console.error("Error fetching school name:", err);
    }
  };

  // --- REALTIME SUBSCRIPTION + POLLING ---
  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    const channel = supabase
      .channel(`public:notifications:user=${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_user_id=eq."${user.id}"`,
        },
        (payload) => {
          const ev = (payload as any).eventType || (payload as any).event;
          const newRecord = (payload as any).new;
          const oldRecord = (payload as any).old;

          if (ev === "INSERT") {
            setNotifications(prev => [newRecord, ...prev].slice(0, 50));
            if (!newRecord.is_read) setUnreadCount(c => c + 1);

            if (newRecord.metadata?.school_id) fetchSchoolName(newRecord.metadata.school_id);
          } else if (ev === "UPDATE") {
            setNotifications(prev => prev.map(n => (n.id === newRecord.id ? newRecord : n)));
            setUnreadCount(prev => {
              const merged = (notifications || []).map(n => (n.id === newRecord.id ? newRecord : n));
              return merged.filter(n => !n.is_read).length;
            });
          } else if (ev === "DELETE") {
            setNotifications(prev => prev.filter(n => n.id !== oldRecord.id));
            setUnreadCount(c => Math.max(0, c - (oldRecord.is_read ? 0 : 1)));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    pollingRef.current = window.setInterval(fetchNotifications, 5000);

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [user?.id]);

  // --- LOGOUT ---
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error(err);
    }
  };

  // --- MARK AS READ ---
  const markAsRead = async (notifId: string) => {
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("id", notifId);
      setNotifications(prev => prev.map(n => (n.id === notifId ? { ...n, is_read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("recipient_user_id", user.id).eq("is_read", false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  // --- HANDLE NOTIFICATION CLICK ---
  const handleClickNotification = async (n: NotificationItem) => {
    if (!n.is_read) await markAsRead(n.id);
    const meta = n.metadata || {};
    if (meta.school_id && meta.review_id) {
      router.push(`/school-details/${meta.school_id}#review-${meta.review_id}`);
    } else {
      router.push("/dashboard");
    }
    setNotifDropdownOpen(false);
  };

  const getInitial = () => {
    if (profileData?.full_name) return profileData.full_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <>
      {notLoggedIn && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999] text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">You're not logged in</h2>
          <p className="text-gray-600">Redirecting to website's landing page...</p>
          <div className="mt-6">
            <svg className="animate-spin h-7 w-7 text-[#FFDE59]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center h-20 fixed left-0 w-full z-50 bg-gradient-to-b from-white to-white/85 pr-[3%] pl-[3%]">
        <div className="flex items-center">
          <img src="/Kursor.png" alt="Kursor logo" className="h-12 w-auto" />
        </div>

        <div className="flex items-center gap-4 pt-1">
          <button onClick={() => router.push("/dashboard")} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200" title="Home">
            <Home className="w-5 h-5 text-gray-700" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => { setNotifDropdownOpen(o => !o); setProfileDropdownOpen(false); }} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 relative" title="Notifications">
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-800 bg-red-300 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-96 max-h-[420px] bg-white shadow-lg rounded-lg py-2 z-50">
                <div className="flex items-center justify-between px-4 py-2 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                  <button onClick={markAllAsRead} className="text-sm text-gray-500 hover:underline">
                    Mark all read
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No notifications</div>
                ) : (
                  <ul className="max-h-[360px] overflow-y-auto">
                    {notifications.slice(0, 6).map((n) => (
                      <li
                        key={n.id}
                        className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer ${n.is_read ? "" : "bg-gray-50"}`}
                        onClick={() => handleClickNotification(n)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-800">
                                {(() => {
                                  switch (n.type) {
                                    case "like_review": return "Someone liked your review";
                                    case "like_reply": return "Someone liked your reply";
                                    case "reply": return "Someone replied to your review";
                                    case "reply_to_reply": return "Someone replied to your reply";
                                    default: return n.type;
                                  }
                                })()}
                              </p>
                              <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
                            </div>

                            {n.metadata?.school_id && (
                              <p className="text-xs text-gray-600 mt-1">
                                On school <strong>{schoolMap[n.metadata.school_id] || n.metadata.school_id}</strong>
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

          </div>

          {/* Profile */}
          <div className="relative">
            <button onClick={() => { setProfileDropdownOpen(o => !o); setNotifDropdownOpen(false); }} className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-black hover:bg-yellow-500 transition-colors duration-200 overflow-hidden">
              {loadingProfile ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : profileData?.profile_image_url ? (
                <img src={profileData.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getInitial()
              )}
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg py-2 z-50">
                <button onClick={() => router.push("/profile")} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">Profile</button>
                <button onClick={() => { setProfileDropdownOpen(false); setIsSettingsOpen(true); }} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">Settings</button>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">Log Out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
