"use client";

import { useState } from "react";

/**
 * GyanHub — Terms & Conditions
 * Design notes:
 * - Palette drawn from engineering drafting tools rather than generic SaaS defaults:
 *   ink navy (#122033), blueprint blue (#2F5D8C), vellum (#F6F3EC), graphite (#4B5563), signal amber (#C9782E)
 * - Display face pairing: a slab serif for headings (drafting title-block feel) + a plain grotesque for body/UI
 * - Numbered sections are appropriate here: this is a real, ordered legal document.
 * - Signature element: a "clause index" rail styled like a blueprint title block, with a running
 *   section counter and a subtle grid backdrop echoing CAD drafting sheets.
 */

const sections = [
  {
    id: "acceptance",
    n: "01",
    title: "Acceptance of Terms",
    body: (
      <>
        <p>
          By creating an account, enrolling in a course, making a payment, joining a live class,
          accessing a recording, receiving a certificate, or subscribing to our newsletters, you
          confirm that you have read, understood, and agree to be bound by these Terms &
          Conditions and any policies referenced within them.
        </p>
        <p>
          If you do not agree with any part of these Terms, please discontinue use of the GyanHub
          platform.
        </p>
      </>
    ),
  },
  {
    id: "definitions",
    n: "02",
    title: "Definitions",
    body: (
      <dl className="space-y-4">
        {[
          ["Platform", "The GyanHub website, dashboard, services, and applications."],
          ["Online Course", "Live, instructor-led virtual classes conducted in scheduled batches."],
          ["Physical Training", "Classes conducted at the GyanHub training centre in New Baneshwor, Kathmandu."],
          ["Recording", "Pre-recorded, self-paced learning content."],
          ["Bundle", "A combination of two or more courses sold together at a discounted price."],
          ["Student", "Any registered learner using the platform."],
          ["Certificate", "A digital certificate issued upon satisfying course eligibility criteria."],
          ["Content", "Videos, PDFs, quizzes, assignments, logos, graphics, and software demonstrations, among other materials owned or licensed by GyanHub."],
        ].map(([term, def]) => (
          <div key={term} className="grid grid-cols-[9rem_1fr] gap-4 sm:grid-cols-[11rem_1fr]">
            <dt className="font-semibold text-[#122033]">{term}</dt>
            <dd className="text-[#4B5563]">{def}</dd>
          </div>
        ))}
      </dl>
    ),
  },
  {
    id: "eligibility",
    n: "03",
    title: "Eligibility",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>You must be at least 13 years old to create an account.</li>
        <li>Users under 18 require permission from a parent or legal guardian.</li>
        <li>You must provide accurate, current information at all times.</li>
        <li>Creating an account under a false identity is not permitted.</li>
      </ul>
    ),
  },
  {
    id: "accounts",
    n: "04",
    title: "User Accounts",
    body: (
      <>
        <p>You are responsible for:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Keeping your password, email, and phone number secure.</li>
          <li>All activity performed under your account.</li>
          <li>Reporting unauthorized access to your account immediately.</li>
        </ul>
        <p>GyanHub may suspend accounts that show signs of compromise or misuse.</p>
      </>
    ),
  },
  {
    id: "courses",
    n: "05",
    title: "Courses & Enrollment",
    body: (
      <div className="space-y-6">
        <div>
          <h4 className="mb-2 font-semibold text-[#122033]">A. Online Live Courses</h4>
          <ul className="list-disc space-y-2 pl-5">
            <li>Enrollment is tied to a specific batch and schedule.</li>
            <li>Schedules may change; students will be notified in advance where possible.</li>
            <li>Meeting links are private and must not be shared outside the enrolled batch.</li>
            <li>Attendance is expected; recordings are provided only where included in the course.</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-2 font-semibold text-[#122033]">B. Physical Training</h4>
          <ul className="list-disc space-y-2 pl-5">
            <li>Conducted at our training centre near Eyeplex Mall, New Baneshwor, Kathmandu.</li>
            <li>Seats are limited and allocated on enrollment and payment confirmation.</li>
            <li>Late arrivals, absences, rescheduling, and cancellations follow the centre's attendance policy.</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-2 font-semibold text-[#122033]">C. Recorded Courses</h4>
          <ul className="list-disc space-y-2 pl-5">
            <li>Purchased recordings include lifetime access, unless removed for legal, copyright, or security reasons.</li>
            <li>Access is personal and may not be shared.</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-2 font-semibold text-[#122033]">D. Bundles</h4>
          <ul className="list-disc space-y-2 pl-5">
            <li>Bundle pricing applies only when courses are purchased together.</li>
            <li>Refund calculations for individual courses within a bundle may differ from the bundle price.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "payments",
    n: "06",
    title: "Payments & Pricing",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Accepted payment methods include Fonepay, bank transfer, and other methods shown at checkout.</li>
        <li>All prices are displayed in Nepalese Rupees (NPR).</li>
        <li>Prices may change without prior notice; previously purchased courses are unaffected by later price changes.</li>
        <li>Payment confirmation may take time to process.</li>
        <li>Invoices are available on request through your student dashboard.</li>
      </ul>
    ),
  },
  {
    id: "refunds",
    n: "07",
    title: "Refund Policy",
    body: (
      <p>
        Refunds, cancellations, transfers, and related matters are governed separately by our{" "}
        <a href="/company/refund" className="font-semibold text-[#2F5D8C] underline underline-offset-2">
          Refund Policy
        </a>
        , which forms part of these Terms by reference.
      </p>
    ),
  },
  {
    id: "training-centre",
    n: "08",
    title: "Physical Training Centre Rules",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Students must respect instructors, staff, and fellow students at all times.</li>
        <li>Equipment and facilities must be handled safely and kept in good condition.</li>
        <li>Safety instructions issued by staff must be followed.</li>
        <li>Abusive language, discrimination, and damage to property are not tolerated.</li>
        <li>Unauthorized recording of classes is prohibited.</li>
        <li>Repeated misconduct may result in removal from the programme without refund.</li>
      </ul>
    ),
  },
  {
    id: "online-rules",
    n: "09",
    title: "Online Learning Rules",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Meeting links, chat, and screen-sharing tools must be used respectfully.</li>
        <li>Harassment, spam, disruption, and impersonation of instructors or students are not allowed.</li>
        <li>Meeting links must never be shared publicly.</li>
        <li>Misuse of AI tools to disrupt or misrepresent participation is prohibited.</li>
      </ul>
    ),
  },
  {
    id: "recordings",
    n: "10",
    title: "Recorded Courses",
    body: (
      <>
        <p>“Lifetime access” means personal, non-transferable access for the purchasing student only.</p>
        <p>Recordings may not be uploaded, sold, rehosted, shared publicly, downloaded via unauthorized tools, redistributed, mirrored, or screen-recorded for resale.</p>
      </>
    ),
  },
  {
    id: "certificates",
    n: "11",
    title: "Certificates & Verification",
    body: (
      <>
        <p>Certificates are issued only after a student satisfies the applicable course completion requirements.</p>
        <p>
          GyanHub reserves the right to reject, revoke, or invalidate any certificate obtained
          through fraud, impersonation, payment fraud, or academic dishonesty.
        </p>
        <p>
          Certificates can be verified publicly at{" "}
          <a href="/certificate" className="font-semibold text-[#2F5D8C] underline underline-offset-2">
            gyanhub.com.np/certificate
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "ip",
    n: "12",
    title: "Intellectual Property",
    body: (
      <p>
        All course videos, recordings, assignments, notes, PDFs, presentations, software
        demonstrations, course structure, logos, branding, graphics, and the GyanHub website
        (including its source code) are owned by GyanHub. Unauthorized copying, reproduction, or
        redistribution of this content is prohibited.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    n: "13",
    title: "Acceptable Use",
    body: (
      <ul className="grid list-disc gap-2 pl-5 sm:grid-cols-2">
        <li>Share accounts</li>
        <li>Use bots or automated scraping</li>
        <li>Hack or reverse engineer the platform</li>
        <li>Upload malware</li>
        <li>Disrupt classes</li>
        <li>Circumvent payment systems</li>
        <li>Copy or resell materials</li>
        <li>Misuse certificates</li>
        <li>Use fake identities</li>
        <li>Attempt unauthorized access</li>
      </ul>
    ),
  },
  {
    id: "community",
    n: "14",
    title: "Community Guidelines",
    body: (
      <>
        <p>These guidelines apply across WhatsApp groups, comment sections, live classes, and email correspondence.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Respect other members of the community.</li>
          <li>No hate speech, harassment, or unsolicited promotion.</li>
          <li>No political or religious abuse.</li>
          <li>Professional behaviour is expected at all times.</li>
        </ul>
      </>
    ),
  },
  {
    id: "third-party",
    n: "15",
    title: "Third-Party Services",
    body: (
      <p>
        GyanHub integrates services including Fonepay, Google Meet, WhatsApp, YouTube, Google
        Maps, Facebook, Instagram, and LinkedIn. Each operates under its own independent terms.
        GyanHub is not responsible for outages, policy changes, or actions of these third-party
        providers.
      </p>
    ),
  },
  {
    id: "privacy",
    n: "16",
    title: "Privacy & Data Protection",
    body: (
      <p>
        Personal information — including name, email, phone number, payment details, course
        activity, and certificate information — is collected and handled in accordance with our{" "}
        <a href="/company/privacy" className="font-semibold text-[#2F5D8C] underline underline-offset-2">
          Privacy Policy
        </a>
        .
      </p>
    ),
  },
  {
    id: "disclaimer",
    n: "17",
    title: "Disclaimer",
    body: (
      <p>
        GyanHub courses are educational in nature. Completion of a course does not guarantee
        employment, promotion, professional licensure, government recognition, income, or
        third-party software certification. Outcomes depend on individual learner effort.
      </p>
    ),
  },
  {
    id: "liability",
    n: "18",
    title: "Limitation of Liability",
    body: (
      <p>
        Except where required by the laws of Nepal, GyanHub is not liable for internet or power
        failures, device issues, third-party service outages, lost profits, indirect damages, or
        disruptions to course schedules arising from circumstances beyond our reasonable control.
      </p>
    ),
  },
  {
    id: "indemnification",
    n: "19",
    title: "Indemnification",
    body: (
      <p>
        If a user's misuse of the platform results in legal claims or losses, that user agrees to
        indemnify and hold GyanHub harmless from any resulting claims, damages, or expenses.
      </p>
    ),
  },
  {
    id: "termination",
    n: "20",
    title: "Suspension & Termination",
    body: (
      <>
        <p>Accounts may be suspended or terminated for fraud, chargebacks, copyright infringement, harassment, payment abuse, fake certificates, or security threats.</p>
        <p>No refunds will be issued where termination results from a violation of these Terms.</p>
      </>
    ),
  },
  {
    id: "changes",
    n: "21",
    title: "Changes to Terms",
    body: (
      <p>
        These Terms may be updated from time to time. The revised version will be posted on this
        page with an updated “Last Updated” date. Continued use of the platform after changes take
        effect constitutes acceptance of the revised Terms.
      </p>
    ),
  },
  {
    id: "governing-law",
    n: "22",
    title: "Governing Law",
    body: (
      <p>
        These Terms are governed by the laws of Nepal. Any disputes arising from or related to
        these Terms are subject to the exclusive jurisdiction of the competent courts of
        Kathmandu, Nepal.
      </p>
    ),
  },
  {
    id: "academic-integrity",
    n: "23",
    title: "Academic Integrity",
    body: (
      <p>
        Plagiarism, cheating, impersonation during assessments, and certificate fraud are strictly
        prohibited and may result in suspension of access and revocation of certificates.
      </p>
    ),
  },
  {
    id: "force-majeure",
    n: "24",
    title: "Force Majeure",
    body: (
      <p>
        GyanHub is not responsible for interruptions caused by earthquakes, floods, government
        restrictions, internet outages, pandemics, civil unrest, power failures, or other events
        beyond our reasonable control.
      </p>
    ),
  },
  {
    id: "entire-agreement",
    n: "25",
    title: "Entire Agreement",
    body: (
      <p>
        These Terms, together with our Refund Policy and Privacy Policy, constitute the entire
        agreement between you and GyanHub regarding your use of the platform.
      </p>
    ),
  },
  {
    id: "contact",
    n: "26",
    title: "Contact Us",
    body: (
      <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#8A93A3]">Company</p>
          <p className="text-[#122033]">Gyan Hub Pvt. Ltd.</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#8A93A3]">Office</p>
          <p className="text-[#122033]">Near Eyeplex Mall, New Baneshwor, Kathmandu, Nepal</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#8A93A3]">Email</p>
          <p className="text-[#122033]">admin@gyanhub.com.np</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#8A93A3]">Phone</p>
          <p className="text-[#122033]">01-4533246</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#8A93A3]">WhatsApp</p>
          <p className="text-[#122033]">9763695665</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#8A93A3]">Website</p>
          <p className="text-[#122033]">gyanhub.com.np</p>
        </div>
      </div>
    ),
  },
];

export default function TermsAndConditionsPage() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-[#1F2937]">
      {/* Blueprint grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#122033 1px, transparent 1px), linear-gradient(90deg, #122033 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Title block header */}
      <header className="relative border-b-[3px] border-[#122033] bg-[#F6F3EC]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:px-10 sm:py-14">
          <div className="flex items-center justify-between">
            <a href="/" className="font-serif text-lg font-bold tracking-tight text-[#122033]">
              GyanHub
            </a>
            <button
              onClick={() => setNavOpen((v) => !v)}
              className="rounded border border-[#122033]/20 px-3 py-1.5 text-xs font-medium text-[#122033] lg:hidden"
              aria-expanded={navOpen}
              aria-controls="clause-index"
            >
              {navOpen ? "Hide index" : "Show index"}
            </button>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9782E]">
              Legal Document · Sheet 01
            </p>
            <h1 className="mt-3 font-serif text-4xl font-bold leading-tight text-[#122033] sm:text-5xl">
              Terms &amp; Conditions
            </h1>
            <p className="mt-3 max-w-2xl text-[#4B5563]">
              Welcome to GyanHub. These Terms govern your access to and use of the GyanHub
              website, mobile services, online courses, physical training programs, recorded
              courses, certificates, and related services. By accessing or using our platform, you
              agree to comply with these Terms.
            </p>
            <p className="mt-4 text-sm text-[#8A93A3]">Last Updated: July 2026</p>
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 sm:px-10 lg:flex-row lg:gap-16">
        {/* Clause index — signature element, sticky title-block rail */}
        <nav
          id="clause-index"
          className={`${navOpen ? "block" : "hidden"} shrink-0 lg:sticky lg:top-10 lg:block lg:h-fit lg:w-64`}
        >
          <div className="rounded-md border border-[#122033]/15 bg-white/60 p-5">
            <p className="mb-4 font-serif text-xs font-bold uppercase tracking-[0.2em] text-[#122033]">
              Clause Index
            </p>
            <ol className="space-y-1 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={() => setNavOpen(false)}
                    className="group flex items-baseline gap-2 rounded px-1.5 py-1 text-[#4B5563] transition-colors hover:bg-[#122033]/5 hover:text-[#122033]"
                  >
                    <span className="font-mono text-xs text-[#C9782E]">{s.n}</span>
                    <span>{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        {/* Clauses */}
        <main className="min-w-0 flex-1 space-y-14">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-10">
              <div className="mb-4 flex items-baseline gap-4 border-b border-[#122033]/15 pb-3">
                <span className="font-mono text-sm text-[#C9782E]">{s.n}</span>
                <h2 className="font-serif text-2xl font-bold text-[#122033]">{s.title}</h2>
              </div>
              <div className="space-y-3 leading-relaxed text-[#374151]">{s.body}</div>
            </section>
          ))}
        </main>
      </div>

      <footer className="border-t border-[#122033]/15 bg-white/40 py-8">
        <div className="mx-auto max-w-6xl px-6 text-sm text-[#8A93A3] sm:px-10">
          Gyan Hub Pvt. Ltd. — Learn Today | Lead Tomorrow. Governed by the laws of Nepal;
          disputes subject to the courts of Kathmandu.
        </div>
      </footer>
    </div>
  );
}