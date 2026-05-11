import React, { useMemo, useState } from "react";
import { Download, Printer, Save } from "lucide-react";

export const ACCEPTANCE_FORM_DEFAULTS = {
  internName: "",
  idNo: "",
  college: "",
  department: "",
  mobile: "",
  startDate: "",
  endDate: "",
  workingDays: "",
  workingHours: "",
  orgName: "",
  mailingAddress: "",
  physicalAddress: "",
  phone: "",
  supervisorName: "",
  supervisorPhone: "",
  supervisorEmail: "",
  accepted: false,
  rejected: false,
  reason: "",
  date: "",
};

const fieldLabelMap = {
  internName: "Intern Name",
  idNo: "ID Number",
  college: "College",
  department: "Department",
  mobile: "Mobile",
  startDate: "Start Date",
  endDate: "End Date",
  workingDays: "Working Days/Week",
  workingHours: "Working Hours/Day",
  orgName: "Organization Name",
  mailingAddress: "Mailing Address",
  physicalAddress: "Physical Address",
  phone: "Phone",
  supervisorName: "Supervisor Name & Designation",
  supervisorPhone: "Supervisor Phone",
  supervisorEmail: "Supervisor Email",
  accepted: "Accepted",
  rejected: "Rejected",
  reason: "Rejection Reason",
  date: "Decision Date",
};

const printableClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 disabled:bg-gray-100";

