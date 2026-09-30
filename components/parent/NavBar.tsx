"use client";

import { useCallback, useEffect, useState } from "react";

import { Bell, Menu } from "lucide-react";

import Link from "next/link";

import Image from "next/image";

// =========================================================
// TYPES
// =========================================================

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

// =========================================================
// COMPONENT
// =========================================================

export default function Navbar({
title,
subtitle,
onMenuClick,
}: NavbarProps) {
const [parent, setParent] = useState<ParentProfile | null>(null);
const [unread, setUnread] = useState(0);

// =======================================================
// LOAD PARENT PROFILE
// =======================================================

const loadParentProfile = useCallback(async () => {
try {
const response = await fetch("/api/parent/profile", {
cache: "no-store",
});


  if (!response.ok) return;

  const data = await response.json();

  if (data.parent) {
    setParent(data.parent);

    if (data.parent.image) {
      localStorage.setItem(
        "parentProfileImage",
        data.parent.image
      );
    }
  }
} catch (error) {
  console.error(
    "Failed to load parent profile:",
    error
  );
}


}, []);

// =======================================================
// LOAD NOTIFICATION COUNT
// =======================================================

const loadNotifications = useCallback(async () => {
try {
const response = await fetch(
"/api/parent/notifications",
{
cache: "no-store",
}
);


  if (!response.ok) return;

  const data = await response.json();

  setUnread(Number(data.unread ?? 0));
} catch (error) {
  console.error(
    "Failed to load notifications:",
    error
  );
}


}, []);

// =======================================================
// LOAD PROFILE
// =======================================================

useEffect(() => {
loadParentProfile();


const savedImage = localStorage.getItem(
  "parentProfileImage"
);

if (savedImage) {
  setParent((current) =>
    current
      ? {
          ...current,
          image: savedImage,
        }
      : {
          fullName: "Parent",
          image: savedImage,
        }
  );
}

// Listen for profile updates
const handleProfileUpdate = (event: Event) => {
  const customEvent =
    event as CustomEvent<{
      image?: string;
      fullName?: string;
      gender?: string;
    }>;

  const updatedImage =
    customEvent.detail?.image;

  if (updatedImage) {
    setParent((current) =>
      current
        ? {
            ...current,
            image: updatedImage,
          }
        : {
            fullName: "Parent",
            image: updatedImage,
          }
    );
  }

  loadParentProfile();
};

window.addEventListener(
  "parentProfileUpdated",
  handleProfileUpdate
);

return () => {
  window.removeEventListener(
    "parentProfileUpdated",
    handleProfileUpdate
  );
};


}, [loadParentProfile]);

// =======================================================
// LOAD NOTIFICATIONS
// =======================================================

useEffect(() => {
loadNotifications();

const interval = setInterval(
  loadNotifications,
  30000
);

return () => clearInterval(interval);

}, [loadNotifications]);

// =======================================================
// GET INITIALS
// =======================================================

const getInitials = (name: string) => {
return name
.split(" ")
.filter(Boolean)
.map((part) => part[0])
.join("")
.substring(0, 2)
.toUpperCase();
};

// =======================================================
// RENDER
// =======================================================

return ( <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95"> <div className="flex h-20 items-center justify-between gap-4 px-5 sm:px-8">


    {/* =================================================
        LEFT
    ================================================= */}

    <div className="flex min-w-0 items-center gap-4">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
          {title}
        </h1>

        {subtitle && (
          <p className="hidden truncate text-sm text-gray-500 dark:text-gray-400 sm:block">
            {subtitle}
          </p>
        )}
      </div>
    </div>

    {/* =================================================
        RIGHT
    ================================================= */}

    <div className="flex items-center gap-2 sm:gap-4">

      {/* =================================================
          NOTIFICATION BELL
      ================================================= */}

      <Link
        href="/parent/notifications"
        title="Notifications"
        aria-label="Open notifications"
        className="relative rounded-xl p-2.5 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <Bell className="h-5 w-5" />

        {/* UNREAD BADGE */}
        {unread > 0 && (
          <span className="absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-700 px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
      <Link
        href="/parent/notifications"
        title="Notifications"
        aria-label="Open notifications"
        className="relative rounded-xl p-2.5 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <Bell className="h-5 w-5" />

        {/* UNREAD BADGE */}
        {unread > 0 && (
          <span className="absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-700 px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>

      {/* =================================================
          DIVIDER
      ================================================= */}

      <div className="hidden h-8 w-px bg-gray-200 dark:bg-gray-700 sm:block" />

      {/* =================================================
          PROFILE
      ================================================= */}

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
            {getInitials(
              parent?.fullName || "Parent"
            )}
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
