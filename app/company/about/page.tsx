"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, animate, useScroll, useTransform, type Variants } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Target,
  Compass,
  Award,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users2,
  Building2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Self-contained data — no shared /lib imports, per GyanHub convention */
/* ------------------------------------------------------------------ */

type SocialLink = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const brandIcon = {
  facebook: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.015 3.015 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.96-.5 3.96-1.74 5.46-1.34 1.62-3.4 2.58-5.5 2.55-2.52-.03-4.9-1.55-5.9-3.87-.9-2.09-.76-4.63.45-6.58 1.25-2.02 3.65-3.3 6-3.26.11 0 .22 0 .33.01v4.09c-1.43-.1-2.91.47-3.82 1.56-.84 1-1.1 2.45-.63 3.68.42 1.1 1.48 1.88 2.67 2.01 1.16.12 2.37-.2 3.18-1.02.81-.82 1.25-1.97 1.25-3.13V.02z" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
};

type Founder = {
  name: string;
  initials: string;
  title: string;
  discipline: string;
  photo: string;
  since: string;
  bio: string;
  quote: string;
  phone: string;
  socials: SocialLink[];
};

const founders: Founder[] = [
  {
    name: "Er. Nischal Subedi",
    initials: "NS",
    title: "Founder & Chief Executive Officer",
    discipline: "Geomatics Engineer",
    photo:
      "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Founder1.webp",
    since: "Leading GyanHub since 2024",
    bio: "Nischal conceived GyanHub in November 2024, then built it from a single online training batch into a platform that has trained thousands of Nepali engineers — leading strategy, growth, and the organization's day-to-day direction ever since.",
    quote:
      "अवसर तपाईंलाई खोज्दै आउँदैन, त्यसलाई सिर्जना गर्ने सीप आफैं निर्माण गर्नुपर्छ। सिक्न कहिल्यै नडराउनुहोस्, आफूमाथि विश्वास राख्नुहोस्—किनकि सिक्ने साहस गर्नेहरूको लागि यो संसार नै सम्भावनाको विशाल मञ्च हो।",
    phone: "9763695665",
    socials: [
      { label: "Facebook", href: "https://www.facebook.com/nischal.subedi.758/", icon: brandIcon.facebook },
      { label: "Instagram", href: "https://www.instagram.com/_nischal_subedi_/", icon: brandIcon.instagram },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/nischal-subedi-14927b1a7/", icon: brandIcon.linkedin },
    ],
  },
  {
    name: "Er. Dipesh Shah",
    initials: "DS",
    title: "Co-Founder & Managing Director",
    discipline: "Civil Engineer",
    photo:
      "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Founder2.webp",
    since: "Leading GyanHub since 2026",
    bio: "Dipesh joined GyanHub in July 2026, bringing shared conviction that education should be accessible, interactive, and career-focused — strengthening operations and learning experience as the platform opened its first physical training center.",
    quote:
      "हामीले निर्माण गर्ने प्रत्येक पुल, प्रत्येक भवन र प्रत्येक नवप्रवर्तनले हाम्रो राष्ट्रको भविष्य निर्माण गर्छ। नेपाललाई डिजाइन गर्ने, निर्माण गर्ने र प्रेरणा दिने सम्पूर्ण पेशेवरहरूको यात्रामा साथ दिनु नै हाम्रो सबैभन्दा ठूलो जिम्मेवारी हो।",
    phone: "9714568857",
    socials: [
      { label: "Facebook", href: "https://www.facebook.com/dipesh.shah.163922", icon: brandIcon.facebook },
      { label: "Instagram", href: "https://www.instagram.com/_dipesh_b_shah/", icon: brandIcon.instagram },
    ],
  },
];

type TimelineItem = {
  date: string;
  title: string;
  description: string;
};

const timeline: TimelineItem[] = [
  { date: "NOV 2024", title: "The vision", description: "Er. Nischal Subedi conceives GyanHub — a platform to bridge classroom theory and job-ready engineering skill." },
  { date: "JAN 2025", title: "Online training launches", description: "GyanHub's first professional training programs go live for engineering students across Nepal." },
  { date: "MAR 2025", title: "First 500 students", description: "Within three months of launch, the learning community crosses 500 students." },
  { date: "APR 2025", title: "Company registered", description: "GyanHub Pvt. Ltd. is formally registered, with a remote branch established at Gatthaghar, Bhaktapur." },
  { date: "EARLY 2026", title: "2,000 students milestone", description: "Within its first year of operation, GyanHub serves more than 2,000 students." },
  { date: "JUL 2026", title: "Physical center opens", description: "GyanHub establishes its first physical training center near Eyeplex Mall, New Baneshwor, Kathmandu." },
];

