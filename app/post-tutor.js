import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function PostTutorPage() {
  // State for the form inputs
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    // Insert new tutor profile into the "tutors" table
    const { data, error } = await supabase
      .from('tutors')
      .insert([
        {
          name,
          subject,
          location,
          experience: parseInt(experience),
        },
      ]);

    if (error) {
      setError(error.message);
    } else {
      // Clear the form
      setName('');
      setSubject('');
      setLocation('');
      setExperience('');
      alert('Tutor profile created successfully!');
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Create Tutor Profile</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Experience (years)</label>
          <input
            type="number"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
}