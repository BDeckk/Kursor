"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/supabaseClient";
import { useRouter } from "next/navigation";
import { Bell, Home, Search, X } from "lucide-react";
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

type SchoolResult = {
  type: "school";
  id: string;
  name: string;
  school_logo: string;
  location: string;
};

type ProgramResult = {
  type: "program";
  id: string;
  program_name: string;
  school_id?: string;
  school_name: string;
};

type SearchResult = SchoolResult | ProgramResult;

export default function Navbar() {
  const router = useRouter();
  const { session } = UserAuth();
  const user = session?.user;

  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [notLoggedIn, setNotLoggedIn] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [schoolMap, setSchoolMap] = useState<Record<string, string>>({});
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const channelRef = useRef<any | null>(null);
  const pollingRef = useRef<any | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const currentAbortRef = useRef<AbortController | null>(null);

  // Normalize notification type
  const normalizeType = (type: string = "") =>
    type.trim().toLowerCase().replace(/\s+/g, "_");

  // Map message to actual types
  const formatNotificationMessage = (type: string) => {
    const cleanType = normalizeType(type);

    const map: Record<string, string> = {
      reply: "Someone replied to your review",
      like_review: "Someone liked your review",
      reply_to_reply: "Someone replied to your reply",
      like_reply: "Someone liked your reply",
    };

    return map[cleanType] || "New activity on your content";
  };

  /* ----------------- Search Handler ----------------- */
  const runSearch = useCallback(
    async (query: string) => {
      // Cancel previous in-flight request
      if (currentAbortRef.current) {
        try {
          currentAbortRef.current.abort();
        } catch (_) {}
      }
      const abort = new AbortController();
      currentAbortRef.current = abort;

      if (query.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      setShowResults(true);

      try {
        const sanitized = query.trim();
        const ilikeTerm = `%${sanitized}%`;

        // Search schools
        const schoolPromise = supabase
          .from("schools")
          .select("id, name, school_logo, location")
          .ilike("name", ilikeTerm)
          .limit(6)
          .abortSignal(abort.signal);

        // Search programs
        const programPromise = supabase
          .from("programs")
          .select("id, title")
          .ilike("title", ilikeTerm)
          .limit(6)
          .abortSignal(abort.signal);

        const [schoolRes, programRes] = await Promise.all([schoolPromise, programPromise]);

        const { data: schools, error: schoolError } = schoolRes;
        const { data: programs, error: programError } = programRes;

        if (schoolError) {
          console.error("School search error:", schoolError);
        }
        if (programError) {
          console.error("Program search error:", programError);
        }

        // Normalize school results
        const schoolResults: SchoolResult[] = (schools ?? []).map((s: any) => ({
          type: "school",
          id: String(s.id),
          name: s.name ?? "Unnamed School",
          school_logo: s.school_logo ?? "/temporary-school-logo/placeholder.png",
          location: s.location ?? "",
        }));

        // Normalize program results
        const programResults: ProgramResult[] = (programs ?? []).map((p: any) => ({
          type: "program",
          id: String(p.id),
          program_name: p.title || "Unnamed Program",
          school_name: "Program",
        }));

        setSearchResults([...schoolResults, ...programResults]);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("Search error:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  // Debounced effect for searchQuery
  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      runSearch(searchQuery);
    }, 300);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, runSearch]);

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside, { passive: true });
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchQuery("");

    if (result.type === "school") {
      router.push(`/school-details/${result.id}`);
    } else {
      router.push(`/program-details?id=${result.id}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    if (currentAbortRef.current) {
      try {
        currentAbortRef.current.abort();
      } catch (_) {}
      currentAbortRef.current = null;
    }
  };

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

  // FETCH PROFILE
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

      let notifs = (data || []) as NotificationItem[];
      notifs = notifs.filter(n => n.metadata?.school_id);

      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.is_read).length);

      const schoolIds = Array.from(
        new Set(notifs.map((n) => n.metadata?.school_id))
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

          if (ev === "INSERT") {
            const newRecord = payload.new;
            setNotifications((p) => [newRecord, ...p].slice(0, 50));
            if (!newRecord.is_read) setUnreadCount((c) => c + 1);
          } else if (ev === "UPDATE") {
            const newRecord = payload.new;
            setNotifications((prev) =>
              prev.map((n) => (n.id === newRecord.id ? newRecord : n))
            );
            const totalUnread = notifications.filter((n) => !n.is_read).length;
            setUnreadCount(totalUnread);
          } else if (ev === "DELETE") {
            const oldRecord = payload.old;
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

  // MARK ALL AS READ
  const markAllAsRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_user_id", user?.id);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  // CLEAR ALL NOTIFICATIONS
  const clearNotifications = async () => {
    if (!user?.id) return;

    await supabase
      .from("notifications")
      .delete()
      .eq("recipient_user_id", user.id);

    setNotifications([]);
    setUnreadCount(0);
  };

  // CLICK NOTIFICATION
  const handleClickNotification = async (n: NotificationItem) => {
    if (!n.is_read) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", n.id);
    }

    if (n?.metadata?.school_id && n?.metadata?.review_id) {
      router.push(
        `/school-details/${n.metadata.school_id}#review-${n.metadata.review_id}`
      );
    } else {
      router.push("/dashboard");
    }

    setNotifDropdownOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <>
      {notLoggedIn && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999] text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            You're not logged in
          </h2>
          <p className="text-gray-600">Redirecting to website's landing page...</p>
        </div>
      )}

      <header className="flex justify-between items-center h-20 fixed left-0 w-full z-50 bg-gradient-to-b from-white to-white/85 pr-[3%] pl-[3%]">
        <div className="flex items-center">
          <img src="/Kursor.png" alt="Kursor logo" className="h-12 w-auto" />
        </div>

        {/* Search Bar - Center */}
        <div className="flex-1 max-w-4xl mx-8 mt-2 relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && setShowResults(true)}
              placeholder="Search for schools or courses..."
              className="w-full pl-12 pr-12 py-3 rounded-full border-2 border-gray-200 focus:border-yellow-500 focus:outline-none text-gray-700 font-outfit transition-colors"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchQuery.trim().length >= 2 && (
            <div className="absolute w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-[60]">
              {isSearching ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                  <p className="mt-2 font-outfit">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}-${index}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-6 py-4 hover:bg-gray-50 flex items-start gap-4 text-left transition-colors"
                    >
                      {result.type === "school" ? (
                        <>
                          <img
                            src={result.school_logo}
                            alt={result.name}
                            className="w-18 h-18 object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/temporary-school-logo/placeholder.png";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                School
                              </span>
                            </div>
                            <p className="font-semibold text-gray-900 font-outfit truncate">{result.name}</p>
                            {result.location && <p className="text-sm text-gray-500 truncate">{result.location}</p>}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-18 h-18 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">📚</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                Course
                              </span>
                            </div>
                            <p className="font-semibold text-gray-900 font-outfit truncate">
                              {result.program_name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{result.school_name}</p>
                          </div>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <p className="font-outfit">No results found for "{searchQuery}"</p>
                  <p className="text-sm mt-1">Try searching with different keywords</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 pt-1">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          >
            <Home className="w-5 h-5 text-gray-700" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => (
                setNotifDropdownOpen((o) => !o),
                setProfileDropdownOpen(false)
              )}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center relative"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 text-xs bg-red-300 text-red-800 rounded-full px-2 py-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-96 max-h-[420px] bg-white shadow-lg rounded-lg py-2 z-50">
                <div className="flex justify-between px-4 py-2 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-gray-500 hover:underline"
                    >
                      Mark all read
                    </button>
                    <button
                      onClick={clearNotifications}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
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
                          <p className="text-sm">
                            {formatNotificationMessage(n.type)}
                          </p>
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
              onClick={() => (
                setProfileDropdownOpen((o) => !o),
                setNotifDropdownOpen(false)
              )}
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

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}