const objectives: { title: string; description: string }[] = [
  {
    title: "Transform knowledge into real-world skills through practical, career-focused education.",
    description: "We believe education creates true value only when learning can be applied with confidence in the real world.",
  },
  {
    title: "Connect learners with educators, industry experts, and opportunities that inspire lifelong growth.",
    description: "Learning is strengthened through mentorship, collaboration, and meaningful professional connections.",
  },
  {
    title: "Build an innovative learning community that empowers individuals, strengthens professions, and creates a better future.",
    description: "Together, we cultivate knowledge, skills, leadership, and opportunities that positively impact both individuals and society.",
  },
];

const values: { icon: React.ReactNode; title: string; description: string }[] = [
  { icon: <Users2 className="h-5 w-5" />, title: "Student First", description: "Every learner's success is at the heart of everything we do." },
  { icon: <ShieldCheck className="h-5 w-5" />, title: "Integrity", description: "We lead with honesty, transparency, and ethical guidance in every interaction." },
  { icon: <Award className="h-5 w-5" />, title: "Excellence", description: "We pursue excellence by continuously improving our learning experiences, services, and outcomes." },
  { icon: <Sparkles className="h-5 w-5" />, title: "Innovation", description: "We embrace innovation to make learning more practical, engaging, and future-ready." },
  { icon: <TrendingUp className="h-5 w-5" />, title: "Growth", description: "We foster a culture of continuous learning, empowering our students, educators, and team to grow together." },
  { icon: <Target className="h-5 w-5" />, title: "Impact", description: "We measure our success by the positive impact we create in the lives, careers, and communities we serve." },
];

const connectLinks: SocialLink[] = [
  { label: "Facebook", href: "https://www.facebook.com/dashboard.php?id=61569757534336", icon: brandIcon.facebook },
  { label: "Instagram", href: "https://www.instagram.com/gyanhubonline/?next=%2F", icon: brandIcon.instagram },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/gyanhub/", icon: brandIcon.linkedin },
  { label: "YouTube", href: "https://www.youtube.com/@GyanHubOnline", icon: brandIcon.youtube },
  { label: "TikTok", href: "https://www.tiktok.com/@gyanhubofficial", icon: brandIcon.tiktok },
  { label: "WhatsApp", href: "https://wa.me/9779763695665", icon: brandIcon.whatsapp },
];

const MAP_URL =
  "https://www.google.com/maps/place/Gyan+Hub+Pvt.+Ltd/@27.6920528,85.3336796,17z/data=!3m1!4b1!4m6!3m5!1s0x39eb1990925a6f83:0xaec6838aa0bdb23d!8m2!3d27.6920528!4d85.3362545!16s%2Fg%2F11nqx_l7r9?entry=ttu&g_ep=EgoyMDI2MDYyOS4wIKXMDSoASAFQAw%3D%3D";

const stats: { to: number; suffix: string; label: string; plain?: boolean }[] = [
  { to: 2400, suffix: "+", label: "Students Trained" },
  { to: 2025, suffix: "", label: "Company Registered", plain: true },
  { to: 2, suffix: "", label: "Founders" },
  { to: 1, suffix: "", label: "Physical Training Center" },
];

/* ------------------------------------------------------------------ */
/*  Shared primitives                                                 */
/* ------------------------------------------------------------------ */

function CornerTicks({ className = "" }: { className?: string }) {
  return (
    <>
      <span className={`pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-current opacity-40 ${className}`} />
      <span className={`pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-current opacity-40 ${className}`} />
      <span className={`pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-current opacity-40 ${className}`} />
      <span className={`pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-current opacity-40 ${className}`} />
    </>
  );
}

function Eyebrow({ children, tone = "orange" }: { children: React.ReactNode; tone?: "orange" | "light" }) {
  return (
    <div
      className={`inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] ${
        tone === "orange" ? "text-orange-500" : "text-blue-200"
      }`}
    >
      <span className={`h-px w-6 ${tone === "orange" ? "bg-orange-500" : "bg-blue-200"}`} />
      {children}
    </div>
  );
}

function Counter({ to, suffix = "", plain = false }: { to: number; suffix?: string; plain?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref}>
      {plain ? value : value.toLocaleString()}
      {suffix}
    </span>
  );
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

/* ------------------------------------------------------------------ */
/*  Journey timeline with self-drawing dimension line                  */
/* ------------------------------------------------------------------ */

const ADDRESS_PHRASE = "Eyeplex Mall, New Baneshwor, Kathmandu";

