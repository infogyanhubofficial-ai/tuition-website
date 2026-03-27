import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-20">
      {/* Subtle, professional header */}
      <header className="bg-slate-50 border-b border-slate-200 py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-500 text-sm uppercase tracking-widest font-medium">
            Effective Date: January 1, 2025
          </p>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        
        {/* Introduction */}
        <section className="mb-10 text-lg text-slate-700 leading-relaxed">
          <p>
            At <strong>GyanHub</strong>, accessible from{" "}
            <a href="https://www.gyanhub.com.np" className="text-blue-600 hover:underline">
              www.gyanhub.com.np
            </a>
            , the privacy of our students, tutors, and partners is our top priority. 
            This Privacy Policy outlines what information we collect, how we use it, 
            and how we keep it safe in accordance with the prevailing laws of Nepal, 
            including the <strong>Privacy Act, 2075 (2018)</strong>.
          </p>
        </section>

        <div className="space-y-12">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Information We Collect</h2>
            <p className="mb-4 text-slate-700">
              To provide you with the best educational opportunities, we collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-slate-700">
              <li>
                <span className="font-semibold text-slate-900">Personal Identification:</span> Name, email address, phone number (WhatsApp), and location (e.g., Kathmandu, Bhaktapur) to help match you with local opportunities.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Academic & Professional Details:</span> For tutors and educators, we collect qualifications, subjects of expertise, and certification details to display to potential students.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Account Activity:</span> Search preferences, courses viewed, and tutoring requests to improve your user experience.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. How We Use Your Data</h2>
            <p className="mb-4 text-slate-700">
              We only use your data to facilitate and improve our educational services. Your information is used to:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-slate-700">
              <li>Connect students with the most relevant and qualified tutors.</li>
              <li>Display your professional profile to users actively seeking your specific educational services.</li>
              <li>Provide personalized recommendations for skill-based training and digital certifications.</li>
              <li>Communicate with you regarding updates, opportunities, or customer support.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Strict No Third-Party Sharing</h2>
            <p className="text-slate-700 leading-relaxed">
              Your data is safe with us. <strong>GyanHub strictly promises</strong> that your personal information will never be sold, rented, or traded to any third-party marketing agencies or external companies. Your data remains securely within the GyanHub ecosystem to serve your educational needs.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Data Security</h2>
            <p className="text-slate-700 leading-relaxed">
              We implement robust, industry-standard digital security measures to protect your personal information against unauthorized access, alteration, or disclosure.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Your Rights & Control</h2>
            <p className="text-slate-700 leading-relaxed">
              You have full control over your data. You can request to view, update, correct, or permanently delete your account and personal information from our database at any time by contacting us at{" "}
              <a href="mailto:admin@gyanhub.com.np" className="text-blue-600 font-medium hover:underline">
                admin@gyanhub.com.np
              </a>.
            </p>
          </section>

          {/* Section 6 */}
          <section className="pt-8 border-t border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">6. Contact Us</h2>
            <p className="mb-6 text-slate-700">
              If you have any questions or concerns regarding this Privacy Policy, please reach out to us:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-8 rounded-2xl border border-slate-100">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Email</p>
                <a href="mailto:admin@gyanhub.com.np" className="text-blue-600 hover:underline font-medium">
                  admin@gyanhub.com.np
                </a>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Phone</p>
                <a href="tel:9763695665" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
                  9763695665
                </a>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Office</p>
                <p className="text-slate-700 font-medium">
                  Gatthaghar, Bhaktapur, Nepal
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>
      
      
    </div>
  );
}