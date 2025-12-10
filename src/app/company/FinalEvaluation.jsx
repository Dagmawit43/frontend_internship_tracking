import React, { useState } from "react";
import finalData from "../../mock/finalCompanyEvaluations.json";
import { Button } from "../../components/ui/Button";

const FinalEvaluation = () => {
  const [evaluations, setEvaluations] = useState(finalData);
  const [locked, setLocked] = useState(false);
  const [form, setForm] = useState({
    student_name: "",
    technical: "",
    communication: "",
    professionalism: "",
    recommendation: false,
    letter: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const score =
      Number(form.technical || 0) +
      Number(form.communication || 0) +
      Number(form.professionalism || 0);
    const record = {
      id: `fe-${Date.now()}`,
      student_name: form.student_name,
      score,
      recommendation: form.recommendation,
      locked: true,
    };
    setEvaluations((prev) => [record, ...prev]);
    setLocked(true);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((p) => ({ ...p, letter: file.name }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Final Evaluation (40%)</h1>
        <p className="text-sm text-gray-600">Submit the final company evaluation. Form locks after submit.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Student Name</label>
            <input
              disabled={locked}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.student_name}
              onChange={(e) => setForm((p) => ({ ...p, student_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Recommendation Letter (optional)</label>
            <input
              type="file"
              disabled={locked}
              onChange={handleFile}
              className="w-full"
            />
            {form.letter && <p className="text-xs text-gray-500">Uploaded: {form.letter}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["technical", "communication", "professionalism"].map((field) => (
            <div key={field} className="space-y-2">
              <label className="text-sm font-medium text-gray-700 capitalize">{field}</label>
              <input
                type="number"
                min={0}
                max={40}
                disabled={locked}
                value={form[field]}
                onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            disabled={locked}
            checked={form.recommendation}
            onChange={(e) => setForm((p) => ({ ...p, recommendation: e.target.checked }))}
          />
          <span className="text-sm text-gray-700">Recommend this student</span>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={locked}>
            {locked ? "Form Locked" : "Submit Final Evaluation"}
          </Button>
        </div>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Recent Final Evaluations</h3>
        <div className="divide-y divide-gray-200">
          {evaluations.length === 0 ? (
            <p className="text-sm text-gray-600 py-4">No final evaluations yet.</p>
          ) : (
            evaluations.map((ev) => (
              <div key={ev.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{ev.student_name}</p>
                  <p className="text-xs text-gray-500">Score: {ev.score}</p>
                </div>
                <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                  {ev.recommendation ? "Recommended" : "Not Recommended"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FinalEvaluation;

