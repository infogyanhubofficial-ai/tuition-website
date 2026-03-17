'use client';

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PostTuitionPage() {
  const [form, setForm] = useState({
    subject: "",
    location: "",
    classLevel: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("vacancies").insert([
      {
        subject: form.subject,
        location: form.location,
        class_level: form.classLevel,
        description: form.description,
      },
    ]);

    if (error) {
      console.error(error);
      setMessage("❌ Error posting tuition");
    } else {
      setMessage("✅ Tuition posted successfully!");
      setForm({
        subject: "",
        location: "",
        classLevel: "",
        description: "",
      });
    }

    setLoading(false);
  };

  return (
    <div className="page-container">
      <h1 className="section-title">Post Tuition Requirement</h1>
      <p className="section-subtitle">
        Find the perfect tutor by posting your requirement.
      </p>

      <form onSubmit={handleSubmit} className="card">
        <input
          name="subject"
          placeholder="Subject (e.g. Math)"
          value={form.subject}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <input
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <input
          name="classLevel"
          placeholder="Class (e.g. Grade 10)"
          value={form.classLevel}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <textarea
          name="description"
          placeholder="Additional details"
          value={form.description}
          onChange={handleChange}
          style={{ ...inputStyle, height: "100px" }}
        />

        <button className="primary-button" disabled={loading}>
          {loading ? "Posting..." : "Post Tuition"}
        </button>

        {message && <p style={{ marginTop: "10px" }}>{message}</p>}
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "10px",
  border: "1px solid #ddd",
};