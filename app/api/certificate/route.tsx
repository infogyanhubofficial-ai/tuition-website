import { ImageResponse } from "@vercel/og";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

export const runtime = "nodejs";

// ─── Canvas Dimensions (Exact ISO A4 Landscape @ 300 DPI) ────────────────────
const CERT_WIDTH = 3508;
const CERT_HEIGHT = 2480;

// ─── Design Token System ────────────────────────────────────────────────────
const COLORS = {
  pageBg: "#f9fcff",

  navy: "#11263c",         // Primary text (Deepened for high contrast print feel)
  navySoft: "#4a5d70",     // Secondary text
  navyLight: "#869ab1",    // Tertiary / labels

  courseBlue: "#1a3b5c",   // Blue → course title ONLY 
  accentOrange: "#d97725", // Orange → underline accent ONLY (Slightly burnt/formal)

  gold: "#cda651",         // Gold → borders + seal ONLY (richer metallic tone)
  goldLight: "#e3cc96",    // Light gold for gradients
  goldLine: "#cda651",     // Decorative hairlines (gold family)

  borderBlue: "#1a3b5c",   // Outer frame border
  line: "#d5dfeb",         // Neutral separators
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
    "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/LOGO_BG_REMOVED.png",
  sealUrl:
    "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/SEAL_FINAL-removebg-preview.png",
  directorSignatureUrl:
    "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/syllabi/DIRECTOR_SIGN-removebg-preview%20(1).png",
  fallbackInstructorSignatureUrl: "", // Removed placeholder to allow manual signing after printing
};

// ─── Types ──────────────────────────────────────────────────────────────────
type CreateCertificateInput = {
  name: string;
  email: string;
  syllabus_id: number;
  issue_date?: string;
};