function linkifyAddress(text: string): React.ReactNode {
  const idx = text.indexOf(ADDRESS_PHRASE);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <a
        href={MAP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-dotted underline-offset-2 hover:text-blue-700"
      >
        {ADDRESS_PHRASE}
      </a>
      {text.slice(idx + ADDRESS_PHRASE.length)}
    </>
  );
}

function JourneyTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.4"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div ref={containerRef} className="relative mx-auto max-w-3xl pl-8">
      <div className="absolute left-0 top-0 h-full w-px bg-blue-100" />
      <motion.div
        style={{ height: lineHeight }}
        className="absolute left-0 top-0 w-px bg-gradient-to-b from-orange-500 to-blue-600"
      />
      <ol className="space-y-10">
        {timeline.map((item, idx) => (
          <motion.li
            key={idx}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative"
          >
            <span className="absolute -left-[34px] top-1 h-3 w-3 -translate-x-1/2 rotate-45 border border-[#0B1B3A] bg-orange-500" />
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-blue-600">{item.date}</div>
            <h3 className="mt-1 font-display text-lg font-semibold text-[#0B1B3A]">{item.title}</h3>
            <p className="mt-1 max-w-xl leading-relaxed text-slate-600">{linkifyAddress(item.description)}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <style>{`
        @keyframes gh-drift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .gh-hero-bg {
          background: linear-gradient(120deg, #0B1B3A, #12234a, #1E3A8A, #0B1B3A);
          background-size: 300% 300%;
          animation: gh-drift 18s ease infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .gh-hero-bg { animation: none; }
        }
      `}</style>

      {/* ---------------------------------------------------------- */}
      {/* Hero — cinematic, drafting title block                     */}
      {/* ---------------------------------------------------------- */}
      <header className="gh-hero-bg relative overflow-hidden px-6 py-28 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="relative mx-auto max-w-4xl text-center"
        >
          <motion.div variants={fadeUp} className="mb-6 flex justify-center">
            <div className="relative border border-dashed border-white/30 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-blue-200">
              <CornerTicks />
              Project: GyanHub &nbsp;·&nbsp; Est. 2024 &nbsp;·&nbsp; Kathmandu, NP
            </div>
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Engineering education.
            <br />
            <span className="text-orange-400">Reimagined.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-xl text-lg text-blue-200">
            From one idea to thousands of engineers. One mission remains: make learning practical
            enough to matter.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-14 flex justify-center">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="h-8 w-5 rounded-full border border-white/30"
            >
              <div className="mx-auto mt-1.5 h-1.5 w-1 rounded-full bg-white/60" />
            </motion.div>
          </motion.div>
        </motion.div>
      </header>

      {/* ---------------------------------------------------------- */}
      {/* Living numbers                                              */}
      {/* ---------------------------------------------------------- */}
      <section className="bg-[#0B1B3A] px-6 py-14 text-white">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={stagger}
          className="mx-auto grid max-w-5xl grid-cols-2 gap-8 text-center md:grid-cols-4"
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp}>
              <div className="font-display text-4xl font-bold text-orange-400 md:text-5xl">
                <Counter to={s.to} suffix={s.suffix} plain={s.plain} />
              </div>
              <div className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-blue-200">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <main className="mx-auto max-w-6xl space-y-24 px-6 py-20">
        {/* ---------------------------------------------------------- */}
        {/* Who we are                                                  */}
        {/* ---------------------------------------------------------- */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          className="mx-auto max-w-3xl text-center"
        >
          <Eyebrow>Who we are</Eyebrow>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Founded in Kathmandu, GyanHub is an education-focused platform built to close the gap
            between classroom theory and job-ready engineering skill. What began as a handful of
            online training sessions in January 2025 has grown into a hybrid platform combining
            self-paced online courses, live classes, and hands-on physical training —
            trusted by thousands of learners across Nepal.
          </p>
        </motion.section>

        {/* ---------------------------------------------------------- */}
        {/* Slogan break                                                */}
        {/* ---------------------------------------------------------- */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          variants={fadeUp}
          className="relative mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white px-8 py-16 text-center"
        >
          <CornerTicks className="text-blue-300" />
          <p className="mx-auto max-w-2xl font-display text-3xl font-bold leading-snug text-[#0B1B3A] md:text-4xl">
            Learn Today <span className="text-orange-500">|</span> Lead Tomorrow
          </p>
          <div className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-blue-600">
            Creating leaders in the engineering sector
          </div>
        </motion.section>

        {/* ---------------------------------------------------------- */}
        {/* Vision & Mission                                            */}
        {/* ---------------------------------------------------------- */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          <motion.section variants={fadeUp} className="relative rounded-2xl border border-slate-200 bg-white p-8">
            <CornerTicks className="text-blue-400" />
            <Compass className="h-6 w-6 text-blue-600" />
            <h3 className="mt-4 font-display text-xl font-semibold text-[#0B1B3A]">Our Vision</h3>
            <p className="mt-3 leading-relaxed text-slate-600">
              To be Nepal&apos;s premier central hub for engineering education — empowering learners,
              educators, and institutions alike.
            </p>
          </motion.section>
          <motion.section variants={fadeUp} className="relative rounded-2xl border border-slate-200 bg-white p-8">
            <CornerTicks className="text-orange-400" />
            <Target className="h-6 w-6 text-orange-500" />
            <h3 className="mt-4 font-display text-xl font-semibold text-[#0B1B3A]">Our Mission</h3>
            <p className="mt-3 leading-relaxed text-slate-600">
              To bridge the gap between learners, tutors, and employers — creating a seamless,
              practical, and career-focused learning ecosystem.
            </p>
          </motion.section>
        </motion.div>

        {/* ---------------------------------------------------------- */}
        {/* Timeline — self-drawing dimension line                      */}
        {/* ---------------------------------------------------------- */}
        <section>
          <div className="mb-12 text-center">
            <Eyebrow>The journey</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-bold text-[#0B1B3A]">The GyanHub Timeline</h2>
          </div>
          <JourneyTimeline />
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Founders — alternating layout                               */}
        {/* ---------------------------------------------------------- */}
        <section>
          <div className="mb-14 text-center">
            <Eyebrow>Leadership</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-bold text-[#0B1B3A]">Meet the Founders</h2>
          </div>

          <div className="space-y-16">
            {founders.map((founder, idx) => (
              <motion.article
                key={founder.name}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeUp}
                className={`grid grid-cols-1 items-center gap-10 md:grid-cols-5 ${
                  idx % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="md:col-span-2">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="relative overflow-hidden rounded-2xl border border-slate-200"
                  >
                    <img src={founder.photo} alt={founder.name} className="aspect-[4/5] w-full object-cover" />
                    <div className="absolute bottom-3 right-3 h-10 w-10 overflow-hidden rounded-full border border-white/40 backdrop-blur">
                      <img src={founder.photo} alt="" className="h-full w-full object-cover" />
                    </div>
                  </motion.div>
                </div>

                <div className="md:col-span-3">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-orange-500">{founder.title}</p>
                  <h3 className="mt-1 font-display text-2xl font-bold text-[#0B1B3A]">{founder.name}</h3>
                  <span className="mt-2 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-blue-700">
                    {founder.discipline}
                  </span>
                  <p className="mt-2 text-sm text-slate-400">{founder.since}</p>

                  <p className="mt-4 leading-relaxed text-slate-600">{founder.bio}</p>

                  <blockquote className="relative mt-6 border-l-2 border-orange-400 pl-4 font-display italic text-[#0B1B3A]">
                    &ldquo;{founder.quote}&rdquo;
                  </blockquote>

                  <div className="mt-6 flex gap-2">
                    <a
                      href={`tel:${founder.phone}`}
                      aria-label={`Call ${founder.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-[#0B1B3A] transition-colors hover:bg-[#0B1B3A] hover:text-white"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                    {founder.socials.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-[#0B1B3A] transition-colors hover:bg-[#0B1B3A] hover:text-white"
                      >
                        {s.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Objectives                                                  */}
        {/* ---------------------------------------------------------- */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          <div className="mb-10 text-center">
            <Eyebrow>Objectives</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-bold text-[#0B1B3A]">What we&apos;re working toward</h2>
          </div>
          <div className="space-y-4">
            {objectives.map((obj, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-start sm:gap-6"
              >
                <span className="inline-flex w-fit shrink-0 items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1 font-mono text-xs text-blue-700">
                  OBJ.{String(idx + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-display text-lg font-semibold text-[#0B1B3A]">{obj.title}</p>
                  <p className="mt-1 text-slate-600">{obj.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ---------------------------------------------------------- */}
        {/* Values                                                      */}
        {/* ---------------------------------------------------------- */}
        <section>
          <div className="mb-10 text-center">
            <Eyebrow>What we stand for</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-bold text-[#0B1B3A]">Core Values</h2>
          </div>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {values.map((v) => (
              <motion.div
                key={v.title}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1B3A] text-white">
                  {v.icon}
                </div>
                <h3 className="mt-4 font-display font-semibold text-[#0B1B3A]">{v.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{v.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Behind the Blueprint — signature dark section                */}
        {/* ---------------------------------------------------------- */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="relative overflow-hidden rounded-2xl bg-[#0B1B3A] px-8 py-20 text-white md:px-16"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="relative mx-auto max-w-2xl text-center">
            <Eyebrow tone="light">Behind the Blueprint</Eyebrow>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
              Every great learning experience begins with a clear vision before it becomes a
              meaningful lesson.
            </h2>
            <p className="mt-5 text-blue-200">
              At GyanHub, every course is thoughtfully designed with one purpose — to help
              learners gain practical skills that create real opportunities. We believe education
              should be student-centered, application-driven, and built on trust.
            </p>
            <p className="mt-4 text-blue-200">
              Student-first. Practical over theoretical. Proven over promised. These are not just
              principles we display — they are the foundation of every program we create.
            </p>
            <div className="mt-10 flex justify-center gap-6">
              {founders.map((founder) => (
                <div
                  key={founder.name}
                  className="h-16 w-16 overflow-hidden rounded-full border border-white/20"
                  title={founder.name}
                >
                  <img src={founder.photo} alt={founder.name} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ---------------------------------------------------------- */}
        {/* Company details + contact                                  */}
        {/* ---------------------------------------------------------- */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          <div className="relative rounded-2xl border border-slate-200 bg-white p-8">
            <CornerTicks className="text-blue-400" />
            <div className="flex items-center gap-2 text-[#0B1B3A]">
              <Building2 className="h-5 w-5" />
              <h3 className="font-display text-lg font-semibold">Company Details</h3>
            </div>
            <dl className="mt-6 space-y-3 font-mono text-sm text-slate-600">
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <dt>Registration No.</dt>
                <dd className="text-slate-900">363467/81/82</dd>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <dt>PAN</dt>
                <dd className="text-slate-900">622327826</dd>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <dt>Category</dt>
                <dd className="text-slate-900">Education</dd>
              </div>
              <div className="flex justify-between gap-4 pb-2">
                <dt className="shrink-0">Location</dt>
                <dd className="text-right text-slate-900">
                  <a href={MAP_URL} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-blue-700">
                    Near Eyeplex Mall, New Baneshwor, Kathmandu
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl bg-[#0B1B3A] p-8 text-white">
            <h3 className="font-display text-lg font-semibold">Get in touch</h3>
            <div className="mt-6 space-y-3">
              <a href="mailto:admin@gyanhub.com.np" className="flex items-center gap-3 text-blue-100 hover:text-white">
                <Mail className="h-4 w-4" /> admin@gyanhub.com.np
              </a>
              <a href="tel:9763695665" className="flex items-center gap-3 text-blue-100 hover:text-white">
                <Phone className="h-4 w-4" /> +977 9763695665
              </a>
              <div className="flex items-center gap-3 text-blue-100">
                <MapPin className="h-4 w-4" /> New Baneshwor, Kathmandu
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {connectLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ---------------------------------------------------------- */}
        {/* Closing / CTA                                               */}
        {/* ---------------------------------------------------------- */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          variants={fadeUp}
          className="rounded-2xl bg-gradient-to-br from-[#0B1B3A] to-[#1E3A8A] px-8 py-16 text-center text-white"
        >
          <p className="mx-auto max-w-xl font-display text-xl leading-relaxed text-blue-100 md:text-2xl">
            Every engineer starts with curiosity. Every career starts with one decision.
          </p>
          <h2 className="mt-4 font-display text-2xl font-bold md:text-3xl">
            Thank you for letting GyanHub be part of yours.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <details className="group relative">
  <summary className="inline-flex list-none cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600 [&::-webkit-details-marker]:hidden">
    Explore Courses
    <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
  </summary>
  
  {/* Added shadow-2xl so the box stands out better against the white section below */}
  <div className="absolute left-1/2 z-10 mt-2 w-56 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-2xl">
    
    {/* Added !text-slate-900 to force the dark text color and punch through the section's text-white rule */}
    <a href="/onlinecourse" className="block px-4 py-3 text-sm font-medium !text-slate-900 transition-colors hover:bg-slate-100">
      Online Classes
    </a>
    <a href="/offline-class" className="block px-4 py-3 text-sm font-medium !text-slate-900 transition-colors hover:bg-slate-100">
      Physical Classes
    </a>
    <a href="/recording" className="block px-4 py-3 text-sm font-medium !text-slate-900 transition-colors hover:bg-slate-100">
      Recordings
    </a>
    
  </div>
</details>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Visit the Training Center
            </a>
            <a
              href="/company/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Talk to Us
            </a>
          </div>
        </motion.section>
      </main>
    </div>
  );
}