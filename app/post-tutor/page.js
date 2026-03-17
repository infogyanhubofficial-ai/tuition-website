'use client';  // Make sure this is a Client Component

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // to handle navigation
import { supabase } from '../../lib/supabase'; // Import supabase client

export default function TutorProfilePage() {
  const [tutor, setTutor] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = router.query;  // Get the dynamic id from the URL

  // Fetch tutor details by ID when the page loads
  useEffect(() => {
    if (id) {
      const fetchTutor = async () => {
        const { data, error } = await supabase
          .from('tutors')
          .select('*')
          .eq('id', id)
          .single(); // `.single()` to fetch just one row
        
        if (error) {
          setError('Failed to fetch tutor data');
        } else {
          setTutor(data);
        }
      };

      fetchTutor();
    }
  }, [id]);

  if (error) {
    return <p>{error}</p>;
  }

  if (!tutor) {
    return <p>Loading...</p>;
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