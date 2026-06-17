"use client";

import React, { useState, useMemo } from "react";
import Papa from "papaparse";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Trash2, Download, ShieldCheck, Copy, Edit3 } from "lucide-react";
import { toast } from "react-hot-toast";

// --- TYPES ---
interface CSVRow {
  name?: string;
  email?: string;
  syllabus_id?: string;
  issue_date?: string;
}

interface ValidationRow {
  name: string;
  email: string;
  syllabus_id: string;
  issue_date: string;
  isValid: boolean;
  errors: string[];
}

// --- UTILITIES ---
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isPositiveInteger(value: string): boolean {
  return /^\d+$/.test(value.trim()) && Number(value.trim()) > 0;
}
function isValidDate(value: string): boolean {
  if (!value.trim()) return false;
  return !Number.isNaN(new Date(value).getTime());
}

function normalizeRow(row: CSVRow): ValidationRow {
  const normalized: ValidationRow = {
    name: (row.name ?? "").trim(),
    email: (row.email ?? "").trim(),
    syllabus_id: (row.syllabus_id ?? "").trim(),
    issue_date: (row.issue_date ?? "").trim(),
    isValid: true,
    errors: [],
  };

  if (!normalized.name) normalized.errors.push("Missing Name");
  if (!normalized.email || !isValidEmail(normalized.email)) normalized.errors.push("Invalid Email");
  if (!normalized.syllabus_id) normalized.errors.push("Missing Syllabus ID");
  else if (!isPositiveInteger(normalized.syllabus_id)) normalized.errors.push("Syllabus ID must be a number");
  if (!normalized.issue_date) normalized.errors.push("Missing Issue Date");
  else if (!isValidDate(normalized.issue_date)) normalized.errors.push("Invalid Date format");

  normalized.isValid = normalized.errors.length === 0;
  return normalized;
}

