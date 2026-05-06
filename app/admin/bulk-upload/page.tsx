"use client";

import React, { useMemo, useState } from "react";
import Papa from "papaparse";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Download,
  ShieldCheck,
  Eye,
  Copy,
  Edit3
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

// ---------- TYPES ----------
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

interface CreatedCertificate {
  id: number;
  name: string | null;
  email: string | null;
  syllabus_id: number | null;
  syllabus_name: string | null;
  syllabus_pdf: string | null;
  issue_date: string | null;
  certificate_code: string | null;
  status: string | null;
  preview_url: string;
}

interface UploadResponse {
  success: boolean;
  count: number;
  certificates: CreatedCertificate[];
  error?: string;
}

// ---------- HELPERS ----------
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isPositiveInteger(value: string): boolean {
  return /^\d+$/.test(value.trim()) && Number(value.trim()) > 0;
}

function isValidDate(value: string): boolean {
  if (!value.trim()) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
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

  if (!normalized.name) {
    normalized.errors.push("Name is required");
  }

  if (!normalized.email || !isValidEmail(normalized.email)) {
    normalized.errors.push("Valid email is required");
  }

  if (!normalized.syllabus_id) {
    normalized.errors.push("Syllabus ID is required");
  } else if (!isPositiveInteger(normalized.syllabus_id)) {
    normalized.errors.push("Syllabus ID must be a positive integer");
  }

  if (!normalized.issue_date) {
    normalized.errors.push("Issue date is required");
  } else if (!isValidDate(normalized.issue_date)) {
    normalized.errors.push("Issue date is invalid");
  }

  normalized.isValid = normalized.errors.length === 0;
  return normalized;
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

// ---------- COMPONENT ----------
export default function BulkUploadPage() {
  const [rows, setRows] = useState<ValidationRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [createdCertificates, setCreatedCertificates] = useState<
    CreatedCertificate[]
  >([]);

  const validRows = useMemo(() => rows.filter((row) => row.isValid), [rows]);
  const invalidRows = useMemo(() => rows.filter((row) => !row.isValid), [rows]);

  const processCsvData = (data: CSVRow[], name: string) => {
    setFileName(name);
    setCreatedCertificates([]);

    const parsedRows = data.map(normalizeRow);
    setRows(parsedRows);

    if (!parsedRows.length) {
      toast.error("No rows found in CSV");
      return;
    }

    toast.success(`${parsedRows.length} row(s) loaded`);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        processCsvData(results.data || [], file.name);
      },
      // FIX APPLIED HERE: Added Error type to the parameter
      error: (error: Error) => {
        console.error("CSV parsing failed:", error);
        toast.error("CSV parsing failed");
      },
    });
    
    // Reset file input
    event.target.value = "";
  };

  const handleTextSubmit = () => {
    if (!csvText.trim()) return;

    Papa.parse<CSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        processCsvData(results.data || [], "Manual Text Input");
      },
      // FIX APPLIED HERE: Added Error type to the parameter
      error: (error: Error) => {
        console.error("CSV parsing failed:", error);
        toast.error("CSV text parsing failed");
      },
    });
  };

  const handleCellChange = (index: number, field: "name" | "email", value: string) => {
    setRows((prev) => {
      const newRows = [...prev];
      const currentRow = newRows[index];

      // Re-validate the row with the updated field
      const updatedRawRow: CSVRow = {
        name: field === "name" ? value : currentRow.name,
        email: field === "email" ? value : currentRow.email,
        syllabus_id: currentRow.syllabus_id,
        issue_date: currentRow.issue_date,
      };

      newRows[index] = normalizeRow(updatedRawRow);
      return newRows;
    });
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setRows([]);
    setFileName(null);
    setCsvText("");
    setCreatedCertificates([]);
  };

  const downloadErrors = () => {
    if (!invalidRows.length) {
      toast.error("No invalid rows to export");
      return;
    }

    downloadCsv(
      "certificate-upload-errors.csv",
      invalidRows.map((row) => ({
        name: row.name,
        email: row.email,
        syllabus_id: row.syllabus_id,
        issue_date: row.issue_date,
        errors: row.errors.join("; "),
      }))
    );
  };

  const copyPreviewLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Preview link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleSubmit = async () => {
    if (!validRows.length) {
      toast.error("No valid rows to upload");
      return;
    }

    setIsUploading(true);
    setCreatedCertificates([]);

    try {
      const payload = {
        students: validRows.map((row) => ({
          name: row.name,
          email: row.email,
          syllabus_id: Number(row.syllabus_id),
          issue_date: row.issue_date,
        })),
      };

      const response = await fetch("/api/certificate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let result: UploadResponse | { error?: string };

      try {
        result = JSON.parse(text);
      } catch {
        console.error("Non-JSON response:", text);
        throw new Error("Server returned invalid response");
      }

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      const typedResult = result as UploadResponse;

      setCreatedCertificates(typedResult.certificates || []);
      toast.success(
        `${typedResult.count || validRows.length} certificate(s) created`
      );

      setRows([]);
      setFileName(null);
      setCsvText("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <Toaster position="top-right" />

      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bulk Certificate Issuance
            </h1>
            <p className="mt-1 text-gray-500">
              Upload a CSV with: name, email, syllabus_id, issue_date
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase text-gray-400">System</p>
            <p className="flex items-center justify-end gap-1 text-sm font-semibold text-green-600">
              <ShieldCheck size={14} />
              Ready
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload Section */}
            <label className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white transition hover:bg-blue-50">
              <Upload size={32} className="text-blue-500" />
              <p className="mt-3 text-sm text-gray-600">
                Click to upload CSV
              </p>
              <p className="text-xs text-gray-400">
                Required: name, email, syllabus_id, issue_date
              </p>

              {fileName && (
                <div className="mt-3 flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1 text-xs text-white">
                  <FileText size={12} />
                  {fileName}
                </div>
              )}

              <input
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>

            <div className="flex items-center gap-4">
              <div className="h-px bg-gray-300 flex-1"></div>
              <span className="text-sm text-gray-400 font-medium">OR PASTE CSV TEXT</span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>

            {/* Text Area Section */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`name,email,syllabus_id,issue_date\nJohn Doe,john@example.com,123,2023-10-25`}
                className="w-full h-40 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none font-mono"
                disabled={isUploading}
              />
              <button
                onClick={handleTextSubmit}
                disabled={isUploading || !csvText.trim()}
                className="mt-3 w-full rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-50 disabled:hover:bg-blue-50"
              >
                Parse CSV Text
              </button>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm h-fit">
            <h3 className="mb-4 font-semibold">Summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Total</span>
                <b>{rows.length}</b>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Valid</span>
                <b>{validRows.length}</b>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Errors</span>
                <b>{invalidRows.length}</b>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isUploading || validRows.length === 0}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-white disabled:opacity-50 transition hover:bg-gray-800"
            >
              {isUploading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
              {isUploading ? "Uploading..." : `Generate (${validRows.length})`}
            </button>

            <button
              onClick={clearAll}
              disabled={isUploading || (!rows.length && !createdCertificates.length && !csvText && !fileName)}
              className="mt-3 w-full rounded-xl border py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">CSV Preview</h3>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Edit3 size={12} /> Editable Cells
                </span>
              </div>

              {invalidRows.length > 0 && (
                <button
                  onClick={downloadErrors}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition"
                >
                  <Download size={14} />
                  Export Errors
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-400">
                  <tr>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left w-1/4">Name</th>
                    <th className="p-3 text-left w-1/4">Email</th>
                    <th className="p-3 text-left">Syllabus ID</th>
                    <th className="p-3 text-left">Issue Date</th>
                    <th className="p-3 text-left">Errors</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, index) => (
                    // Using index as key ensures the row doesn't lose focus when the email state changes
                    <tr key={index} className="border-t hover:bg-gray-50 group">
                      <td className="p-3">
                        {row.isValid ? (
                          <CheckCircle2 className="text-green-500" size={16} />
                        ) : (
                          <AlertCircle className="text-red-500" size={16} />
                        )}
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleCellChange(index, "name", e.target.value)}
                          placeholder="Empty name"
                          className={`w-full bg-transparent border-b outline-none py-1 px-1 transition-colors ${
                            row.errors.some((e) => e.toLowerCase().includes("name"))
                              ? "border-red-300 text-red-600 focus:border-red-500"
                              : "border-transparent focus:border-blue-500 group-hover:border-gray-300"
                          }`}
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="email"
                          value={row.email}
                          onChange={(e) => handleCellChange(index, "email", e.target.value)}
                          placeholder="Empty email"
                          className={`w-full bg-transparent border-b outline-none py-1 px-1 transition-colors ${
                            row.errors.some((e) => e.toLowerCase().includes("email"))
                              ? "border-red-300 text-red-600 focus:border-red-500"
                              : "border-transparent focus:border-blue-500 group-hover:border-gray-300"
                          }`}
                        />
                      </td>
                      <td className="p-3">{row.syllabus_id || "-"}</td>
                      <td className="p-3">{row.issue_date || "-"}</td>
                      <td className="p-3 text-xs text-red-600">
                        {row.errors.length ? row.errors.join(", ") : "-"}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => removeRow(index)}
                          className="text-gray-400 hover:text-red-600 transition"
                          aria-label={`Remove row ${index + 1}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {createdCertificates.length > 0 && (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="p-4 bg-green-50 border-b border-green-100">
              <h3 className="font-semibold text-green-900">Created Certificates</h3>
              <p className="mt-1 text-sm text-green-700">
                Certificates were saved successfully and preview links are ready.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-400">
                  <tr>
                    <th className="p-3 text-left">Code</th>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Syllabus</th>
                    <th className="p-3 text-left">Issue Date</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Preview</th>
                  </tr>
                </thead>

                <tbody>
                  {createdCertificates.map((certificate) => (
                    <tr key={certificate.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">
                        {certificate.certificate_code || "-"}
                      </td>
                      <td className="p-3">{certificate.name || "-"}</td>
                      <td className="p-3">{certificate.email || "-"}</td>
                      <td className="p-3">
                        {certificate.syllabus_name ||
                          certificate.syllabus_id ||
                          "-"}
                      </td>
                      <td className="p-3">{certificate.issue_date || "-"}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {certificate.status || "Created"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <a
                            href={certificate.preview_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition"
                          >
                            <Eye size={14} />
                            View
                          </a>

                          <button
                            onClick={() => copyPreviewLink(certificate.preview_url)}
                            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 transition"
                          >
                            <Copy size={14} />
                            Copy
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}