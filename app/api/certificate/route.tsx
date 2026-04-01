import { ImageResponse } from "@vercel/og";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

export const runtime = "nodejs";

// ─── Design Token System ────────────────────────────────────────────────────
const COLORS = {
  pageBg: "#f7fbff",

  navy: "#16324d",         // Primary text
  navySoft: "#66798c",     // Secondary text
  navyLight: "#97a8b8",    // Tertiary / labels

  courseBlue: "#255688",   // Blue → course title ONLY
  accentOrange: "#ef8c2f", // Orange → underline accent ONLY

  gold: "#c7a04c",         // Gold → borders + seal ONLY
  goldLine: "#d7bb74",     // Decorative hairlines (gold family)

  borderBlue: "#243e58",   // Outer frame border
  line: "#d5dfeb",         // Neutral separators

  qrBg: "#ffffff",         // QR contrast background
};

const DEFAULTS = {
  issuerName: "GyanHub Pvt. Ltd.",
  issuerSubtitle: "Professional Level Certification",
  credentialLabel: "Credential ID",
  directorName: "Er. Nischal Subedi",
  directorTitle: "Director | GyanHub",
  instructorTitle: "Course Instructor",
  verifyBaseUrl: "https://www.gyanhub.com.np/certificate",
  logoUrl:
    "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/LOGO_BACKGROUND_REMOVED.png",
  sealUrl:
    "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/syllabi/Official_Stamp-removebg-preview.png",
  directorSignatureUrl:
    "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/syllabi/director_sign.png",
  fallbackInstructorSignatureUrl:
    "https://placehold.co/253x80/png?text=Instructor+Signature",
};

// ─── Types ──────────────────────────────────────────────────────────────────
type CreateCertificateInput = {
  name: string;
  email: string;
  syllabus_id: number;
  issue_date?: string;
  created_by?: number | null;
};

type CertificateRow = {
  id: number;
  name: string | null;
  syllabus_id: number | null;
  certificate_image: string | null;
  created_by: number | null;
  created_at: string | null;
  updated_at: string | null;
  email: string | null;
  syllabus_name: string | null;
  syllabus_pdf: string | null;
  issue_date: string | null;
  certificate_code: string | null;
  status: string | null;
};

type SyllabusLookupRow = {
  id: number;
  name: string | null;
  description: string | null;
  duration: string | null;
  syllabus_pdf: string | null;
  status: string | null;
  tutor_id: number | null;
  course_code: string | null;
};

type TutorLookupRow = {
  id: number;
  name: string | null;
  designation: string | null;
  signature_url: string | null;
};

type CertificateTemplateData = {
  studentName: string;
  studentEmail: string;
  courseName: string;
  courseDescription: string;
  courseDuration: string;
  certCode: string;
  formattedDate: string;
  instructorName: string;
  instructorTitle: string;
  instructorSignatureUrl: string;
  directorName: string;
  directorTitle: string;
  directorSignatureUrl: string;
  issuerName: string;
  issuerSubtitle: string;
  logoUrl: string;
  sealUrl: string;
  verificationUrl: string;
  qrCodeDataUri: string;
};

