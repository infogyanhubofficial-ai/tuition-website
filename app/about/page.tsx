import React from 'react';

export default function AboutContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Page Header */}
      <header className="bg-blue-900 text-white py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">About GyanHub</h1>
        <p className="text-lg md:text-xl text-blue-200 max-w-2xl mx-auto">
          Transforming how Nepal learns and teaches.
        </p>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: About, Vision, Mission, Objectives */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Intro Section */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">Who We Are</h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              Founded on January 1, 2025, in Gatthaghar, Bhaktapur, <strong>GyanHub</strong> is an education-focused platform dedicated to transforming how Nepal learns and teaches. We believe in creating accessible, high-quality educational pathways for everyone.
            </p>
          </section>

          {/* Vision & Mission Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-blue-500">
              <h3 className="text-xl font-semibold text-blue-900 mb-3 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                Our Vision
              </h3>
              <p className="text-slate-600 leading-relaxed">
                To be Nepal's premier central hub for all education-related opportunities, empowering learners, educators, and institutions.
              </p>
            </section>

            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-indigo-500">
              <h3 className="text-xl font-semibold text-blue-900 mb-3 flex items-center">
                <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Our Mission
              </h3>
              <p className="text-slate-600 leading-relaxed">
                To bridge the gap between different stakeholders in the educational sector, creating a seamless, accessible, and highly effective learning ecosystem.
              </p>
            </section>
          </div>

          {/* Objectives Section */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-semibold text-blue-900 mb-6">Our Objectives</h2>
            <ul className="space-y-4">
              {[
                "Connecting learners with the best tutors.",
                "Creating employment opportunities in Nepal's educational sector.",
                "Providing skill-based training and digital certifications to boost academic profiles."
              ].map((objective, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold mr-4">
                    {idx + 1}
                  </span>
                  <p className="text-slate-700 text-lg mt-0.5">{objective}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right Column: Sidebar (Company Details & Connect) */}
        <div className="space-y-8">
          
          {/* Company Details Card */}
          <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200">
            <h3 className="text-xl font-semibold text-blue-900 mb-6 border-b pb-2">Company Details</h3>
            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex justify-between">
                <span className="font-medium text-slate-800">Registration No:</span>
                <span>363467/81/82</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-800">PAN:</span>
                <span>622327826</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-800">Category:</span>
                <span>Education</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-800">Location:</span>
                <span className="text-right">Gatthaghar, Bhaktapur<br/>Nepal</span>
              </div>
            </div>
          </div>

          {/* Contact & Connect Card */}
          <div className="bg-blue-900 p-8 rounded-2xl shadow-md text-white">
            <h3 className="text-xl font-semibold mb-6 border-b border-blue-700 pb-2">Get In Touch</h3>
            
            {/* Clickable Contact Links */}
            <div className="space-y-4 mb-8">
              <a href="mailto:admin@gyanhub.com.np" className="flex items-center group hover:text-blue-200 transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                admin@gyanhub.com.np
              </a>
              <a href="tel:9763695665" className="flex items-center group hover:text-blue-200 transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                +977 9763695665
              </a>
            </div>

            <h4 className="text-sm font-semibold uppercase tracking-wider text-blue-300 mb-4">Connect With Us</h4>
            
            {/* Social Media Grid (High-Quality Vectors) */}
            <div className="grid grid-cols-4 gap-4">
              
              {/* Facebook */}
              <a href="https://www.facebook.com/profile.php?id=61569757534336" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-lg hover:bg-white/20 hover:scale-105 transition-all flex items-center justify-center" aria-label="Facebook">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>

              {/* Instagram */}
              <a href="https://www.instagram.com/gyanhubonline/?next=%2F" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-lg hover:bg-white/20 hover:scale-105 transition-all flex items-center justify-center" aria-label="Instagram">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a href="https://www.linkedin.com/company/gyanhub/" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-lg hover:bg-white/20 hover:scale-105 transition-all flex items-center justify-center" aria-label="LinkedIn">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>

              {/* YouTube */}
              <a href="https://www.youtube.com/@GyanHubOnline" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-lg hover:bg-white/20 hover:scale-105 transition-all flex items-center justify-center" aria-label="YouTube">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.015 3.015 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* TikTok */}
              <a href="https://www.tiktok.com/@gyanhubofficial" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-lg hover:bg-white/20 hover:scale-105 transition-all flex items-center justify-center" aria-label="TikTok">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.96-.5 3.96-1.74 5.46-1.34 1.62-3.4 2.58-5.5 2.55-2.52-.03-4.9-1.55-5.9-3.87-.9-2.09-.76-4.63.45-6.58 1.25-2.02 3.65-3.3 6-3.26.11 0 .22 0 .33.01v4.09c-1.43-.1-2.91.47-3.82 1.56-.84 1-1.1 2.45-.63 3.68.42 1.1 1.48 1.88 2.67 2.01 1.16.12 2.37-.2 3.18-1.02.81-.82 1.25-1.97 1.25-3.13V.02z" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a href="https://wa.me/9779763695665" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-lg hover:bg-white/20 hover:scale-105 transition-all flex items-center justify-center" aria-label="WhatsApp">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>

              {/* Website */}
              <a href="https://www.gyanhubonline.com" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-lg hover:bg-white/20 hover:scale-105 transition-all flex items-center justify-center" aria-label="Website">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm8.895 13.5h-4.305c-.143 2.96-1.026 5.617-2.385 7.632 2.913-1.282 5.253-3.791 6.69-7.632zM12 21.84c1.192-2.115 2.015-4.908 2.181-7.84H9.819c.166 2.932.989 5.725 2.181 7.84zm-4.205-.708c-1.359-2.015-2.242-4.672-2.385-7.632H1.105c1.437 3.841 3.777 6.35 6.69 7.632zM1.105 10.5h4.305c.143-2.96 1.026-5.617 2.385-7.632-2.913 1.282-5.253 3.791-6.69 7.632zM12 2.16c-1.192 2.115-2.015 4.908-2.181 7.84h4.362c-.166-2.932-.989-5.725-2.181-7.84zm4.205.708c1.359 2.015 2.242 4.672 2.385 7.632h4.305c-1.437-3.841-3.777-6.35-6.69-7.632z" />
                </svg>
              </a>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}