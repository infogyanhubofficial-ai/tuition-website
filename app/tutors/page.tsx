'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Tutor {
  id: string | number;
  name: string;
  subject: string;
  location: string;
  experience: string | number;
}

export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      const { data, error } = await supabase.from("tutors").select("*");

      if (error) {
        console.error("Error fetching tutors:", error);
      } else {
        setTutors(data || []);
      }

      setLoading(false);
    };

    fetchTutors();
  }, []);

  const filteredTutors = tutors.filter((tutor) =>
    tutor.subject.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="page-container">Loading...</div>;
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
          <h1 className="section-title">Find Your Perfect Tutor</h1>
          <p className="section-subtitle">
            Browse experienced tutors by subject, location, and experience.
          </p>
        </div>

        <Link href="/post-tutor" className="primary-button">
          + Become a Tutor
        </Link>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="🔍 Search tutors by subject (e.g. Math, Science)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            fontSize: "16px",
            outline: "none",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        />
      </div>

      {filteredTutors.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <h3>No tutors found 😔</h3>
          <p>Try searching for a different subject.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filteredTutors.map((tutor) => (
            <div key={tutor.id} className="card">
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
                    backgroundColor: "#2563eb",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    marginRight: "12px",
                  }}
                >
                  {tutor.name.charAt(0).toUpperCase()}
                </div>

                <h3 style={{ margin: 0 }}>{tutor.name}</h3>
              </div>

              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "#e0ecff",
                  color: "#2563eb",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  marginBottom: "10px",
                }}
              >
                {tutor.subject}
              </span>

              <p><strong>📍 Location:</strong> {tutor.location}</p>
              <p><strong>🎯 Experience:</strong> {tutor.experience} years</p>

              <Link href={`/tutors/${tutor.id}`} className="primary-button">
                View Profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}