type CertificateRow = {
  id: number;
  name: string | null;
  syllabus_id: number | null;
  certificate_image: string | null;
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
  return truncateText(value.replace(/\s+/g, " ").trim(), 2000); 
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

function generateHashSimulation(certCode: string): string {
  // Generates a mock security hash purely for visual authenticity
  const base = certCode.replace(/[^A-Z0-9]/g, '');
  return `${base.split('').reverse().join('')}X9A8${base.substring(0, 3)}`.toUpperCase();
}

// ─── DB Helpers ──────────────────────────────────────────────────────────────
async function getCertificateContext(supabase: SupabaseClient, cert: CertificateRow) {
  const syllabusId = cert.syllabus_id;
  if (!syllabusId) throw new Error(`Certificate ${cert.id} has no syllabus_id`);

  const { data: syllabus, error: syllabusError } = await supabase
    .from("syllabi_v2")
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
    .from("syllabi_v2")
    .select("id, course_code")
    .eq("id", syllabusId)
    .single<{ id: number; course_code: string | null }>();

  if (error || !syllabus)
    throw new Error(`Unable to load course_code for syllabus_id=${syllabusId}`);

  const rawCourseCode = syllabus.course_code?.trim();
  if (!rawCourseCode)
    throw new Error(`Missing course_code in syllabi_v2 for syllabus_id=${syllabusId}`);

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
        certificate_code: certificateCode,
        updated_at: new Date().toISOString(),
      })
      .select(
        `id, name, syllabus_id, certificate_image, created_at,
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

  const qrCodeDataUri = await QRCode.toDataURL(verificationUrl, {
    margin: 1,
    width: 600, // Higher resolution QR matrix for HD print
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
    instructorSignatureUrl: tutor?.signature_url || DEFAULTS.fallbackInstructorSignatureUrl,
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
// CERTIFICATE TEMPLATE (A4 Landscape HD Scaled — 3508 x 2480 px)
// ─────────────────────────────────────────────────────────────────────────────
function CertificateTemplate(data: CertificateTemplateData) {
  const FOOTER_H = 380; // Scaled footer height

  // 1. Adaptive Name Scaling (Scaled for 3508px width)
  const nameLength = data.studentName.length;
  let nameFontSize = 210; // Luxury default size for HD A4
  if (nameLength > 20) nameFontSize = 175;
  if (nameLength > 28) nameFontSize = 145;

  // 2. Course Size Scaling (Scaled for 3508px width)
  const courseLength = data.courseName.length;
  let courseFontSize = 110; 
  if (courseLength > 40) courseFontSize = 88;

  return (
    <div
      style={{
        width: `${CERT_WIDTH}px`,
        height: `${CERT_HEIGHT}px`, 
        display: "flex",
        position: "relative",
        backgroundColor: COLORS.pageBg,
        padding: "44px",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: COLORS.navy,
      }}
    >
      {/* Background Central Logo Watermark */}
      <img
        src={data.logoUrl}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "1800px",
          height: "1800px",
          transform: "translate(-50%, -50%)",
          opacity: 0.01,
          objectFit: "contain",
          zIndex: 0,
        }}
      />

      {/* Outer engraved border system */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          border: `4px solid ${COLORS.borderBlue}`,
          padding: "26px",
          boxSizing: "border-box",
          position: "relative",
          backgroundColor: "transparent",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            border: `3px solid rgba(26, 59, 92, 0.2)`,
            padding: "10px",
            boxSizing: "border-box",
          }}
        >
          {/* Inner premium gold frame */}
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              border: `7px solid ${COLORS.gold}`,
              boxSizing: "border-box",
              padding: "115px 160px 115px 160px", 
              flexDirection: "column",
              position: "relative",
              backgroundColor: "transparent",
            }}
          >
            {/* Abstract Geometric Guilloché Pattern */}
            <div
              style={{
                display: "flex",
                position: "absolute",
                inset: "0",
                opacity: 0.03,
                backgroundImage: "radial-gradient(circle at center, rgba(17,38,60,0.8) 1.5px, transparent 3px)",
                backgroundSize: "36px 36px",
                zIndex: 0,
              }}
            />

            {/* Micro inner border ring */}
            <div
              style={{
                display: "flex",
                position: "absolute",
                inset: "16px",
                border: `3px solid rgba(205, 166, 81, 0.4)`,
                zIndex: 0,
              }}
            />

            {/* Holographic Strip Simulation (Security Feature) */}
            <div
              style={{
                display: "flex",
                position: "absolute",
                left: "60px",
                top: "10%",
                bottom: "10%",
                width: "10px",
                background: `linear-gradient(to bottom, transparent, rgba(205, 166, 81, 0.3), rgba(17, 38, 60, 0.1), rgba(205, 166, 81, 0.3), transparent)`,
                zIndex: 1,
              }}
            />

            {/* Premium Gold Corner Accents */}
            {(
              [
                { t: "30px", l: "30px", dot: { top: "40px", left: "40px" }, type: "tl" },
                { t: "30px", r: "30px", dot: { top: "40px", right: "40px" }, type: "tr" },
                { b: "30px", l: "30px", dot: { bottom: "40px", left: "40px" }, type: "bl" },
                { b: "30px", r: "30px", dot: { bottom: "40px", right: "40px" }, type: "br" },
              ] as Array<Record<string, any>>
            ).map((c, i) => {
              const s: Record<string, string | number> = {
                display: "flex", position: "absolute", width: "80px", height: "80px", zIndex: 1
              };
              if (c.t) s.top = c.t; if (c.r) s.right = c.r; if (c.b) s.bottom = c.b; if (c.l) s.left = c.l;
              
              const isTop = c.type.includes('t'); const isBottom = c.type.includes('b');
              const isLeft = c.type.includes('l'); const isRight = c.type.includes('r');

              if (isTop) s.borderTop = `7px solid ${COLORS.gold}`;
              if (isBottom) s.borderBottom = `7px solid ${COLORS.gold}`;
              if (isLeft) s.borderLeft = `7px solid ${COLORS.gold}`;
              if (isRight) s.borderRight = `7px solid ${COLORS.gold}`;

              return (
                <div key={i} style={s}>
                  <div style={{
                    display: "flex", position: 'absolute', width: '13px', height: '13px',
                    backgroundColor: COLORS.gold, ...c.dot
                  }} />
                </div>
              );
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
                zIndex: 2,
                flexShrink: 0,
              }}
            >
              <img
                src={data.logoUrl}
                alt="Issuer Logo"
                width={1450}
                height={290}
                style={{ objectFit: "contain" }}
              />
              <div
                style={{
                  display: "flex",
                  marginTop: "20px",
                  fontSize: "30px",
                  letterSpacing: "10px",
                  textTransform: "uppercase",
                  color: COLORS.navySoft,
                  fontWeight: 600,
                  fontFamily: "sans-serif" 
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
                zIndex: 2,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "70px",
                  textTransform: "uppercase",
                  letterSpacing: "8px",
                  color: COLORS.navy,
                  fontWeight: 400,
                  lineHeight: 1.0,
                  opacity: 0.9,
                }}
              >
                Certificate of Achievement
              </div>

              {/* Elegant formal dividers */}
              <div
                style={{
                  display: "flex", width: "220px", height: "5px",
                  backgroundColor: COLORS.gold, marginTop: "40px",
                }}
              />
              <div
                style={{
                  display: "flex", width: "650px", height: "3px",
                  backgroundColor: COLORS.goldLine, marginTop: "15px", opacity: 0.5,
                }}
              />

              <div
                style={{
                  display: "flex", marginTop: "55px", fontSize: "40px",
                  color: COLORS.navySoft, letterSpacing: "2.5px",
                }}
              >
                This is to certify that
              </div>

              {/* Strict Typography Hierarchy: Premium Student Name */}
              <div
                style={{
                  display: "flex",
                  marginTop: "45px",
                  padding: "0 60px",
                  fontSize: `${nameFontSize}px`,
                  lineHeight: 1.1,
                  color: COLORS.navy,
                  fontWeight: 800,
                  fontStyle: "normal",
                  textAlign: "center",
                  maxWidth: "2800px",
                  flexWrap: "wrap", 
                  justifyContent: "center",
                  letterSpacing: "0px",
                  fontFamily: "'Cormorant Garamond', 'Times New Roman', Georgia, serif",
                }}
              >
                {data.studentName}
              </div>

              {/* Separator below name */}
              <div
                style={{
                  display: "flex", width: "850px", height: "3px",
                  backgroundColor: "rgba(26, 59, 92, 0.15)", marginTop: "45px",
                }}
              />

              <div
                style={{
                  display: "flex", marginTop: "45px", fontSize: "40px",
                  color: COLORS.navySoft, letterSpacing: "2.5px",
                }}
              >
                has successfully completed
              </div>

              {/* Course Title Container */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginTop: "35px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: `${courseFontSize}px`,
                    color: COLORS.courseBlue,
                    fontWeight: 600,
                    textAlign: "center",
                    maxWidth: "2600px",
                    lineHeight: 1.2,
                    letterSpacing: "1.5px",
                    fontFamily: "'Cormorant Garamond', 'Times New Roman', Georgia, serif",
                  }}
                >
                  {data.courseName}
                </div>

                {/* Formal Underline Accent */}
                <div style={{ display: "flex", width: "480px", height: "5px", backgroundColor: COLORS.accentOrange, marginTop: "32px" }} />
              </div>

              {/* Course Description */}
              <div
                style={{
                  display: "flex",
                  marginTop: "45px",
                  maxWidth: "2000px", 
                  textAlign: "center",
                  fontSize: "36px",
                  color: COLORS.navySoft,
                  lineHeight: 1.8,
                }}
              >
                {data.courseDescription}
              </div>

              <div
                style={{
                  display: "flex", marginTop: "40px", fontSize: "28px",
                  textTransform: "uppercase", letterSpacing: "6px",
                  color: COLORS.navy, fontWeight: 600,
                }}
              >
                {data.courseDuration ? `Duration: ${data.courseDuration}` : ""}
              </div>
            </div>

            {/* ══════════════════════════════════════════
                ZONE 3 — FOOTER (Institutional Style)
            ══════════════════════════════════════════ */}
            <div
              style={{
                display: "flex",
                width: "100%",
                alignItems: "flex-end",
                justifyContent: "space-between",
                position: "relative",
                zIndex: 2,
                flexShrink: 0,
                height: `${FOOTER_H}px`,
                minHeight: `${FOOTER_H}px`,
                paddingBottom: "35px",
              }}
            >
              {/* ── Left: Instructor Signature ── */}
              <div
                style={{
                  display: "flex", width: "33.3%", flexDirection: "column",
                  alignItems: "center", justifyContent: "flex-end", height: "100%",
                }}
              >
                {data.instructorSignatureUrl ? (
                  <img
                    src={data.instructorSignatureUrl}
                    alt="Instructor Signature"
                    width={400} height={130}
                    style={{ objectFit: "contain", opacity: 0.85 }}
                  />
                ) : (
                  <div style={{ display: "flex", width: "400px", height: "130px" }} />
                )}
                <div style={{ display: "flex", width: "500px", borderTop: `3px solid ${COLORS.navySoft}`, marginTop: "20px" }} />
                <div
                  style={{
                    display: "flex", marginTop: "20px", fontSize: "36px",
                    color: COLORS.navy, fontWeight: 600, letterSpacing: "1px",
                  }}
                >
                  {data.instructorName}
                </div>
                <div
                  style={{
                    display: "flex", alignItems: "center", marginTop: "10px", fontSize: "24px",
                    color: COLORS.navyLight, textTransform: "uppercase",
                    letterSpacing: "4px", fontWeight: 600,
                  }}
                >
                  <div style={{ display: "flex", width: 10, height: 10, backgroundColor: COLORS.accentOrange, borderRadius: 5, marginRight: 14 }}></div>
                  {data.instructorTitle}
                  <div style={{ display: "flex", width: 10, height: 10, backgroundColor: COLORS.accentOrange, borderRadius: 5, marginLeft: 14 }}></div>
                </div>
              </div>

              {/* ── Centre: Official Embossed Seal + Date ── */}
              <div
                style={{
                  display: "flex", width: "33.4%", flexDirection: "column",
                  alignItems: "center", justifyContent: "flex-end", height: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex", width: "310px", height: "310px",
                    alignItems: "center", justifyContent: "center",
                    borderRadius: "999px",
                    background: `radial-gradient(circle, #ffffff 0%, ${COLORS.pageBg} 60%, ${COLORS.goldLight} 100%)`,
                    border: `7px solid ${COLORS.gold}`,
                    boxShadow: "inset 0 4px 20px rgba(205,166,81,0.4), 0 4px 10px rgba(0,0,0,0.05)",
                    position: "relative",
                  }}
                >
                  {/* Micro-text simulated rings */}
                  <div style={{ display: "flex", position: "absolute", inset: "10px", border: `3px dashed ${COLORS.gold}`, borderRadius: "999px", opacity: 0.5 }} />
                  <div style={{ display: "flex", position: "absolute", inset: "18px", border: `3px solid rgba(26,59,92,0.1)`, borderRadius: "999px" }} />
                  <img
                    src={data.sealUrl}
                    alt="Official Seal"
                    width={240} height={240} 
                    style={{ objectFit: "contain", zIndex: 2 }}
                  />
                </div>

                <div
                  style={{
                    display: "flex", marginTop: "35px", fontSize: "24px",
                    color: COLORS.navySoft, textTransform: "uppercase",
                    letterSpacing: "5px", fontWeight: 600,
                  }}
                >
                  {`Issued • ${data.formattedDate}`}
                </div>
              </div>

              {/* ── Right: Director Signature ── */}
              <div
                style={{
                  display: "flex", width: "33.3%", flexDirection: "column",
                  alignItems: "center", justifyContent: "flex-end", height: "100%",
                }}
              >
                <img
                  src={data.directorSignatureUrl}
                  alt="Director Signature"
                  width={400} height={130}
                  style={{ objectFit: "contain", opacity: 0.85 }}
                />
                <div style={{ display: "flex", width: "500px", borderTop: `3px solid ${COLORS.navySoft}`, marginTop: "20px" }} />
                <div
                  style={{
                    display: "flex", marginTop: "20px", fontSize: "36px",
                    color: COLORS.navy, fontWeight: 600, letterSpacing: "1px",
                  }}
                >
                  {data.directorName}
                </div>
                <div
                  style={{
                    display: "flex", alignItems: "center", marginTop: "10px", fontSize: "24px",
                    color: COLORS.navyLight, textTransform: "uppercase",
                    letterSpacing: "4px", fontWeight: 600,
                  }}
                >
                  <div style={{ display: "flex", width: 10, height: 10, backgroundColor: COLORS.accentOrange, borderRadius: 5, marginRight: 14 }}></div>
                  {data.directorTitle}
                  <div style={{ display: "flex", width: 10, height: 10, backgroundColor: COLORS.accentOrange, borderRadius: 5, marginLeft: 14 }}></div>
                </div>
              </div>
            </div>
            
            {/* Absolute Micro-text Authenticity Footer */}
            <div style={{
              display: "flex", position: "absolute", bottom: "35px", left: "160px", right: "160px",
              justifyContent: "space-between", alignItems: "center", zIndex: 2,
            }}>
              <div style={{ display: "flex", fontSize: "16px", color: COLORS.navySoft, opacity: 0.85, letterSpacing: "3.5px", textTransform: "uppercase" }}>
                {`HASH: ${generateHashSimulation(data.certCode)}`}
              </div>
              <div style={{ display: "flex", fontSize: "16px", color: COLORS.navySoft, opacity: 0.85, letterSpacing: "5px", textTransform: "uppercase" }}>
                GYANHUB PVT LTD // AUTHENTIC DOCUMENT
              </div>
              <div style={{ display: "flex", fontSize: "16px", color: COLORS.navySoft, opacity: 0.85, letterSpacing: "3.5px", textTransform: "uppercase" }}>
                VER: GH-2026-X1
              </div>
            </div>

          </div>

          {/* ══════════════════════════════════════════
              TOP-LEFT: Verified QR Area 
          ══════════════════════════════════════════ */}
          <div
            style={{
              display: "flex", position: "absolute", left: "115px", top: "115px",
              flexDirection: "column", alignItems: "center", zIndex: 3,
            }}
          >
            <div style={{ display: "flex", padding: "14px", backgroundColor: "#fff", border: `3px solid rgba(26,59,92,0.15)` }}>
              <img
                src={data.qrCodeDataUri}
                alt="Verification QR"
                width={260} height={260} 
                style={{ objectFit: "contain" }}
              />
            </div>
            <div
              style={{
                display: "flex", marginTop: "20px", fontSize: "18px",
                letterSpacing: "2.5px", color: COLORS.navySoft,
                fontWeight: 600, textTransform: "uppercase",
              }}
            >
              Scan to Verify
            </div>
          </div>

          {/* ══════════════════════════════════════════
              TOP-RIGHT: Engraved Credential Badge 
          ══════════════════════════════════════════ */}
          <div
            style={{
              display: "flex", position: "absolute", right: "115px", top: "115px",
              flexDirection: "column", alignItems: "flex-end", zIndex: 3,
              height: "290px", // Anchors exactly to the height of the QR Box bounds
              justifyContent: "flex-end", // Aligns content exactly on the lower baseline
            }}
          >
            <div
              style={{
                display: "flex", fontSize: "20px", textTransform: "uppercase",
                letterSpacing: "5px", color: COLORS.navySoft, fontWeight: 600,
              }}
            >
              {DEFAULTS.credentialLabel}
            </div>
            <div
              style={{
                display: "flex", marginTop: "10px", fontSize: "40px",
                color: COLORS.navy, fontWeight: 600, letterSpacing: "2.5px",
                fontFamily: "monospace" 
              }}
            >
              {data.certCode}
            </div>
            {/* Subtle gold underline to anchor floating text */}
            <div style={{ display: "flex", width: "100px", height: "4px", backgroundColor: COLORS.gold, marginTop: "10px", opacity: 0.8 }} />
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Render & Upload ─────────────────────────────────────────────────────────
async function renderCertificatePng(data: CertificateTemplateData) {
  const image = new ImageResponse(CertificateTemplate(data), {
    width: CERT_WIDTH,
    height: CERT_HEIGHT, 
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

    const qrCodeDataUri = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 600, // Higher resolution QR matrix for HD print
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
      width: CERT_WIDTH,
      height: CERT_HEIGHT, 
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
      .from("syllabi_v2")
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