const InternshipAcceptanceForm = ({
  initialData,
  onSubmit,
  readOnly = false,
  showActions = true,
  title = "INTERNSHIP HOSTING COMPANY ACCEPTANCE FORM",
}) => {
  const [formData, setFormData] = useState({
    ...ACCEPTANCE_FORM_DEFAULTS,
    ...(initialData || {}),
  });

  const normalized = useMemo(() => {
    const accepted = !!formData.accepted;
    const rejected = !!formData.rejected;
    return {
      ...formData,
      accepted,
      rejected,
      decision:
        accepted && !rejected ? "Accepted" : rejected && !accepted ? "Rejected" : "Pending",
    };
  }, [formData]);

  const update = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDecisionChange = (decision) => {
    if (readOnly) return;
    if (decision === "accepted") {
      setFormData((prev) => ({ ...prev, accepted: true, rejected: false, reason: "" }));
      return;
    }
    if (decision === "rejected") {
      setFormData((prev) => ({ ...prev, accepted: false, rejected: true }));
      return;
    }
    setFormData((prev) => ({ ...prev, accepted: false, rejected: false }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!normalized.internName || !normalized.orgName) {
      window.alert("Please fill Intern Name and Organization Name.");
      return;
    }
    if (normalized.rejected && !normalized.reason.trim()) {
      window.alert("Please provide rejection reason.");
      return;
    }
    if (onSubmit) {
      onSubmit(normalized);
    }
  };

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const rows = Object.entries(fieldLabelMap)
      .map(([key, label]) => `${label}: ${String(normalized[key] ?? "")}`)
      .join("\n");
    const content = `AASTU Internship Hosting Company Acceptance Form\n\n${rows}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `acceptance-form-${normalized.idNo || "student"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-6 print:p-0 print:border-0">
        <div className="border border-gray-300 rounded-lg p-4 sm:p-6 space-y-5 print:border-0">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4 pb-4 border-b border-gray-300">
            <div className="text-sm leading-relaxed">
              <p className="font-bold">Organization Name:</p>
              <p>አዲስ አበባ ሳይንስና ቴክኖሎጂ ዩኒቨርሲቲ</p>
              <p>ADDIS ABABA SCIENCE AND TECHNOLOGY UNIVERSITY</p>
            </div>
            <div className="text-sm sm:text-right text-gray-700">
              <p>Document No.: VPAA/DPT/OF/001</p>
              <p>Issue No.: 1</p>
              <p>Page No.: Page 1 of 1</p>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-lg sm:text-xl font-extrabold tracking-wide">{title}</h3>
            <p className="text-xs font-semibold text-gray-600">
              PLEASE MAKE SURE THAT THIS IS THE CORRECT ISSUE BEFORE USE
            </p>
          </div>

          <section className="border border-gray-300 rounded-lg p-4">
            <h4 className="font-bold mb-4">1. STUDENT DETAILS</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm">Intern&apos;s Name
                <input className={printableClass} value={normalized.internName} disabled={readOnly} onChange={(e) => update("internName", e.target.value)} />
              </label>
              <label className="text-sm">ID No.
                <input className={printableClass} value={normalized.idNo} disabled={readOnly} onChange={(e) => update("idNo", e.target.value)} />
              </label>
              <label className="text-sm">College
                <input className={printableClass} value={normalized.college} disabled={readOnly} onChange={(e) => update("college", e.target.value)} />
              </label>
              <label className="text-sm">Department
                <input className={printableClass} value={normalized.department} disabled={readOnly} onChange={(e) => update("department", e.target.value)} />
              </label>
              <label className="text-sm md:col-span-2">Mobile Number
                <input className={printableClass} value={normalized.mobile} disabled={readOnly} onChange={(e) => update("mobile", e.target.value)} />
              </label>
              <label className="text-sm">Start Date
                <input type="date" className={printableClass} value={normalized.startDate} disabled={readOnly} onChange={(e) => update("startDate", e.target.value)} />
              </label>
              <label className="text-sm">End Date
                <input type="date" className={printableClass} value={normalized.endDate} disabled={readOnly} onChange={(e) => update("endDate", e.target.value)} />
              </label>
              <label className="text-sm">Working Days per Week
                <input className={printableClass} value={normalized.workingDays} disabled={readOnly} onChange={(e) => update("workingDays", e.target.value)} />
              </label>
              <label className="text-sm">Working Hours per Day
                <input className={printableClass} value={normalized.workingHours} disabled={readOnly} onChange={(e) => update("workingHours", e.target.value)} />
              </label>
            </div>
          </section>

          <section className="border border-gray-300 rounded-lg p-4">
            <h4 className="font-bold mb-4">2. COMPANY DETAILS</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm md:col-span-2">Organization&apos;s Name
                <input className={printableClass} value={normalized.orgName} disabled={readOnly} onChange={(e) => update("orgName", e.target.value)} />
              </label>
              <label className="text-sm">Mailing Address
                <input className={printableClass} value={normalized.mailingAddress} disabled={readOnly} onChange={(e) => update("mailingAddress", e.target.value)} />
              </label>
              <label className="text-sm">Physical Address
                <input className={printableClass} value={normalized.physicalAddress} disabled={readOnly} onChange={(e) => update("physicalAddress", e.target.value)} />
              </label>
              <label className="text-sm md:col-span-2">Phone Number
                <input className={printableClass} value={normalized.phone} disabled={readOnly} onChange={(e) => update("phone", e.target.value)} />
              </label>
              <label className="text-sm md:col-span-2">Company Supervisor&apos;s Name & Designation
                <input className={printableClass} value={normalized.supervisorName} disabled={readOnly} onChange={(e) => update("supervisorName", e.target.value)} />
              </label>
              <label className="text-sm">Company Supervisor&apos;s Telephone Number(s)
                <input className={printableClass} value={normalized.supervisorPhone} disabled={readOnly} onChange={(e) => update("supervisorPhone", e.target.value)} />
              </label>
              <label className="text-sm">Company Supervisor&apos;s Email Address
                <input className={printableClass} value={normalized.supervisorEmail} disabled={readOnly} onChange={(e) => update("supervisorEmail", e.target.value)} />
              </label>
            </div>
          </section>

          <section className="border border-gray-300 rounded-lg p-4">
            <h4 className="font-bold mb-4">3. ACCEPTANCE STATUS</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={normalized.accepted} disabled={readOnly} onChange={() => handleDecisionChange("accepted")} />
                  Accepted
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={normalized.rejected} disabled={readOnly} onChange={() => handleDecisionChange("rejected")} />
                  Rejected
                </label>
              </div>
              <label className="text-sm">Date
                <input type="date" className={printableClass} value={normalized.date} disabled={readOnly} onChange={(e) => update("date", e.target.value)} />
              </label>
              <label className="text-sm md:col-span-2">Reason if rejected
                <textarea className={`${printableClass} min-h-20`} value={normalized.reason} disabled={readOnly} onChange={(e) => update("reason", e.target.value)} />
              </label>
            </div>
          </section>

          <section className="border border-gray-300 rounded-lg p-4">
            <h4 className="font-bold mb-4">4. SIGNATURES</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-700 mb-6">Company Representative Signature</p>
                <div className="border-b border-gray-500 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-700 mb-6">University Coordinator Signature</p>
                <div className="border-b border-gray-500 h-6" />
              </div>
            </div>
          </section>
        </div>
      </div>

      {showActions && (
        <div className="flex flex-wrap justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm font-semibold"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm font-semibold"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          {!readOnly && (
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold"
            >
              <Save className="w-4 h-4" />
              Save Form
            </button>
          )}
        </div>
      )}
    </form>
  );
};

export default InternshipAcceptanceForm;
