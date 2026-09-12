
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Mail,
  Phone,
  UserRound,
  Users,
  Pencil,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";

import Sidebar from "@/components/parent/SideBar";
import Navbar from "@/components/parent/NavBar";

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  gender: string;
  classroom: {
    id: string;
    name: string;
  } | null;
};

type Parent = {
  id: string;
  fullName: string;
  gender: string;
  phone: string | null;
  email: string;
  image: string | null;
  children: Child[];
};

export default function ParentProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [parent, setParent] = useState<Parent | null>(null);
  const [loading, setLoading] = useState(true);

  // Image upload
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit profile
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editFullName, setEditFullName] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // --------------------------------------------------
  // LOAD PROFILE
  // --------------------------------------------------
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/parent/profile");

        const text = await response.text();

        let data: any = {};

        if (text.trim()) {
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error("The server returned an invalid response.");
          }
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load profile"
          );
        }

        if (!data.parent) {
          throw new Error("Parent profile was not found.");
        }

        setParent(data.parent);

        setEditFullName(data.parent.fullName || "");
        setEditGender(data.parent.gender || "");
        setEditEmail(data.parent.email || "");
        setEditPhone(data.parent.phone || "");
      } catch (error) {
        console.error("LOAD PROFILE ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // --------------------------------------------------
  // GET INITIALS
  // --------------------------------------------------
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // --------------------------------------------------
  // START EDITING
  // --------------------------------------------------
  const startEditing = () => {
    if (!parent) return;

    setEditFullName(parent.fullName || "");
    setEditGender(parent.gender || "");
    setEditEmail(parent.email || "");
    setEditPhone(parent.phone || "");

    setEditing(true);
  };

  // --------------------------------------------------
  // CANCEL EDITING
  // --------------------------------------------------
  const cancelEditing = () => {
    if (!parent) return;

    setEditFullName(parent.fullName || "");
    setEditGender(parent.gender || "");
    setEditEmail(parent.email || "");
    setEditPhone(parent.phone || "");

    setEditing(false);
  };

  // --------------------------------------------------
  // SAVE PROFILE
  // --------------------------------------------------
  const handleSaveProfile = async () => {
    if (!parent) return;

    // Basic validation
    if (!editFullName.trim()) {
      alert("Full name is required.");
      return;
    }

    if (!editGender) {
      alert("Please select a gender.");
      return;
    }

    if (!editEmail.trim()) {
      alert("Email is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/parent/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: editFullName.trim(),
          gender: editGender,
          email: editEmail.trim(),
          phone: editPhone.trim() || null,
        }),
      });

      // Read text first to prevent:
      // Unexpected end of JSON input
      const text = await response.text();

      let data: any = {};

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          console.error("Invalid server response:", text);

          throw new Error(
            "The server returned an invalid response."
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update profile"
        );
      }

      if (!data.parent) {
        throw new Error(
          "The server did not return the updated profile."
        );
      }

      // Update profile immediately
      setParent(data.parent);

      // Update edit fields
      setEditFullName(data.parent.fullName || "");
      setEditGender(data.parent.gender || "");
      setEditEmail(data.parent.email || "");
      setEditPhone(data.parent.phone || "");

      setEditing(false);

      alert("Profile updated successfully.");
    } catch (error) {
      console.error("SAVE PROFILE ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // PROFILE IMAGE UPLOAD
  // --------------------------------------------------
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Allowed image types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please select a JPG, PNG, or WebP image.");

      event.target.value = "";

      return;
    }

    // Maximum 5 MB
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5 MB.");

      event.target.value = "";

      return;
    }

    const formData = new FormData();

    formData.append("image", file);

    try {
      setUploadingImage(true);

      const response = await fetch(
        "/api/parent/profile/image",
        {
          method: "POST",
          body: formData,
        }
      );

      // Read response as text first
      const text = await response.text();

      let data: any = {};

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          console.error(
            "Invalid image API response:",
            text
          );

          throw new Error(
            "The server returned an invalid response."
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to upload image"
        );
      }

      if (!data.image) {
        throw new Error(
          "The server did not return the uploaded image."
        );
      }

      // Update image immediately
      setParent((current) =>
            current
                ? {
                    ...current,
                    image: data.image,
                }
                : current
            );

            // Update Navbar profile picture immediately
            localStorage.setItem("parentProfileImage", data.image);

            // Tell other components that the profile image changed
            window.dispatchEvent(
            new CustomEvent("parentProfileUpdated", {
                detail: {
                image: data.image,
                },
            })
            );

    } catch (error) {
      console.error(
        "PROFILE IMAGE ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to upload profile picture"
      );
    } finally {
      setUploadingImage(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // PROFILE NOT FOUND
  // --------------------------------------------------
  if (!parent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Unable to load profile.
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-72">
        <Navbar
          title="My Profile"
          subtitle="View and manage your personal information"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="p-5 sm:p-8">
          {/* PROFILE HEADER */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {/* Cover */}
            <div className="h-32 bg-blue-600" />

            <div className="px-6 pb-6">
              <div className="-mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  {/* PROFILE IMAGE */}
                  <div className="relative">
                    {parent.image ? (
                      <img
                        src={parent.image}
                        alt={parent.fullName}
                        className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-md dark:border-gray-900"
                      />
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-3xl font-bold text-blue-700 shadow-md dark:border-gray-900 dark:bg-blue-900/40 dark:text-blue-300">
                        {getInitials(parent.fullName)}
                      </div>
                    )}

                    {/* IMAGE INPUT */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    {/* CAMERA BUTTON */}
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-900"
                      title={
                        uploadingImage
                          ? "Uploading..."
                          : "Change profile picture"
                      }
                      aria-label="Change profile picture"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>

                  {/* NAME */}
                  <div className="pb-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {parent.gender === "Male"
                        ? "Mr"
                        : "Mme"}{" "}
                      {parent.fullName}
                    </h1>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Parent Account
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PERSONAL INFORMATION + CHILDREN */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* PERSONAL INFORMATION */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              {/* HEADER */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/30">
                    <UserRound className="h-5 w-5 text-blue-600" />
                  </div>

                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">
                      Personal Information
                    </h2>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your account information
                    </p>
                  </div>
                </div>

                {/* EDIT BUTTON */}
                {!editing && (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="flex items-center gap-2 rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-900/20"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                )}
              </div>

              {/* VIEW MODE */}
              {!editing ? (
                <div className="space-y-5">
                  {/* FULL NAME */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Full Name
                    </p>

                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                      {parent.fullName}
                    </p>
                  </div>

                  {/* GENDER */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Gender
                    </p>

                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                      {parent.gender || "Not provided"}
                    </p>
                  </div>

                  {/* EMAIL */}
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 text-gray-400" />

                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Email
                      </p>

                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                        {parent.email}
                      </p>
                    </div>
                  </div>

                  {/* PHONE */}
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-5 w-5 text-gray-400" />

                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Phone Number
                      </p>

                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                        {parent.phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* EDIT MODE */
                <div className="space-y-5">
                  {/* FULL NAME */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) =>
                        setEditFullName(e.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                    />
                  </div>

                  {/* GENDER */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Gender
                    </label>

                    <select
                      value={editGender}
                      onChange={(e) =>
                        setEditGender(e.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">
                        Select gender
                      </option>

                      <option value="Male">
                        Male
                      </option>

                      <option value="Female">
                        Female
                      </option>
                    </select>
                  </div>

                  {/* EMAIL */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />

                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) =>
                          setEditEmail(e.target.value)
                        }
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* PHONE */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Phone Number
                    </label>

                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />

                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) =>
                          setEditPhone(e.target.value)
                        }
                        placeholder="Enter phone number"
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
                    {/* CANCEL */}
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>

                    {/* SAVE */}
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />

                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* MY CHILDREN */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-purple-100 p-3 dark:bg-purple-900/30">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    My Children
                  </h2>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Children linked to your account
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {parent.children.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No children linked to this account.
                  </p>
                ) : (
                  parent.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/parent/children/${child.id}`}
                      className="flex items-center justify-between rounded-xl border border-gray-200 p-4 transition hover:border-blue-300 hover:bg-blue-50 dark:border-gray-800 dark:hover:bg-gray-800"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {child.firstName}{" "}
                          {child.lastName}
                        </p>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {child.classroom?.name ||
                            "No class assigned"}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {child.matricule}
                        </p>
                      </div>

                      <span className="text-sm font-medium text-blue-600">
                        View
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
