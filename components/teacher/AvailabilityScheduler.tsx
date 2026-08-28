"use client";

import { useState } from "react";
import AvailabilityModal from "@/components/teacher/AvailabilityModal";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const hours = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

type SlotStatus = "available" | "preferred" | "unavailable";

export default function AvailabilityScheduler() {
  const [slots, setSlots] = useState<Record<string, SlotStatus>>({});
  const [openModal, setOpenModal] = useState(false);

  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedHour, setSelectedHour] = useState("08:00");

  const handleClick = (day: string, hour: string) => {
    setSelectedDay(day);
    setSelectedHour(hour);
    setOpenModal(true);
  };

  const handleSave = (status: SlotStatus) => {
    const key = `${selectedDay}-${selectedHour}`;

    setSlots((previous) => ({
      ...previous,
      [key]: status,
    }));

    setOpenModal(false);
  };

  const getStyle = (status: SlotStatus) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700 hover:bg-green-200";

      case "preferred":
        return "bg-purple-100 text-purple-700 hover:bg-purple-200";

      case "unavailable":
        return "bg-red-100 text-red-700 hover:bg-red-200";
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* Legend */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Available
          </span>

          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
            Preferred
          </span>

          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
            Unavailable
          </span>
        </div>

        {/* Scheduler */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3" />

                {days.map((day) => (
                  <th
                    key={day}
                    className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {hours.map((hour) => (
                <tr key={hour}>
                  <td className="p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {hour}
                  </td>

                  {days.map((day) => {
                    const key = `${day}-${hour}`;

                    const status =
                      slots[key] || "available";

                    return (
                      <td key={key} className="p-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleClick(day, hour)
                          }
                          className={`
                            h-12
                            w-full
                            rounded-xl
                            text-xs
                            font-medium
                            transition-all
                            duration-200
                            hover:scale-105
                            ${getStyle(status)}
                          `}
                        >
                          {status === "available" &&
                            "Available"}

                          {status === "preferred" &&
                            "Preferred"}

                          {status === "unavailable" &&
                            "Unavailable"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Availability Modal */}
      <AvailabilityModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        selectedDay={selectedDay}
        selectedHour={selectedHour}
        onSave={handleSave}
      />
    </>
  );
}