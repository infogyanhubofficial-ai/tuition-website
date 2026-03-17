'use client';  // This ensures the page is treated as a Client Component

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';  // Use useParams for fetching dynamic ID from URL
import { supabase } from '../../lib/supabase'; // Import supabase client

export default function TutorProfilePage() {
  const { id } = useParams();  // Get the dynamic `id` from the URL using useParams
  const [tutor, setTutor] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch tutor details by ID when the page loads
  useEffect(() => {
    if (id) {
      const fetchTutor = async () => {
        try {
          const { data, error } = await supabase
            .from('tutors')
            .select('*')
            .eq('id', id)
            .single(); // `.single()` to fetch just one row

          if (error) throw error;  // If there's an error, throw it to catch below

          setTutor(data);  // Set the tutor data
        } catch (error) {
          setError('Failed to fetch tutor data');
        } finally {
          setLoading(false);  // Set loading to false once data is fetched
        }
      };

      fetchTutor();
    }
  }, [id]);  // Re-run the effect if `id` changes

  if (loading) {
    return <p>Loading...</p>;  // Display loading text while fetching data
  }

  if (error) {
    return <p>{error}</p>;  // Display error message if fetching failed
  }

  if (!tutor) {
    return <p>No tutor found!</p>;  // If no tutor found, show this message
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>{tutor.name}'s Profile</h1>
      <p><strong>Subject:</strong> {tutor.subject}</p>
      <p><strong>Location:</strong> {tutor.location}</p>
      <p><strong>Experience:</strong> {tutor.experience} years</p>
      <p><strong>About:</strong> {tutor.bio || "No bio available"}</p>

      <button
        onClick={() => window.location.href = '/post-tutor'}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          marginTop: '20px'
        }}
      >
        Contact Tutor
      </button>
    </div>
  );
}