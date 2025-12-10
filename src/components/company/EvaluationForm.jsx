import React, { useMemo } from "react";
import { Button } from "../ui/Button";

const EvaluationForm = ({ title, fields, values, onChange, onSubmit, submitLabel = "Submit" }) => {
  const total = useMemo(() => {
    const scores = Object.values(values || {}).map((v) => Number(v) || 0);
    return scores.reduce((sum, v) => sum + v, 0);
  }, [values]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">Adjust ratings; score is calculated locally.</p>
      </div>
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-800">{field.label}</label>
              <span className="text-sm text-gray-600">{values[field.name] ?? 0}/5</span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={values[field.name] ?? 0}
              onChange={(e) => onChange(field.name, Number(e.target.value))}
              className="w-full"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-gray-700">
          Monthly Score: <span className="font-semibold text-gray-900">{total}</span>
        </div>
        <Button onClick={onSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
};

export default EvaluationForm;


