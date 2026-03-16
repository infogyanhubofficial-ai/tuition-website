export default function Home() {
  return (
    <main style={{padding: "40px", fontFamily: "Arial"}}>
      <h1>Home Tuition Jobs</h1>
      <p>Find the latest home tuition vacancies near you.</p>

      <h2>Latest Vacancies</h2>

      <div style={{border:"1px solid #ccc", padding:"20px", marginTop:"20px"}}>
        <h3>Class 8 Math Tutor Needed</h3>
        <p>Location: Kathmandu</p>
        <p>Salary: NPR 10,000/month</p>
        <button>View Details</button>
      </div>

      <div style={{border:"1px solid #ccc", padding:"20px", marginTop:"20px"}}>
        <h3>Science Tutor for Grade 10</h3>
        <p>Location: Lalitpur</p>
        <p>Salary: NPR 12,000/month</p>
        <button>View Details</button>
      </div>

    </main>
  );
}