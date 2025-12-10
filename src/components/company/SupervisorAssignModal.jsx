import React, { useState } from "react";
import { Button } from "../ui/Button";

const SupervisorAssignModal = ({ open, onClose, onSave }) => {
  const [supervisor, setSupervisor] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Assign Industry Supervisor</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Supervisor Name</label>
          <input
            type="text"
            value={supervisor}
            onChange={(e) => setSupervisor(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter supervisor full name"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(supervisor); setSupervisor(""); }}>Save</Button>
        </div>
      </div>
    </div>
  );
};

export default SupervisorAssignModal;

