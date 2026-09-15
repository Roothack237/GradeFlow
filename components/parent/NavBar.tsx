"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Menu, UserRound } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type NavbarProps = {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
};

type ParentProfile = {
  fullName: string;
  gender?: string;
  image?: string | null;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} d ago`;

  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default function Navbar({
  title,
  subtitle,
  onMenuClick,
}: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const [parent, setParent] = useState<ParentProfile | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [unread, setUnread] = useState(0);

  const loadParentProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/parent/profile", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();

      if (data.parent) {
        setParent(data.parent);

        // Keep the latest image locally
        if (data.parent.image) {
          localStorage.setItem("parentProfileImage", data.parent.image);
        }
      }
    } catch (error) {
      console.error("Failed to load parent profile:", error);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/parent/notifications", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();

      setNotifications(data.notifications?.slice(0, 5) ?? []);
      setUnread(data.unread ?? 0);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }, []);

  useEffect(() => {
    // Load parent information
    loadParentProfile();

    // Get locally saved image immediately
    const savedImage = localStorage.getItem("parentProfileImage");

    if (savedImage) {
      setParent((current) =>
        current
          ? { ...current, image: savedImage }
          : { fullName: "Parent", image: savedImage }
      );
    }

    // Listen for profile updates
    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{
        image?: string;
        fullName?: string;
        gender?: string;
      }>;

      const updatedImage = customEvent.detail?.image;

      if (updatedImage) {
        setParent((current) =>
          current
            ? { ...current, image: updatedImage }
            : { fullName: "Parent", image: updatedImage }
        );
      }

      // Reload complete profile information
      loadParentProfile();
    };

    window.addEventListener("parentProfileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("parentProfileUpdated", handleProfileUpdate);
    };
  }, [loadParentProfile]);

  /* Near-real-time notifications. */
  useEffect(() => {
    loadNotifications();

    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <div className="flex h-20 items-center justify-between gap-4 px-5 sm:px-8">
        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 lg:hidden dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
              {title}
            </h1>

            {subtitle && (
              <p className="hidden truncate text-sm text-gray-500 sm:block dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* NOTIFICATIONS */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-xl p-2.5 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />

              {unread > 0 && (
                <span className="absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-700 px-1 text-[9px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>

                  {unread > 0 && (
                    <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                      {unread} new
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <p className="rounded-xl bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      No notification yet. Alerts about your children appear here.
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <Link
                        key={notification.id}
                        href="/parent/notifications"
                        onClick={() => setShowNotifications(false)}
                        className={`block rounded-xl p-3 transition hover:bg-purple-50 dark:hover:bg-purple-950/20 ${
                          notification.read
                            ? "bg-gray-50 dark:bg-gray-800"
                            : "bg-purple-50 dark:bg-purple-950/30"
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                          {notification.message}
                        </p>

                        <p className="mt-1 text-[10px] text-gray-400">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </Link>
                    ))
                  )}
                </div>

                <Link
                  href="/parent/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="mt-3 block rounded-xl bg-purple-700 py-2 text-center text-xs font-semibold text-white transition hover:bg-purple-800"
                >
                  See all notifications
                </Link>
              </div>
            )}
          </div>

          {/* DIVIDER */}
          <div className="hidden h-8 w-px bg-gray-200 dark:bg-gray-700 sm:block" />

          {/* PROFILE */}
          <Link
            href="/parent/profile"
            title="View Profile"
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {/* PROFILE IMAGE */}
            {parent?.image ? (
              <Image
                src={parent.image}
                alt={parent.fullName}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full border-2 border-purple-100 object-cover shadow-sm dark:border-purple-900"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-purple-100 bg-purple-100 text-sm font-semibold text-purple-700 dark:border-purple-900 dark:bg-purple-900/30 dark:text-purple-300">
                {getInitials(parent?.fullName || "Parent")}
              </div>
            )}

            {/* PARENT NAME */}
            <div className="hidden text-left lg:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {parent?.gender === "Male"
                  ? "Mr"
                  : parent?.gender === "Female"
                    ? "Mme"
                    : ""}{" "}
                {parent?.fullName || "Parent"}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Account
              </p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