// ─── Utilities ───────────────────────────────────────────────────────────────
function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return {
      client: null,
      error:
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    };
  }
  return {
    client: createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    }),
    error: null,
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeDate(date?: string): string {
  if (!date) return new Date().toISOString().split("T")[0];
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid issue_date: ${date}`);
  return parsed.toISOString().split("T")[0];
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function validateStudent(student: Partial<CreateCertificateInput>, index: number) {
  const r = index + 1;
  if (!isNonEmptyString(student.name)) throw new Error(`Row ${r}: name is required`);
  if (!isNonEmptyString(student.email) || !isValidEmail(student.email))
    throw new Error(`Row ${r}: valid email is required`);
  if (
    typeof student.syllabus_id !== "number" ||
    !Number.isInteger(student.syllabus_id) ||
    student.syllabus_id <= 0
  )
    throw new Error(`Row ${r}: syllabus_id must be a positive integer`);
  if (
    student.created_by !== undefined &&
    student.created_by !== null &&
    (!Number.isInteger(student.created_by) || student.created_by <= 0)
  )
    throw new Error(`Row ${r}: created_by must be a positive integer`);
}

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sanitizeCourseCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, "").trim();
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function cleanDescription(value?: string | null): string {
  if (!value || !value.trim()) return "";
  return truncateText(value.replace(/\s+/g, " ").trim(), 125);
}

function buildVerificationUrl(name: string, email: string) {
  const url = new URL(DEFAULTS.verifyBaseUrl);
  url.searchParams.set("name", name);
  url.searchParams.set("email", email);
  return url.toString();
}

function isUniqueCodeViolation(errorMessage?: string | null) {
  if (!errorMessage) return false;
  return errorMessage.toLowerCase().includes("certificates_certificate_code_key");
}

// ─── DB Helpers ──────────────────────────────────────────────────────────────
async function getCertificateContext(supabase: SupabaseClient, cert: CertificateRow) {
  const syllabusId = cert.syllabus_id;
  if (!syllabusId) throw new Error(`Certificate ${cert.id} has no syllabus_id`);

  const { data: syllabus, error: syllabusError } = await supabase
    .from("syllabi")
    .select(
      "id, name, description, duration, syllabus_pdf, status, tutor_id, course_code"
    )
    .eq("id", syllabusId)
    .single<SyllabusLookupRow>();

  if (syllabusError || !syllabus)
    throw new Error(`Unable to load syllabus for certificate ${cert.id}`);

  let tutor: TutorLookupRow | null = null;
  if (syllabus.tutor_id) {
    const { data: tutorData } = await supabase
      .from("online_tutors")
      .select("id, name, designation, signature_url")
      .eq("id", syllabus.tutor_id)
      .single<TutorLookupRow>();
    tutor = tutorData || null;
  }

  return { syllabus, tutor };
}

async function getCourseCodeForSyllabus(supabase: SupabaseClient, syllabusId: number) {
  const { data: syllabus, error } = await supabase
    .from("syllabi")
    .select("id, course_code")
    .eq("id", syllabusId)
    .single<{ id: number; course_code: string | null }>();

  if (error || !syllabus)
    throw new Error(`Unable to load course_code for syllabus_id=${syllabusId}`);

  const rawCourseCode = syllabus.course_code?.trim();
  if (!rawCourseCode)
    throw new Error(`Missing course_code in syllabi for syllabus_id=${syllabusId}`);

  return sanitizeCourseCode(rawCourseCode);
}

async function getNextCertificateCode(
  supabase: SupabaseClient,
  syllabusId: number,
  issueDate: string
) {
  const year = new Date(issueDate).getFullYear();
  const courseCode = await getCourseCodeForSyllabus(supabase, syllabusId);
  const prefix = `${courseCode}-${year}-`;

  const { data: existingRows, error: existingError } = await supabase
    .from("certificates")
    .select("certificate_code")
    .ilike("certificate_code", `${prefix}%`);

  if (existingError)
    throw new Error(
      `Unable to inspect existing certificate codes: ${existingError.message}`
    );

  let maxSequence = 0;
  for (const row of existingRows || []) {
    const code = row.certificate_code || "";
    const parts = code.split("-");
    const parsed = Number.parseInt(parts[parts.length - 1], 10);
    if (Number.isInteger(parsed) && parsed > maxSequence) maxSequence = parsed;
  }

  return `${prefix}${String(maxSequence + 1).padStart(3, "0")}`;
}

async function insertCertificateWithRetry(
  supabase: SupabaseClient,
  student: CreateCertificateInput,
  maxAttempts = 8
) {
  const issueDate = normalizeDate(student.issue_date);
  let lastError: string | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const certificateCode = await getNextCertificateCode(
      supabase,
      student.syllabus_id,
      issueDate
    );

    const { data, error } = await supabase
      .from("certificates")
      .insert({
        name: student.name.trim(),
        email: student.email.trim().toLowerCase(),
        syllabus_id: student.syllabus_id,
        issue_date: issueDate,
        created_by: student.created_by ?? null,
        certificate_code: certificateCode,
        updated_at: new Date().toISOString(),
      })
      .select(
        `id, name, syllabus_id, certificate_image, created_by, created_at,
         updated_at, email, syllabus_name, syllabus_pdf, issue_date,
         certificate_code, status`
      )
      .single<CertificateRow>();

    if (!error && data) return data;

    lastError = error?.message || "Unknown insert error";
    if (!isUniqueCodeViolation(lastError)) throw new Error(lastError);
  }

  throw new Error(
    lastError || "Could not allocate a unique certificate_code after multiple retries"
  );
}

async function buildTemplateData(
  supabase: SupabaseClient,
  cert: CertificateRow
): Promise<CertificateTemplateData> {
  const { syllabus, tutor } = await getCertificateContext(supabase, cert);

  const studentName = cert.name || "Student Name";
  const studentEmail = cert.email || "student@example.com";
  const courseName = syllabus.name || cert.syllabus_name || "";
  const courseDuration = syllabus.duration || "";
  const courseDescription = cleanDescription(syllabus.description);

  const issueDate = cert.issue_date || normalizeDate();
  const certCode = cert.certificate_code || "";
  const verificationUrl = buildVerificationUrl(studentName, studentEmail);

  // QR size increased by 30%: 160 → 208
  const qrCodeDataUri = await QRCode.toDataURL(verificationUrl, {
    margin: 1,
    width: 208,
    color: { dark: COLORS.navy, light: "#ffffff" },
  });

  return {
    studentName,
    studentEmail,
    courseName,
    courseDescription,
    courseDuration,
    certCode,
    formattedDate: formatDate(issueDate),
    instructorName: tutor?.name || "",
    instructorTitle: tutor?.designation || DEFAULTS.instructorTitle,
    instructorSignatureUrl:
      tutor?.signature_url || DEFAULTS.fallbackInstructorSignatureUrl,
    directorName: DEFAULTS.directorName,
    directorTitle: DEFAULTS.directorTitle,
    directorSignatureUrl: DEFAULTS.directorSignatureUrl,
    issuerName: DEFAULTS.issuerName,
    issuerSubtitle: DEFAULTS.issuerSubtitle,
    logoUrl: DEFAULTS.logoUrl,
    sealUrl: DEFAULTS.sealUrl,
    verificationUrl,
    qrCodeDataUri,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATE TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────
function CertificateTemplate(data: CertificateTemplateData) {
  const FOOTER_H = 128;

  return (
    <div
      style={{
        width: "1200px",
        height: "900px",
        display: "flex",
        position: "relative",
        backgroundColor: COLORS.pageBg,
        padding: "16px",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: COLORS.navy,
      }}
    >
      {/* Outer navy frame */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          border: `1px solid ${COLORS.borderBlue}`,
          padding: "9px",
          boxSizing: "border-box",
          position: "relative",
          backgroundColor: COLORS.pageBg,
        }}
      >
        {/* Inner gold frame */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            border: `1px solid rgba(199,160,76,0.58)`,
            boxSizing: "border-box",
            padding: "14px 44px 14px 44px",
            flexDirection: "column",
            position: "relative",
            backgroundColor: COLORS.pageBg,
          }}
        >
          {/* Background depth layers */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "1020px",
              height: "760px",
              transform: "translate(-50%, -50%)",
              borderRadius: "999px",
              background:
                "radial-gradient(circle, rgba(47,109,179,0.033) 0%, rgba(47,109,179,0.014) 45%, rgba(247,251,255,0) 72%)",
            }}
          />
          <div
            style={{
              display: "flex",
              position: "absolute",
              inset: "0",
              opacity: 0.015,
              backgroundImage:
                "radial-gradient(circle, rgba(22,50,77,1) 0.35px, transparent 0.35px)",
              backgroundSize: "4px 4px",
            }}
          />

          {/* Gold corner accents */}
          {(
            [
              { t: "10px", l: "10px", bt: true, bl: true },
              { t: "10px", r: "10px", bt: true, br: true },
              { b: "10px", l: "10px", bb: true, bl: true },
              { b: "10px", r: "10px", bb: true, br: true },
            ] as Array<Record<string, string | boolean>>
          ).map((c, i) => {
            const s: Record<string, string | number> = {
              display: "flex",
              position: "absolute",
              width: "16px",
              height: "16px",
            };
            if (c.t) s.top = c.t as string;
            if (c.r) s.right = c.r as string;
            if (c.b) s.bottom = c.b as string;
            if (c.l) s.left = c.l as string;
            if (c.bt) s.borderTop = `1.5px solid rgba(199,160,76,0.86)`;
            if (c.bb) s.borderBottom = `1.5px solid rgba(199,160,76,0.86)`;
            if (c.bl) s.borderLeft = `1.5px solid rgba(199,160,76,0.86)`;
            if (c.br) s.borderRight = `1.5px solid rgba(199,160,76,0.86)`;
            return <div key={i} style={s} />;
          })}

          {/* ══════════════════════════════════════════
              ZONE 1 — HEADER
          ══════════════════════════════════════════ */}
          <div
            style={{
              display: "flex",
              width: "100%",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                position: "relative",
                alignItems: "center",
                justifyContent: "center",
                width: "1040px",
                height: "180px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  width: "1000px",
                  height: "160px",
                  borderRadius: "999px",
                  background:
                    "radial-gradient(ellipse, rgba(47,109,179,0.10) 0%, rgba(47,109,179,0.04) 50%, rgba(247,251,255,0) 75%)",
                }}
              />
              <img
                src={data.logoUrl}
                alt="Issuer Logo"
                width={880}
                height={176}
                style={{ objectFit: "contain", position: "relative" }}
              />
            </div>

            <div
              style={{
                display: "flex",
                marginTop: "4px",
                fontSize: "11px",
                letterSpacing: "3.6px",
                textTransform: "uppercase",
                color: COLORS.navySoft,
                fontWeight: 700,
              }}
            >
              {data.issuerSubtitle}
            </div>
          </div>

          {/* ══════════════════════════════════════════
              ZONE 2 — BODY
          ══════════════════════════════════════════ */}
          <div
            style={{
              display: "flex",
              flexGrow: 1,
              width: "100%",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              position: "relative",
              zIndex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "28px",
                textTransform: "uppercase",
                letterSpacing: "2.8px",
                color: COLORS.navy,
                fontWeight: 400,
                lineHeight: 1.0,
                opacity: 0.80,
              }}
            >
              Certificate of Achievement
            </div>

            {/* Gold dividers */}
            <div
              style={{
                display: "flex",
                width: "80px",
                height: "1.5px",
                backgroundColor: COLORS.gold,
                marginTop: "13px",
              }}
            />
            <div
              style={{
                display: "flex",
                width: "240px",
                height: "1px",
                backgroundColor: COLORS.goldLine,
                marginTop: "6px",
                opacity: 0.48,
              }}
            />

            <div
              style={{
                display: "flex",
                marginTop: "16px",
                fontSize: "15px",
                color: COLORS.navySoft,
                lineHeight: 1.4,
              }}
            >
              This is to certify that
            </div>

            {/* Student Name */}
            <div
              style={{
                display: "flex",
                position: "relative",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "14px",
                width: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  width: "820px",
                  height: "150px",
                  borderRadius: "999px",
                  background:
                    "radial-gradient(ellipse, rgba(31,151,178,0.055) 0%, rgba(31,151,178,0.02) 45%, rgba(247,251,255,0) 70%)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  padding: "0 28px",
                  fontSize: "110px",
                  lineHeight: 0.96,
                  color: COLORS.navy,
                  fontWeight: 800,
                  textAlign: "center",
                  maxWidth: "1060px",
                  letterSpacing: "-2.5px",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  position: "relative",
                }}
              >
                {data.studentName}
              </div>
            </div>

            {/* Separator below name */}
            <div
              style={{
                display: "flex",
                width: "280px",
                height: "1px",
                backgroundColor: COLORS.line,
                marginTop: "16px",
              }}
            />

            <div
              style={{
                display: "flex",
                marginTop: "13px",
                fontSize: "15px",
                color: COLORS.navySoft,
              }}
            >
              has successfully completed
            </div>

            {/* Course title */}
            <div
              style={{
                display: "flex",
                marginTop: "12px",
                padding: "0 70px",
                fontSize: "42px",
                color: COLORS.courseBlue,
                fontWeight: 800,
                textAlign: "center",
                maxWidth: "960px",
                lineHeight: 1.13,
                letterSpacing: "0.4px",
              }}
            >
              {data.courseName}
            </div>

            {/* Orange accent underline */}
            <div
              style={{
                display: "flex",
                width: "180px",
                height: "2.5px",
                backgroundColor: COLORS.accentOrange,
                marginTop: "10px",
                borderRadius: "2px",
              }}
            />

            <div
              style={{
                display: "flex",
                marginTop: "12px",
                maxWidth: "620px",
                textAlign: "center",
                fontSize: "13.5px",
                color: COLORS.navySoft,
                lineHeight: 1.62,
              }}
            >
              {data.courseDescription}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: "11px",
                fontSize: "10.5px",
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: COLORS.navy,
                fontWeight: 700,
              }}
            >
              {data.courseDuration ? `Duration: ${data.courseDuration}` : ""}
            </div>

            {/* Body bottom divider */}
            <div
              style={{
                display: "flex",
                width: "300px",
                height: "1px",
                backgroundColor: COLORS.goldLine,
                marginTop: "14px",
                opacity: 0.46,
              }}
            />
          </div>

          {/* Hairline divider above footer */}
          <div
            style={{
              display: "flex",
              width: "calc(100% - 24px)",
              marginLeft: "12px",
              height: "1px",
              backgroundColor: COLORS.line,
              opacity: 0.50,
              flexShrink: 0,
            }}
          />

          {/* ══════════════════════════════════════════
              ZONE 3 — FOOTER
          ══════════════════════════════════════════ */}
          <div
            style={{
              display: "flex",
              width: "100%",
              alignItems: "flex-end",
              justifyContent: "space-between",
              position: "relative",
              zIndex: 1,
              flexShrink: 0,
              height: `${FOOTER_H}px`,
              minHeight: `${FOOTER_H}px`,
              paddingTop: "6px",
            }}
          >
            {/* ── Left: Instructor Signature ── */}
            <div
              style={{
                display: "flex",
                width: "33.3%",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                height: "100%",
              }}
            >
              <img
                src={data.instructorSignatureUrl}
                alt="Instructor Signature"
                width={184}
                height={56}
                style={{ objectFit: "contain" }}
              />
              <div
                style={{
                  display: "flex",
                  width: "196px",
                  borderTop: `2px solid ${COLORS.navy}`,
                  marginTop: "5px",
                }}
              />
              <div
                style={{
                  display: "flex",
                  marginTop: "5px",
                  fontSize: "14.5px",
                  color: COLORS.navy,
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {data.instructorName}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: "3px",
                  fontSize: "9px",
                  color: COLORS.navySoft,
                  textTransform: "uppercase",
                  letterSpacing: "1.4px",
                  textAlign: "center",
                  fontWeight: 700,
                }}
              >
                • {data.instructorTitle} •
              </div>
            </div>

            {/* ── Centre: Seal + issue date ── */}
            <div
              style={{
                display: "flex",
                width: "33.4%",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                height: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: "118px",
                  height: "118px",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "999px",
                  background:
                    "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(231,217,172,0.45) 72%, rgba(199,160,76,0.22) 100%)",
                  boxShadow:
                    "0 16px 36px rgba(0,0,0,0.17), 0 4px 10px rgba(199,160,76,0.28), inset 0 2px 8px rgba(199,160,76,0.62), inset 0 -4px 12px rgba(0,0,0,0.14)",
                  border: "1.5px solid rgba(199,160,76,0.52)",
                  marginBottom: "-6px",
                }}
              >
                <img
                  src={data.sealUrl}
                  alt="Official Seal"
                  width={96}
                  height={96}
                  style={{ objectFit: "contain" }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  marginTop: "10px",
                  fontSize: "9px",
                  color: COLORS.navyLight,
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                }}
              >
                Issued {data.formattedDate}
              </div>
            </div>

            {/* ── Right: Director Signature + QR ── */}
            <div
              style={{
                display: "flex",
                width: "33.3%",
                justifyContent: "flex-end",
                alignItems: "flex-end",
                gap: "14px",
                height: "100%",
              }}
            >
              {/* Director */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  height: "100%",
                }}
              >
                <img
                  src={data.directorSignatureUrl}
                  alt="Director Signature"
                  width={184}
                  height={56}
                  style={{ objectFit: "contain" }}
                />
                <div
                  style={{
                    display: "flex",
                    width: "196px",
                    borderTop: `2px solid ${COLORS.navy}`,
                    marginTop: "5px",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    marginTop: "5px",
                    fontSize: "14.5px",
                    color: COLORS.navy,
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  {data.directorName}
                </div>
                <div
                  style={{
                    display: "flex",
                    marginTop: "3px",
                    fontSize: "9px",
                    color: COLORS.navySoft,
                    textTransform: "uppercase",
                    letterSpacing: "1.4px",
                    fontWeight: 700,
                  }}
                >
                  • {data.directorTitle} •
                </div>
              </div>

              {/* QR Code — size increased 30%: img 70×70 → 91×91 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  height: "100%",
                  paddingBottom: "2px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    border: `1px solid rgba(213,223,235,0.52)`,
                    backgroundColor: COLORS.qrBg,
                    padding: "8px 8px 5px 8px",
                    borderRadius: "6px",
                    boxShadow: "0 2px 14px rgba(22,50,77,0.07)",
                  }}
                >
                  <img
                    src={data.qrCodeDataUri}
                    alt="Verification QR"
                    width={91}
                    height={91}
                    style={{ objectFit: "contain" }}
                  />
                  <div
                    style={{
                      display: "flex",
                      marginTop: "4px",
                      fontSize: "7px",
                      letterSpacing: "0.6px",
                      color: COLORS.navySoft,
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    Verify online
                  </div>
                  <div
                    style={{
                      display: "flex",
                      marginTop: "1px",
                      fontSize: "5.5px",
                      letterSpacing: "0.3px",
                      color: COLORS.navyLight,
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    By GyanHub Pvt. Ltd
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Credential ID badge */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              right: "20px",
              top: "20px",
              padding: "10px 15px",
              border: `1px solid rgba(213,223,235,0.55)`,
              backgroundColor: "rgba(248,251,255,0.96)",
              borderRadius: "7px",
              flexDirection: "column",
              alignItems: "flex-end",
              zIndex: 2,
              minWidth: "165px",
              boxShadow: "0 2px 10px rgba(22,50,77,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "8px",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                color: COLORS.navyLight,
                fontWeight: 700,
              }}
            >
              {DEFAULTS.credentialLabel}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "6px",
                fontSize: "16px",
                color: COLORS.navy,
                fontWeight: 800,
                letterSpacing: "0.3px",
              }}
            >
              {data.certCode}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Render & Upload ─────────────────────────────────────────────────────────
async function renderCertificatePng(data: CertificateTemplateData) {
  const image = new ImageResponse(CertificateTemplate(data), {
    width: 1200,
    height: 900,
  });
  const arrayBuffer = await image.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function uploadCertificateImage(supabase: SupabaseClient, cert: CertificateRow) {
  const templateData = await buildTemplateData(supabase, cert);
  const pngBytes = await renderCertificatePng(templateData);

  const fileName = `${sanitizeFileName(templateData.certCode)}-${sanitizeFileName(
    templateData.studentName
  )}.png`;
  const filePath = `generated/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("certificates")
    .upload(filePath, pngBytes, { contentType: "image/png", upsert: true });

  if (uploadError)
    throw new Error(
      `Storage upload failed for certificate ${cert.id}: ${uploadError.message}`
    );

  const { data: publicUrlData } = supabase.storage
    .from("certificates")
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabase
    .from("certificates")
    .update({ certificate_image: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", cert.id);

  if (updateError)
    throw new Error(
      `DB update failed for certificate ${cert.id}: ${updateError.message}`
    );

  return { imageUrl: publicUrl, templateData };
}

// ─── Route Handlers ──────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const rawDate =
      searchParams.get("date") || new Date().toISOString().split("T")[0];
    const studentName = searchParams.get("name") || "Student Name";
    const studentEmail = searchParams.get("email") || "student@example.com";
    const certCode = searchParams.get("id") || "";
    const verificationUrl = buildVerificationUrl(studentName, studentEmail);

    // QR size increased by 30%: 160 → 208
    const qrCodeDataUri = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 208,
      color: { dark: COLORS.navy, light: "#ffffff" },
    });

    const data: CertificateTemplateData = {
      studentName,
      studentEmail,
      courseName: searchParams.get("course") || "",
      courseDescription: searchParams.get("description") || "",
      courseDuration: searchParams.get("duration") || "",
      certCode,
      formattedDate: formatDate(rawDate),
      instructorName: searchParams.get("instructor") || "",
      instructorTitle:
        searchParams.get("instructor_title") || DEFAULTS.instructorTitle,
      instructorSignatureUrl:
        searchParams.get("instructor_signature") ||
        DEFAULTS.fallbackInstructorSignatureUrl,
      directorName: DEFAULTS.directorName,
      directorTitle: DEFAULTS.directorTitle,
      directorSignatureUrl: DEFAULTS.directorSignatureUrl,
      issuerName: DEFAULTS.issuerName,
      issuerSubtitle: DEFAULTS.issuerSubtitle,
      logoUrl: DEFAULTS.logoUrl,
      sealUrl: DEFAULTS.sealUrl,
      verificationUrl,
      qrCodeDataUri,
    };

    return new ImageResponse(CertificateTemplate(data), {
      width: 1200,
      height: 900,
    });
  } catch (error) {
    console.error("GET /api/certificate error:", error);
    return new Response("Failed to generate certificate image", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { client: supabase, error: envError } = getSupabase();
    if (envError || !supabase)
      return Response.json({ error: envError }, { status: 500 });

    const body = await req.json();

    const students: CreateCertificateInput[] = Array.isArray(body?.students)
      ? body.students
      : body
        ? [body]
        : [];

    if (!students.length)
      return Response.json(
        { error: "Request body must contain a student object or students array" },
        { status: 400 }
      );

    for (let i = 0; i < students.length; i++) validateStudent(students[i], i);

    const syllabusIds = [...new Set(students.map((s) => s.syllabus_id))];

    const { data: syllabusRows, error: syllabusError } = await supabase
      .from("syllabi")
      .select("id, status, course_code")
      .in("id", syllabusIds);

    if (syllabusError)
      return Response.json({ error: syllabusError.message }, { status: 500 });

    const foundIds = new Set((syllabusRows || []).map((row) => row.id));
    for (const id of syllabusIds) {
      if (!foundIds.has(id))
        return Response.json(
          { error: `Syllabus not found for syllabus_id=${id}` },
          { status: 400 }
        );
    }

    const inactive = (syllabusRows || []).find(
      (row) => row.status && row.status !== "active"
    );
    if (inactive)
      return Response.json(
        { error: `Syllabus ${inactive.id} is not active` },
        { status: 400 }
      );

    for (const row of syllabusRows || []) {
      if (!row.course_code || !row.course_code.trim())
        return Response.json(
          { error: `Missing course_code for syllabus_id=${row.id}` },
          { status: 400 }
        );
    }

    const insertedCertificates: CertificateRow[] = [];
    for (const student of students) {
      const inserted = await insertCertificateWithRetry(supabase, student);
      insertedCertificates.push(inserted);
    }

    const finalCertificates = await Promise.all(
      insertedCertificates.map(async (cert) => {
        const { imageUrl, templateData } = await uploadCertificateImage(supabase, cert);
        return {
          id: cert.id,
          name: cert.name,
          email: cert.email,
          syllabus_id: cert.syllabus_id,
          syllabus_name: cert.syllabus_name,
          syllabus_pdf: cert.syllabus_pdf,
          issue_date: cert.issue_date,
          certificate_code: cert.certificate_code,
          status: cert.status,
          certificate_image: imageUrl,
          preview_url: imageUrl,
          verification_url: templateData.verificationUrl,
        };
      })
    );

    return Response.json(
      { success: true, count: finalCertificates.length, certificates: finalCertificates },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/certificate error:", error);
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return Response.json({ error: message }, { status: 500 });
  }
}