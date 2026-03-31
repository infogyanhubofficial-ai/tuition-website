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
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

// ---------- TYPES ----------
interface CSVRow {
  name?: string;
  email?: string;
  syllabus_id?: string;
  issue_date?: string;
  created_by?: string;
}

interface ValidationRow {
  name: string;
  email: string;
  syllabus_id: string;
  issue_date: string;
  created_by: string;
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
    created_by: (row.created_by ?? "").trim(),
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

  if (normalized.created_by && !isPositiveInteger(normalized.created_by)) {
    normalized.errors.push("Created by must be a positive integer");
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
  const [isUploading, setIsUploading] = useState(false);
  const [createdCertificates, setCreatedCertificates] = useState<
    CreatedCertificate[]
  >([]);

  const validRows = useMemo(() => rows.filter((row) => row.isValid), [rows]);
  const invalidRows = useMemo(() => rows.filter((row) => !row.isValid), [rows]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setCreatedCertificates([]);

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        const parsedRows = (results.data || []).map(normalizeRow);
        setRows(parsedRows);

        if (!parsedRows.length) {
          toast.error("No rows found in CSV");
          return;
        }

        toast.success(`${parsedRows.length} row(s) loaded`);
      },
      error: (error) => {
        console.error("CSV parsing failed:", error);
        toast.error("CSV parsing failed");
      },
    });
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setRows([]);
    setFileName(null);
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
        created_by: row.created_by,
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
          ...(row.created_by
            ? { created_by: Number(row.created_by) }
            : {}),
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
              Upload a CSV with: name, email, syllabus_id, issue_date,
              created_by
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
          <div className="lg:col-span-2">
            <label className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white transition hover:bg-blue-50">
              <Upload size={32} className="text-blue-500" />
              <p className="mt-3 text-sm text-gray-600">
                Click to upload CSV
              </p>
              <p className="text-xs text-gray-400">
                Required: name, email, syllabus_id, issue_date
              </p>
              <p className="text-xs text-gray-400">
                Optional: created_by
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
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
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
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-white disabled:opacity-50"
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
              disabled={isUploading || (!rows.length && !createdCertificates.length)}
              className="mt-3 w-full rounded-xl border py-3 text-sm text-gray-700 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center justify-between p-4">
              <h3 className="font-semibold">CSV Preview</h3>

              {invalidRows.length > 0 && (
                <button
                  onClick={downloadErrors}
                  className="flex items-center gap-2 text-sm text-red-600"
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
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Syllabus ID</th>
                    <th className="p-3 text-left">Issue Date</th>
                    <th className="p-3 text-left">Created By</th>
                    <th className="p-3 text-left">Errors</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.email}-${index}`} className="border-t">
                      <td className="p-3">
                        {row.isValid ? (
                          <CheckCircle2 className="text-green-500" size={16} />
                        ) : (
                          <AlertCircle className="text-red-500" size={16} />
                        )}
                      </td>
                      <td className="p-3">{row.name || "-"}</td>
                      <td className="p-3">{row.email || "-"}</td>
                      <td className="p-3">{row.syllabus_id || "-"}</td>
                      <td className="p-3">{row.issue_date || "-"}</td>
                      <td className="p-3">{row.created_by || "-"}</td>
                      <td className="p-3 text-xs text-red-600">
                        {row.errors.length ? row.errors.join(", ") : "-"}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => removeRow(index)}
                          className="text-gray-600 hover:text-red-600"
                          aria-label={`Remove row ${index + 1}`}
                        >
                          <Trash2 size={14} />
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
            <div className="p-4">
              <h3 className="font-semibold">Created Certificates</h3>
              <p className="mt-1 text-sm text-gray-500">
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
                    <tr key={certificate.id} className="border-t">
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
                      <td className="p-3">{certificate.status || "-"}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <a
                            href={certificate.preview_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Eye size={14} />
                            View
                          </a>

                          <button
                            onClick={() => copyPreviewLink(certificate.preview_url)}
                            className="inline-flex items-center gap-1 text-gray-600 hover:text-black"
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