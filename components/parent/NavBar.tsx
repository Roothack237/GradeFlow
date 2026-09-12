
"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Menu,
  Search,
  UserRound,
} from "lucide-react";
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

export default function Navbar({
  title,
  subtitle,
  onMenuClick,
}: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const [parent, setParent] =
    useState<ParentProfile | null>(null);

  const loadParentProfile = async () => {
    try {
      const response = await fetch(
        "/api/parent/profile",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      if (data.parent) {
        setParent(data.parent);

        // Keep the latest image locally
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
  };

  useEffect(() => {
    // Load parent information
    loadParentProfile();

    // Get locally saved image immediately
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
    const handleProfileUpdate = (
      event: Event
    ) => {
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

      // Reload complete profile information
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
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const parentName =
    parent?.fullName || "Parent";

  const parentTitle =
    parent?.gender === "Male"
      ? "Mr"
      : parent?.gender === "Female"
      ? "Mme"
      : "";

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

          {/* SEARCH */}
          <div className="relative hidden md:block">

            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search..."
              className="w-48 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 lg:w-64 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800"
            />
          </div>

          {/* NOTIFICATIONS */}
          <div className="relative">

            <button
              type="button"
              onClick={() =>
                setShowNotifications(
                  !showNotifications
                )
              }
              className="relative rounded-xl p-2.5 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />

              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-800 dark:bg-gray-900">

                <div className="mb-3 flex items-center justify-between">

                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>

                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    3 new
                  </span>

                </div>

                <div className="space-y-3">

                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Results Published
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Term 1 results are now available.
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Attendance Alert
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Your child has recent absences.
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Parent-Teacher Meeting
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Meeting scheduled for Friday.
                    </p>
                  </div>

                </div>
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
            className="h-9 w-9 rounded-full border-2 border-blue-100 object-cover shadow-sm dark:border-blue-900"
          />
        ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-blue-100 bg-blue-100 text-sm font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-300">
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
