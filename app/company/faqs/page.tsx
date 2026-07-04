"use client";

import React, { useState } from 'react';

// Organized FAQ Data
const faqData = [
  {
    category: "General Information",
    items: [
      {
        id: "q-1",
        question: "1. Do you have physical classes?",
        answer: "No, the entire GyanHub ecosystem is 100% online. While our core office is located in Gatthaghar, Bhaktapur, all our tutoring connections, skill-based training, and certification programs are conducted digitally so learners across Nepal can access them from anywhere."
      },
      {
        id: "q-2",
        question: "2. What exactly is GyanHub?",
        answer: "GyanHub is Nepal’s premier central hub for education. We bridge the gap between students, educators, and institutions by connecting learners with top tutors, offering digital skill-based training, and creating employment opportunities in the education sector."
      }
    ]
  },
  {
    category: "For Students & Parents",
    items: [
      {
        id: "q-3",
        question: "3. Is it free to find a tutor on GyanHub?",
        answer: "Yes! Our general services—like posting your tutor requirements and browsing available tutors—are completely free of charge."
      },
      {
        id: "q-4",
        question: "4. When do I have to pay as a student?",
        answer: "Payments are only required for premium, professional services, such as unlocking a tutor's detailed CV or their direct contact number. Please note that payments for these digital unlock services are non-refundable."
      }
    ]
  },
  {
    category: "For Tutors & Educators",
    items: [
      {
        id: "q-5",
        question: "5. How does the application fee work when I apply for a tutoring vacancy?",
        answer: "When you pay a platform fee to apply for a vacancy, your payment is held securely. It is only unlocked once both you and the vacancy provider mutually accept the engagement. Once mutually accepted, it is non-refundable. If the vacancy provider cancels the opportunity and notifies us, your fee is protected."
      },
      {
        id: "q-6",
        question: "6. Is the fee for the \"GyanHub Verified\" badge refundable?",
        answer: "No. The payment made to acquire a verification badge covers the administrative costs of verifying your documents and background. Therefore, it is strictly non-refundable regardless of the outcome."
      }
    ]
  },
  {
    category: "For Online Courses & Training",
    items: [
      {
        id: "q-7",
        question: "7. How do I pay for online skill-based courses?",
        answer: "To reserve your seat, you pay an initial booking amount (non-refundable). You only pay the remaining balance after attending the orientation session, ensuring you are completely confident about the course before fully committing."
      },
      {
        id: "q-8",
        question: "8. What happens if I enroll in a course but cannot continue?",
        answer: "We offer flexibility! If you are unable to continue your current course, you can request a free transfer to the next available batch. You simply need to contact the GyanHub administration while your current course period is still active."
      }
    ]
  },
  {
    category: "Privacy & Security",
    items: [
      {
        id: "q-9",
        question: "9. Is my personal data and contact information safe?",
        answer: "Absolutely. Your privacy is our priority. Your data is strictly kept within the GyanHub ecosystem to match you with relevant educational services. We guarantee that your information is never sold, rented, or shared with any third-party marketing agencies."
      }
    ]
  }
];

export default function FAQPage() {
  // State to track which accordions are open. 
  // We initialize it with 'q-1' so the first question is open by default.
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(["q-1"]));

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newOpenItems = new Set(prev);
      if (newOpenItems.has(id)) {
        newOpenItems.delete(id);
      } else {
        newOpenItems.add(id);
      }
      return newOpenItems;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to know about navigating the GyanHub ecosystem, payments, and our policies.
          </p>
        </div>

        {/* FAQ Accordions by Category */}
        <div className="space-y-10">
          {faqData.map((section, index) => (
            <section key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Category Header */}
              <div className="bg-slate-100/50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">
                  {section.category}
                </h2>
              </div>
              
              {/* Questions List */}
              <div className="divide-y divide-slate-100">
                {section.items.map((item) => {
                  const isOpen = openItems.has(item.id);
                  
                  return (
                    <div key={item.id} className="group">
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none hover:bg-slate-50 transition-colors duration-200"
                        aria-expanded={isOpen}
                      >
                        <span className={`text-base sm:text-lg font-medium pr-4 ${isOpen ? 'text-blue-700' : 'text-slate-700 group-hover:text-blue-600'}`}>
                          {item.question}
                        </span>
                        <div className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {/* Answer Panel with smooth height transition */}
                      <div 
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                      >
                        <div className="px-6 pb-6 text-slate-600 leading-relaxed border-t border-slate-50 pt-2">
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Still Have Questions? CTA Box */}
        <div className="bg-blue-600 rounded-2xl shadow-lg p-8 sm:p-10 text-center text-white mt-12">
          <h3 className="text-2xl font-bold mb-3">Still have questions?</h3>
          <p className="text-blue-100 mb-8 max-w-lg mx-auto">
            Cannot find the answer you are looking for? Our team is always here to help you navigate your educational journey.
          </p>
          
          {/* Fixed Layout for Button & Contact Info */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            
            {/* CTA Button with forced text contrast and flex properties */}
            <a 
              href="/contact" 
              className="inline-flex items-center justify-center bg-white !text-blue-600 hover:bg-slate-50 font-bold py-3 px-8 rounded-lg transition-colors duration-200 shadow-sm w-full md:w-auto whitespace-nowrap"
              style={{ color: '#2563eb' }} 
            >
              Go to Contact Page
            </a>
            
            {/* Contact Information */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-medium">
              <a href="tel:+9779763695665" className="flex items-center gap-2 hover:text-blue-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                9763695665
              </a>
              <span className="hidden sm:inline text-blue-300">|</span>
              <a href="mailto:admin@gyanhub.com.np" className="flex items-center gap-2 hover:text-blue-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                admin@gyanhub.com.np
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}