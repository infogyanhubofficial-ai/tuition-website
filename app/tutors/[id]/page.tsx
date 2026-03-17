'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Tutor {
  id: number;
  name: string;
  subject: string;
  location: string;
  experience: string | number;
  bio?: string;
}

export default function TutorProfilePage() {
  const params = useParams();
  const id = params?.id;

  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchTutor = async () => {
      if (!id) {
        setErrorMsg("Tutor ID not found in URL.");
        setLoading(false);
        return;
      }

      const tutorId = Array.isArray(id) ? id[0] : id;

      const { data, error } = await supabase
        .from("tutors")
        .select("*")
        .eq("id", Number(tutorId))
        .single();

      if (error) {
        console.error("Supabase error:", error);
        setErrorMsg(error.message);
        setTutor(null);
      } else {
        setTutor(data);
      }

      setLoading(false);
    };

    fetchTutor();
  }, [id]);

  if (loading) {
    return <div className="page-container">Loading profile...</div>;
  }

  if (errorMsg) {
    return <div className="page-container">Error: {errorMsg}</div>;
  }

  if (!tutor) {
    return <div className="page-container">Tutor not found.</div>;
  }

  return (
    <div className="page-container">
      <Link
        href="/tutors"
        className="primary-button"
        style={{ marginBottom: "16px" }}
      >
        ← Back to Tutors
      </Link>

      <div className="card">
        <h1 className="section-title">{tutor.name}</h1>
        <p><strong>Subject:</strong> {tutor.subject}</p>
        <p><strong>Location:</strong> {tutor.location}</p>
        <p><strong>Experience:</strong> {tutor.experience} years</p>
        {tutor.bio && <p><strong>About:</strong> {tutor.bio}</p>}

        <button className="primary-button">Contact Tutor</button>
      </div>
    </div>
  );
}