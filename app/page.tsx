'use client'; // Client Component

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // Importing Supabase

export default function Home() {
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [topTutors, setTopTutors] = useState<any[]>([]);
  const [showVacancies, setShowVacancies] = useState(true);
  const [showTopTutors, setShowTopTutors] = useState(true);

  useEffect(() => {
    const fetchVacancies = async () => {
      const { data, error } = await supabase
        .from("vacancies")
        .select("id, subject, location, class_level, created_at")
        .limit(3)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching vacancies:", error);
      } else {
        setVacancies(data || []);
      }
    };

    const fetchTopTutors = async () => {
      const { data, error } = await supabase
        .from("tutors")
        .select("id, name, subject, experience, location")
        .limit(3); // Fetch top 3 tutors

      if (error) {
        console.error("Error fetching tutors:", error);
      } else {
        setTopTutors(data || []);
      }
    };

    fetchVacancies();
    fetchTopTutors();
  }, []);

  const handleVacancyClose = () => setShowVacancies(false);
  const handleTopTutorClose = () => setShowTopTutors(false);

  return (
    <div className="page-container" style={{ paddingTop: "60px", paddingBottom: "60px" }}>
      
      {/* Hero Section with Glassmorphism */}
      <div
        className="card"
        style={{
          textAlign: "center",
          padding: "50px 30px",
          marginBottom: "30px",
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1 className="section-title" style={{ color: "#2563eb" }}>
          Welcome to GyanHub Pvt. Ltd
        </h1>
        <p className="section-subtitle" style={{ color: "#6b7280" }}>
          Find trusted tutors or post your tuition requirement in minutes.
          <br />
          शिक्षकमान्य शिक्षक खोज्नुहोस् वा ट्यूशन पोस्ट गर्न अब झन् सजिलो!
        </p>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <Link href="/tutors" className="primary-button" style={{ backgroundColor: "#2563eb" }}>
            Browse Tutors
            <br />
            शिक्षक खोज्नुहोस्
          </Link>

          <Link
            href="/post-tuition"
            className="primary-button"
            style={{ border: "2px solid #2563eb", backgroundColor: "transparent" }}
          >
            Post Tuition
            <br />
            ट्यूशन पोस्ट गर्नुहोस्
          </Link>
        </div>
      </div>

      {/* Banner Image */}
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <img
          src="/images/homepic.png"
          alt="GyanHub Tuition Banner"
          style={{
            width: "100%",
            borderRadius: "10px",
            maxHeight: "400px",
            objectFit: "cover",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
          }}
        />
      </div>

      {/* Floating Vacancies */}
      {showVacancies && vacancies.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: "120px",
            right: "20px",
            backgroundColor: "#2563eb",
            color: "white",
            padding: "15px",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            width: "220px", // Smaller width
            textAlign: "center",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          <h3>Latest Vacancies</h3>
          <button
            onClick={handleVacancyClose}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: "18px",
              cursor: "pointer",
              position: "absolute",
              top: "10px",
              right: "10px",
            }}
          >
            ×
          </button>
          {vacancies.map((vacancy) => (
            <div key={vacancy.id} style={{ marginTop: "10px", backgroundColor: "#fff", padding: "10px", borderRadius: "8px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
              <p style={{ color: "black" }}><strong>{vacancy.subject}</strong></p>
              <p style={{ color: "black" }}>{vacancy.location}</p>
              <p style={{ color: "black" }}>Class: {vacancy.class_level}</p>
              <Link href={`/vacancies`} style={{ color: "white", textDecoration: "underline" }}>View All</Link>
            </div>
          ))}
          <Link href="/vacancies" style={{ color: "white", textDecoration: "underline", marginTop: "15px", display: "block" }}>View All Vacancies</Link>
        </div>
      )}

      {/* Floating Top Tutors */}
      {showTopTutors && topTutors.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: "120px",
            left: "20px",
            backgroundColor: "#2563eb",
            color: "white",
            padding: "15px",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            width: "220px", // Smaller width
            textAlign: "center",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          <h3>Top Tutors</h3>
          <button
            onClick={handleTopTutorClose}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: "18px",
              cursor: "pointer",
              position: "absolute",
              top: "10px",
              right: "10px",
            }}
          >
            ×
          </button>
          {topTutors.map((tutor) => (
            <div key={tutor.id} style={{ marginTop: "10px", backgroundColor: "#fff", padding: "10px", borderRadius: "8px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
              <p style={{ color: "black" }}><strong>{tutor.name}</strong></p>
              <p style={{ color: "black" }}>{tutor.subject}</p>
              <p style={{ color: "black" }}>{tutor.experience} years experience</p>
              <p style={{ color: "black" }}>{tutor.location}</p> {/* Add location */}
              <Link href={`/tutors/${tutor.id}`} style={{ color: "white", textDecoration: "underline" }}>View Profile</Link>
            </div>
          ))}
          <Link href="/tutors" style={{ color: "white", textDecoration: "underline", marginTop: "15px", display: "block" }}>View All Tutors</Link>
        </div>
      )}

      {/* Info Section */}
      <div className="card" style={{ textAlign: "center", marginTop: "40px" }}>
        <h2 style={{ marginBottom: "10px" }}>Why GyanHub?</h2>
        <p style={{ color: "#6b7280" }}>
          Find the perfect tutor or your next teaching opportunity in just a few clicks. GyanHub is designed for speed and effectiveness, providing a high-performance marketplace for modern education.
        </p>
      </div>

    </div>
  );
}