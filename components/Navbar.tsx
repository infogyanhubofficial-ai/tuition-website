import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <div
      style={{
        width: "100%",
        background: "linear-gradient(90deg, #2563eb, #ff6f32)",
        borderBottom: "1px solid #e5e7eb",
        padding: "12px 0",
      }}
    >
      <div
        className="page-container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 0",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center" }}>
          <Image
            src="/images/logo.png"
            alt="GyanHub Tuition Logo"
            width={120}
            height={50}
          />
        </Link>

        {/* Navigation Links */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "center",
            flexWrap: "wrap",
            marginLeft: "auto", // Ensures it aligns to the right
          }}
        >
          <Link
            href="/"
            style={{
              color: "white",
              fontWeight: "600",
              padding: "8px 12px",
              borderRadius: "5px",
              fontSize: "16px",
              textDecoration: "none",
            }}
            className="navbar-item"
          >
            Home
          </Link>

          <Link
            href="/tutors"
            style={{
              color: "white",
              fontWeight: "600",
              padding: "8px 12px",
              borderRadius: "5px",
              fontSize: "16px",
              textDecoration: "none",
            }}
            className="navbar-item"
          >
            Tutors
          </Link>

          <Link
            href="/vacancies"
            style={{
              color: "white",
              fontWeight: "600",
              padding: "8px 12px",
              borderRadius: "5px",
              fontSize: "16px",
              textDecoration: "none",
            }}
            className="navbar-item"
          >
            Vacancies
          </Link>

          <Link
            href="/post-tuition"
            style={{
              color: "white",
              fontWeight: "600",
              padding: "8px 12px",
              borderRadius: "5px",
              fontSize: "16px",
              textDecoration: "none",
            }}
            className="navbar-item"
          >
            Post Tuition
          </Link>

          {/* CTA Button */}
          <Link
            href="/post-tutor"
            style={{
              backgroundColor: "white",
              color: "#ff6f32",
              padding: "12px 18px",
              borderRadius: "30px",
              fontWeight: "700",
              textDecoration: "none",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
            }}
          >
            Become a Tutor
          </Link>
        </div>
      </div>
    </div>
  );
}