export default function BulkUploadView() {
  const [rows, setRows] = useState<ValidationRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const validRows = useMemo(() => rows.filter(r => r.isValid), [rows]);
  const invalidRows = useMemo(() => rows.filter(r => !r.isValid), [rows]);

  const processCsvData = (data: CSVRow[], name: string) => {
    setFileName(name);
    const parsedRows = data.map(normalizeRow);
    setRows(parsedRows);
    if (!parsedRows.length) toast.error("No valid data found to process.");
    else toast.success(`Engine processed ${parsedRows.length} rows.`);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse<CSVRow>(file, {
      header: true, skipEmptyLines: true, transformHeader: h => h.trim().toLowerCase(),
      complete: (results) => processCsvData(results.data || [], file.name),
      error: (error: Error) => { toast.error("CSV engine failure."); console.error(error); }
    });
    event.target.value = "";
  };

  const handleTextSubmit = () => {
    if (!csvText.trim()) return;
    Papa.parse<CSVRow>(csvText, {
      header: true, skipEmptyLines: true, transformHeader: h => h.trim().toLowerCase(),
      complete: (results) => processCsvData(results.data || [], "Copied Memory Segment"),
      error: (error: Error) => { toast.error("Text parse failure."); console.error(error); }
    });
  };

  const handleCellChange = (index: number, field: keyof CSVRow, value: string) => {
    setRows((prev) => {
      const newRows = [...prev];
      const currentRow = newRows[index];
      const updatedRawRow: CSVRow = {
        name: field === "name" ? value : currentRow.name,
        email: field === "email" ? value : currentRow.email,
        syllabus_id: field === "syllabus_id" ? value : currentRow.syllabus_id,
        issue_date: field === "issue_date" ? value : currentRow.issue_date,
      };
      newRows[index] = normalizeRow(updatedRawRow);
      return newRows;
    });
  };

  const downloadErrors = () => {
    if (!invalidRows.length) return;
    const csv = Papa.unparse(invalidRows.map(r => ({ ...r, Errors: r.errors.join(" | ") })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "validation_failures.csv"; link.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!validRows.length) { toast.error("No valid entries ready for issuance."); return; }
    setIsUploading(true);

    try {
      const payload = {
        students: validRows.map((row) => ({
          name: row.name, email: row.email, syllabus_id: Number(row.syllabus_id), issue_date: row.issue_date,
        })),
      };

      // Calls the external backend generation script as originally constructed
      const response = await fetch("/api/certificate", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });

      const text = await response.text();
      const result = JSON.parse(text);

      if (!response.ok) throw new Error(result.error || "Fatal Server Rejection");

      toast.success(`Success! Handled ${result.count || validRows.length} issuances.`);
      setRows([]); setFileName(null); setCsvText("");
    } catch (error: any) {
      toast.error(error.message || "A network anomaly occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* INGESTION PANEL */}
      <div className="lg:col-span-2 space-y-6">
        <label className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-[30px] border-2 border-dashed border-indigo-200 bg-white transition hover:bg-indigo-50 group shadow-sm">
          <UploadCloud size={40} className="text-indigo-400 group-hover:text-indigo-600 transition-colors mb-3 group-hover:-translate-y-2 transform" />
          <p className="text-sm font-bold text-slate-700">Drop Local CSV Data</p>
          <p className="text-xs font-medium text-slate-400 mt-1">Requires headers: name, email, syllabus_id, issue_date</p>
          {fileName && <div className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-100 text-indigo-700 px-4 py-2 text-xs font-black"><FileText size={14} /> {fileName}</div>}
          <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={isUploading} />
        </label>

        <div className="flex items-center gap-4 px-4">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Or Use Data Bridge</span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste from Bookings 'Copy CSV' here..."
            className="w-full h-40 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm font-mono outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            disabled={isUploading}
          />
          <button
            onClick={handleTextSubmit}
            disabled={isUploading || !csvText.trim()}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            Process Pasted Memory
          </button>
        </div>
      </div>

      {/* COMMAND CENTER SUMMARY */}
      <div className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm h-fit">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-xl text-slate-900">Engine Status</h3>
          {rows.length > 0 && <ShieldCheck size={20} className="text-emerald-500" />}
        </div>

        <div className="space-y-4 text-sm font-bold border-b border-slate-100 pb-6 mb-6">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg"><span className="text-slate-500">Ingested Rows</span><b className="text-slate-900 text-lg">{rows.length}</b></div>
          <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-lg"><span className="text-emerald-600">Validation Passed</span><b className="text-emerald-700 text-lg">{validRows.length}</b></div>
          <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg"><span className="text-red-600">Critical Failures</span><b className="text-red-700 text-lg">{invalidRows.length}</b></div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isUploading || validRows.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-white font-black shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition hover:bg-indigo-700"
        >
          {isUploading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
          {isUploading ? "Executing Issuance..." : `Deploy ${validRows.length} Certificates`}
        </button>

        <button
          onClick={() => { setRows([]); setFileName(null); setCsvText(""); }}
          disabled={isUploading || (!rows.length && !csvText && !fileName)}
          className="mt-3 w-full rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Flush Data Memory
        </button>
      </div>

      {/* LIVE VALIDATION TABLE */}
      {rows.length > 0 && (
        <div className="lg:col-span-3 rounded-[30px] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <h3 className="font-black text-slate-900">Validation Matrix</h3>
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 px-3 py-1 rounded-lg flex items-center gap-1"><Edit3 size={12} /> Live Editor Active</span>
            </div>
            {invalidRows.length > 0 && (
              <button onClick={downloadErrors} className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition">
                <Download size={14} /> Export Failures
              </button>
            )}
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-white sticky top-0 shadow-sm z-10 text-[10px] uppercase font-black text-slate-400">
                <tr>
                  <th className="p-4 w-12 text-center">OK</th>
                  <th className="p-4 w-1/4">Name</th>
                  <th className="p-4 w-1/4">Email</th>
                  <th className="p-4">Syllabus ID</th>
                  <th className="p-4">Issue Date</th>
                  <th className="p-4">Diagnostics</th>
                  <th className="p-4 text-center">Drop</th>
                </tr>
              </thead>
              <tbody className="font-medium text-slate-700">
                {rows.map((row, index) => (
                  <tr key={index} className="border-t border-slate-100 hover:bg-slate-50/50 group">
                    <td className="p-4 text-center">{row.isValid ? <CheckCircle2 className="text-emerald-500 mx-auto" size={16} /> : <AlertCircle className="text-red-500 mx-auto" size={16} />}</td>
                    <td className="p-4">
                      <input type="text" value={row.name} onChange={(e) => handleCellChange(index, "name", e.target.value)}
                        className={`w-full bg-transparent border-b-2 outline-none py-1 transition-colors ${row.errors.some(e => e.includes("Name")) ? "border-red-300 text-red-600 focus:border-red-500" : "border-transparent focus:border-indigo-400 hover:border-slate-300"}`} 
                      />
                    </td>
                    <td className="p-4">
                      <input type="email" value={row.email} onChange={(e) => handleCellChange(index, "email", e.target.value)}
                        className={`w-full bg-transparent border-b-2 outline-none py-1 transition-colors ${row.errors.some(e => e.includes("Email")) ? "border-red-300 text-red-600 focus:border-red-500" : "border-transparent focus:border-indigo-400 hover:border-slate-300"}`} 
                      />
                    </td>
                    <td className="p-4">
                      <input type="text" value={row.syllabus_id} onChange={(e) => handleCellChange(index, "syllabus_id", e.target.value)}
                        className={`w-20 bg-transparent border-b-2 outline-none py-1 transition-colors ${row.errors.some(e => e.includes("Syllabus")) ? "border-red-300 text-red-600 focus:border-red-500" : "border-transparent focus:border-indigo-400 hover:border-slate-300"}`} 
                      />
                    </td>
                    <td className="p-4">
                      <input type="text" value={row.issue_date} onChange={(e) => handleCellChange(index, "issue_date", e.target.value)}
                        className={`w-28 bg-transparent border-b-2 outline-none py-1 transition-colors ${row.errors.some(e => e.includes("Date")) ? "border-red-300 text-red-600 focus:border-red-500" : "border-transparent focus:border-indigo-400 hover:border-slate-300"}`} 
                      />
                    </td>
                    <td className="p-4 text-xs font-bold text-red-500 max-w-[200px] truncate" title={row.errors.join(", ")}>
                      {row.errors.length ? row.errors.join(", ") : "-"}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => setRows(prev => prev.filter((_, i) => i !== index))} className="text-slate-300 hover:text-red-500 transition-colors p-2 bg-white rounded-lg border border-transparent hover:border-red-100 hover:bg-red-50 shadow-sm"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}