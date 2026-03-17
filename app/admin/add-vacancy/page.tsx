export default function AddVacancyPage() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Add New Tuition Vacancy</h1>

      <form style={{ marginTop: "20px" }}>
        <input
          type="text"
          placeholder="Class (Example: Class 8)"
          style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }}
        />

        <input
          type="text"
          placeholder="Subject (Example: Math)"
          style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }}
        />

        <input
          type="text"
          placeholder="Location"
          style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }}
        />

        <input
          type="text"
          placeholder="Salary"
          style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }}
        />

        <textarea
          placeholder="Description"
          style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px", height: "100px" }}
        ></textarea>

        <button type="submit" style={{ padding: "10px 16px" }}>
          Add Vacancy
        </button>
      </form>
    </main>
  );
}