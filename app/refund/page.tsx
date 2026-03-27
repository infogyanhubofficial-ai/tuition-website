import React from 'react';

export default function RefundAndReturnPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-slate-900 px-8 py-10 text-center text-white">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Refund & Return Policy
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            At GyanHub, we believe in complete transparency. We strive to create a fair, secure, and reliable educational marketplace for all our users in Nepal. Please review our refund and return policies below carefully before making any transactions on our platform.
          </p>
        </div>

        {/* Content Section */}
        <div className="p-8 sm:p-10 space-y-10 text-gray-700 leading-relaxed">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4 border-b border-gray-200 pb-2">
              1. Policy for Tutors and Educators
            </h2>
            <ul className="space-y-4 list-disc pl-5 marker:text-slate-400">
              <li>
                <strong>Platform Application Fees:</strong> When you pay a platform fee to apply for a vacancy, your payment is held securely by GyanHub. We only unlock and process this payment once both you and the vacancy provider mutually accept the engagement. Once mutually accepted, this fee is <strong>non-refundable</strong>. The only exception is if the vacancy provider cancels the opportunity from their side and officially notifies our administration.
              </li>
              <li>
                <strong>Verification Badges:</strong> Payments made to acquire a "GyanHub Verified" badge cover the administrative cost of background and document checks. Therefore, these payments are strictly <strong>non-refundable</strong>, regardless of the verification outcome.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4 border-b border-gray-200 pb-2">
              2. Policy for Students and Parents
            </h2>
            <ul className="space-y-4 list-disc pl-5 marker:text-slate-400">
              <li>
                <strong>General Services:</strong> We are proud to offer our core services—posting tutor requirements and browsing available tutors—completely <strong>free of charge</strong>.
              </li>
              <li>
                <strong>Premium Services:</strong> Payments made for professional digital services, such as unlocking a tutor's detailed CV or accessing direct contact numbers, are immediate digital deliveries and are therefore <strong>non-refundable</strong>.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4 border-b border-gray-200 pb-2">
              3. Policy for Online Courses and Training
            </h2>
            <ul className="space-y-4 list-disc pl-5 marker:text-slate-400 mb-6">
              <li>
                <strong>Booking Fees:</strong> The initial booking amount required to reserve your seat in a course is <strong>non-refundable</strong>.
              </li>
              <li>
                <strong>Course Fees:</strong> We want you to be confident in your learning journey. That is why the remaining course fee is only collected after you attend the orientation session. Because you are fully informed and confirmed before paying this balance, it is <strong>non-refundable</strong>.
              </li>
            </ul>
            
            {/* Callout Box for Positive Feature */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-5 rounded-r-lg shadow-sm">
              <h3 className="text-blue-900 font-bold text-lg mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free Batch Transfers
              </h3>
              <p className="text-blue-800 text-sm sm:text-base">
                We understand that unexpected situations arise. If you are unable to continue your current course, you may request a free transfer to the next available batch. To use this benefit, you must contact GyanHub administration during your active course period.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4 border-b border-gray-200 pb-2">
              4. Payment Processing and Gateways
            </h2>
            <ul className="space-y-4 list-disc pl-5 marker:text-slate-400">
              <li>
                All transactions are processed securely through our authorized Nepali payment partners (including eSewa, Khalti, Fonepay, and direct bank transfers).
              </li>
              <li>
                In the rare event of a technical failure where a payment is deducted from your account but not updated on GyanHub, the reversed amount will be credited back to your original payment method according to the respective digital wallet or bank's processing timeline (usually 2 to 5 business days).
              </li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}