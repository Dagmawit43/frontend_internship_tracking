import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * role:
 * - "student" — can edit student fields + work performed; cannot edit supervisor comment or supervisor name
 * - "company" — can edit supervisor name + supervisor comments; cannot edit student fields or work performed
 * - "viewer" — all fields read-only (advisor / read-only review)
 */
const InternshipLogbookForm = ({
  initialData,
  readOnly = false,
  role = "student",
  onSubmit,
  onValuesChange,
  title = "Internship Student Logbook Form",
  submitLabel = "Submit",
}) => {
  const [formData, setFormData] = useState(() => ({
    studentName: "",
    companyName: "",
    supervisorName: "",
    safetyBrief: "",
    weeks: [],
    ...(initialData || {}),
  }));

  const isViewer = role === "viewer" || role === "advisor";
  const isStudent = role === "student";
  const isCompany = role === "company";

  const studentSectionsLocked = readOnly || isCompany || isViewer;
  const supervisorSectionsLocked = readOnly || isStudent || isViewer;

  const canSubmit = useMemo(
    () => !readOnly && typeof onSubmit === "function" && isStudent,
    [readOnly, onSubmit, isStudent]
  );

  const skipNotifyRef = useRef(true);

  useEffect(() => {
    if (!isCompany || readOnly || typeof onValuesChange !== "function") return;
    if (skipNotifyRef.current) {
      skipNotifyRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      onValuesChange(formData);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [formData, isCompany, readOnly, onValuesChange]);

  const handleChange = (weekIndex, dayIndex, field, value) => {
    if (field === "workPerformed" && studentSectionsLocked) return;
    if (field === "supervisorComment" && supervisorSectionsLocked) return;

    setFormData((prev) => {
      const updatedWeeks = prev.weeks.map((week, wIdx) => {
        if (wIdx !== weekIndex) return week;
        const updatedDays = week.days.map((day, dIdx) =>
          dIdx === dayIndex ? { ...day, [field]: value } : day
        );
        return { ...week, days: updatedDays };
      });
      return { ...prev, weeks: updatedWeeks };
    });
  };

  const handleGeneralChange = (field, value) => {
    if (["studentName", "companyName", "safetyBrief"].includes(field) && studentSectionsLocked) {
      return;
    }
    if (field === "supervisorName" && supervisorSectionsLocked) return;

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canSubmit) onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-4xl mx-auto bg-white border border-gray-200 rounded-xl">
      <h2 className="text-xl font-bold mb-4">{title}</h2>

      <div className="mb-4">
        <label className="block font-semibold">Student&apos;s Name:</label>
        <input
          type="text"
          value={formData.studentName}
          disabled={studentSectionsLocked}
          onChange={(e) => handleGeneralChange("studentName", e.target.value)}
          className="border p-2 w-full rounded-md disabled:bg-gray-100"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Company Name:</label>
        <input
          type="text"
          value={formData.companyName}
          disabled={studentSectionsLocked}
          onChange={(e) => handleGeneralChange("companyName", e.target.value)}
          className="border p-2 w-full rounded-md disabled:bg-gray-100"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Supervisor Name:</label>
        <input
          type="text"
          value={formData.supervisorName}
          disabled={supervisorSectionsLocked}
          onChange={(e) => handleGeneralChange("supervisorName", e.target.value)}
          className="border p-2 w-full rounded-md disabled:bg-gray-100"
        />
      </div>

      <div className="mb-6">
        <label className="block font-semibold">
          Have you been given brief on the company safety guidelines?
        </label>
        <select
          value={formData.safetyBrief}
          disabled={studentSectionsLocked}
          onChange={(e) => handleGeneralChange("safetyBrief", e.target.value)}
          className="border p-2 w-full rounded-md disabled:bg-gray-100"
        >
          <option value="">Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      {formData.weeks.map((week, wIdx) => (
        <div key={`${week.weekNumber || wIdx + 1}-${wIdx}`} className="mb-6 border p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Week {week.weekNumber || wIdx + 1}</h3>
          {week.days.map((day, dIdx) => (
            <div key={dIdx} className="mb-3">
              <p className="font-medium">Day {day.dayNumber || dIdx + 1}</p>
              <input
                type="text"
                placeholder="Work Performed"
                value={day.workPerformed}
                disabled={studentSectionsLocked}
                onChange={(e) => handleChange(wIdx, dIdx, "workPerformed", e.target.value)}
                className="border p-2 w-full mb-1 rounded-md disabled:bg-gray-100"
              />
              <input
                type="text"
                placeholder="Supervisor's Signature / Comment"
                value={day.supervisorComment}
                disabled={supervisorSectionsLocked}
                onChange={(e) => handleChange(wIdx, dIdx, "supervisorComment", e.target.value)}
                className="border p-2 w-full rounded-md disabled:bg-gray-100"
              />
            </div>
          ))}
        </div>
      ))}

      {canSubmit && (
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {submitLabel}
        </button>
      )}
    </form>
  );
};

export default InternshipLogbookForm;
