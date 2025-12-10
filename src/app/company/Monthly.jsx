import React, { useState } from "react";
import monthlyData from "../../mock/monthlyEvaluations.json";
import EvaluationForm from "../../components/company/EvaluationForm";

const fields = [
  { name: "technical", label: "Technical Skills" },
  { name: "communication", label: "Communication" },
  { name: "professionalism", label: "Professionalism" },
  { name: "timeliness", label: "Timeliness" },
];

const Monthly = () => {
  const [evaluations, setEvaluations] = useState(monthlyData);
  const [form, setForm] = useState({
    student_name: "",
    month: "February",
    technical: 3,
    communication: 3,
    professionalism: 3,
    timeliness: 3,
  });

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const total = Object.values(form)
      .filter((v) => typeof v === "number")
      .reduce((sum, v) => sum + v, 0);

    const record = { id: `me-${Date.now()}`, ...form, total };
    setEvaluations((prev) => [record, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monthly Evaluations</h1>
        <p className="text-sm text-gray-600">Capture monthly evaluation scores.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Student Name</label>
            <input
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.student_name}
              onChange={(e) => setForm((p) => ({ ...p, student_name: e.target.value }))}
              placeholder="Enter student name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Month</label>
            <input
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.month}
              onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))}
            />
          </div>
        </div>
        <EvaluationForm
          title="Monthly Rating"
          fields={fields}
          values={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          submitLabel="Save Evaluation"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Recent Monthly Evaluations</h3>
        <div className="divide-y divide-gray-200">
          {evaluations.length === 0 ? (
            <p className="text-sm text-gray-600 py-4">No evaluations yet.</p>
          ) : (
            evaluations.map((ev) => (
              <div key={ev.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{ev.student_name}</p>
                  <p className="text-xs text-gray-500">Month: {ev.month}</p>
                </div>
                <p className="text-sm font-semibold text-gray-800">Total: {ev.total}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Monthly;

