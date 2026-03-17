'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Vacancy {
  id: number;
  subject: string;
  location: string;
  class_level: string;
  description: string;
}

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVacancies = async () => {
      const { data, error } = await supabase
        .from("vacancies")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("Error fetching vacancies:", error);
      } else {
        setVacancies(data || []);
      }

      setLoading(false);
    };

    fetchVacancies();
  }, []);

  if (loading) {
    return <div className="page-container">Loading vacancies...</div>;
  }

  return (
    <div className="page-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 className="section-title">Available Tuition Vacancies</h1>
          <p className="section-subtitle">
            Browse tuition requests posted by parents and students.
          </p>
        </div>

        <Link href="/post-tuition" className="primary-button">
          + Post Tuition
        </Link>
      </div>

      {vacancies.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <h3>No vacancies found</h3>
          <p>No tuition requests have been posted yet.</p>
        </div>
      ) : (
        <div className="card-grid">
          {vacancies.map((vacancy) => (
            <div key={vacancy.id} className="card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "45px",
                    height: "45px",
                    borderRadius: "50%",
                    backgroundColor: "#16a34a",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    marginRight: "12px",
                  }}
                >
                  {vacancy.subject.charAt(0).toUpperCase()}
                </div>

                <h3 style={{ margin: 0 }}>{vacancy.subject}</h3>
              </div>

              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "#dcfce7",
                  color: "#166534",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  marginBottom: "10px",
                }}
              >
                {vacancy.class_level}
              </span>

              <p><strong>📍 Location:</strong> {vacancy.location}</p>
              <p><strong>📝 Details:</strong> {vacancy.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}