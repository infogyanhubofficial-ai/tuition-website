export default function VacancyDetailsPage() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Class 8 Math Tutor Needed</h1>
      <p><strong>Location:</strong> Kathmandu</p>
      <p><strong>Salary:</strong> NPR 10,000/month</p>
      <p><strong>Days:</strong> 4 days a week</p>
      <p><strong>Time:</strong> Evening</p>
      <p><strong>Description:</strong> Looking for an experienced math tutor for a Class 8 student.</p>

      <button style={{ marginTop: "20px", padding: "10px 16px" }}>
        <form style={{ marginTop: "20px" }}>
  <h2>Apply for this Tuition</h2>

  <input
    type="text"
    placeholder="Your Name"
    style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }}
  />

  <input
    type="text"
    placeholder="Phone Number"
    style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }}
  />

  <textarea
    placeholder="Your message"
    style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px", height: "100px" }}
  ></textarea>

  <button type="submit" style={{ padding: "10px 16px" }}>
    Submit Application
  </button>
</form>
      </button>
    </main>
  );
}