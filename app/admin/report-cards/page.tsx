"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";

type Classroom = {
  id: string;
  name: string;
};

type Term = {
  id: string;
  name: string;
};

export default function ReportCardsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);

  const [classroomId, setClassroomId] = useState("");
  const [termId, setTermId] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [classRes, termRes] = await Promise.all([
        fetch("/api/admin/classrooms"),
        fetch("/api/admin/terms"),
      ]);

      const classData = await classRes.json();
      const termData = await termRes.json();

      setClassrooms(classData.classrooms || []);
      setTerms(termData.terms || []);

      if (classData.classrooms?.length > 0) {
        setClassroomId(classData.classrooms[0].id);
      }

      if (termData.terms?.length > 0) {
        setTermId(termData.terms[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function generateReportCards() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        "/api/admin/report-cards/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classroomId,
            termId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to generate report cards"
        );
      }

      setMessage(
        "Report cards generated successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to generate report cards."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-purple-100 p-3 text-purple-700">
            <FileText size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Report Cards
            </h1>

            <p className="text-sm text-gray-500">
              Generate and manage student report cards.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Classroom
              </label>

              <select
                value={classroomId}
                onChange={(e) =>
                  setClassroomId(e.target.value)
                }
                className="w-full rounded-xl border p-3"
              >
                {classrooms.map((classroom) => (
                  <option
                    key={classroom.id}
                    value={classroom.id}
                  >
                    {classroom.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Term
              </label>

              <select
                value={termId}
                onChange={(e) =>
                  setTermId(e.target.value)
                }
                className="w-full rounded-xl border p-3"
              >
                {terms.map((term) => (
                  <option
                    key={term.id}
                    value={term.id}
                  >
                    {term.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={generateReportCards}
            disabled={
              loading ||
              !classroomId ||
              !termId
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-700 px-6 py-3 font-semibold text-white"
          >
            {loading ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <FileText size={18} />
            )}

            {loading
              ? "Generating..."
              : "Generate Report Cards"}
          </button>

          {message && (
            <div className="mt-4 rounded-xl bg-gray-100 p-4 text-sm">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}