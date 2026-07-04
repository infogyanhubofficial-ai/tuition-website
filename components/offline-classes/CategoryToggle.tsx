"use client";

import { Briefcase, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import type { ClassCategory } from "@/types/physical-class";
import { CATEGORY_THEME } from "@/lib/format";

interface CategoryToggleProps {
  active: ClassCategory;
  onChange: (category: ClassCategory) => void;
  counts: Record<ClassCategory, number>;
}

const OPTIONS = [
  { key: "Professional Training" as ClassCategory, icon: Briefcase },
  { key: "University Subjects" as ClassCategory, icon: GraduationCap },
];

export default function CategoryToggle({
  active,
  onChange,
  counts,
}: CategoryToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-gray-200 bg-white p-1">
      {OPTIONS.map(({ key, icon: Icon }) => {
        const activeTab = active === key;
        const theme = CATEGORY_THEME[key];

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="relative flex items-center gap-2 rounded-full px-5 py-2 overflow-hidden"
          >
            {activeTab && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: theme.accent }}
              />
            )}

            <div className="relative z-10 flex items-center gap-2">
              <Icon
                size={15}
                color={activeTab ? "white" : "black"}
              />

              <span
                style={{
                  color: activeTab ? "white" : "black",
                }}
              >
                {key}
              </span>

              <span
                className="rounded-full bg-black/10 px-2 py-0.5 text-xs"
                style={{
                  color: activeTab ? "white" : "black",
                }}
              >
                {counts[key]}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}