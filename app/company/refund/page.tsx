import React from 'react';

export default function RefundAndReturnPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white shadow-xl border border-gray-100 rounded-2xl overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-800 px-8 py-16 text-center text-white">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Refund & Payment Policy
          </h1>
          <p className="text-blue-100 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
            We believe every learner deserves clear, transparent, and fair payment policies. This page explains how course bookings, payments, cancellations, refunds, and transfers are handled at GyanHub.
          </p>
        </div>

        <div className="p-8 sm:p-12">
          
          {/* At a Glance */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 -mt-16">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center">
              <span className="text-4xl mb-3">💳</span>
              <h3 className="font-bold text-slate-900 mb-1">Booking Amount</h3>
              <p className="text-sm text-slate-500">Generally Non-refundable</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center">
              <span className="text-4xl mb-3">🔄</span>
              <h3 className="font-bold text-slate-900 mb-1">Batch Transfer</h3>
              <p className="text-sm text-slate-500">Available</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center">
              <span className="text-4xl mb-3">🛡️</span>
              <h3 className="font-bold text-slate-900 mb-1">Secure Payments</h3>
              <p className="text-sm text-slate-500">Verified Gateways</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center">
              <span className="text-4xl mb-3">📞</span>
              <h3 className="font-bold text-slate-900 mb-1">Support</h3>
              <p className="text-sm text-slate-500">Need help? Contact us.</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-20">
            <h2 className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Your Journey</h2>
            <div className="flex flex-col md:flex-row justify-between items-center w-full bg-slate-50 p-8 rounded-2xl border border-slate-100 space-y-6 md:space-y-0 relative">
              <div className="hidden md:block absolute top-1/2 left-10 right-10 h-0.5 bg-slate-200 -z-0 -translate-y-1/2"></div>
              
              {[
                { step: '1', title: 'Reserve Seat' },
                { step: '2', title: 'Attend Orientation' },
                { step: '3', title: 'Complete Payment' },
                { step: '4', title: 'Start Learning' },
                { step: '5', title: 'Need Help?', subtitle: 'Transfer Request' },
              ].map((item, index) => (
                <div key={index} className="relative z-10 flex flex-col items-center text-center bg-slate-50 px-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-md mb-3 border-4 border-slate-50">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-slate-800 text-sm">{item.title}</h4>
                  {item.subtitle && <p className="text-xs text-slate-500 mt-1">{item.subtitle}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-16">
            
            {/* Section 1: Course Enrollment */}
            <div className="flex items-start gap-6">
              <div className="text-5xl font-extrabold text-slate-100 select-none mt-1 leading-none">01</div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Course Enrollment</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Enrolling in a GyanHub course requires a seat reservation to guarantee your spot. Due to our commitment to maintaining a low student-to-teacher ratio, we offer limited seats per batch. Your enrollment confirmation is finalized once the initial booking amount is received.
                </p>
              </div>
            </div>

            {/* Section 2: Booking Amount */}
            <div className="flex items-start gap-6">
              <div className="text-5xl font-extrabold text-slate-100 select-none mt-1 leading-none">02</div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Booking Amount & Discounts</h2>
                <ul className="space-y-3 list-disc pl-5 marker:text-slate-300 text-slate-600">
                  <li>The booking amount securely reserves your seat in the chosen batch.</li>
                  <li><strong>Exclusive Discounts:</strong> Booking your seat generally guarantees you a special discount on the total course fee. You can check course-specific discount details directly on our website or by speaking with our academic counselors.</li>
                  <li>Because this booking is specifically made to lock in your discounted seat and prevents others from taking that spot, it is usually <strong>non-refundable</strong>.</li>
                  <li>The booking amount is directly adjusted toward your total course fees.</li>
                  <li>Exceptions for refunds on booking amounts are only made if GyanHub completely cancels the batch.</li>
                </ul>
              </div>
            </div>

            {/* Section 3: Course Fees */}
            <div className="flex items-start gap-6">
              <div className="text-5xl font-extrabold text-slate-100 select-none mt-1 leading-none">03</div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Course Fees</h2>
                <p className="text-slate-600 leading-relaxed">
                  We collect the remaining balance of your course fee according to the provided payment schedule. Typically, full confirmation and final payments occur after you attend our orientation session. This ensures you fully understand the course curriculum and expectations before committing the remaining balance. Once paid, the remaining course fee is generally non-refundable.
                </p>
              </div>
            </div>

            {/* Section 4: Batch Transfer */}
            <div className="flex items-start gap-6">
              <div className="text-5xl font-extrabold text-blue-50 select-none mt-1 leading-none">04</div>
              <div className="w-full">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  Batch Transfer <span className="text-2xl">🔄</span>
                </h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  If you cannot continue due to genuine personal, academic, or professional reasons, you may request a one-time transfer to the next available batch, subject to availability.
                </p>
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl">
                  <h4 className="font-semibold text-slate-800 mb-2">Transfer Conditions:</h4>
                  <ul className="space-y-2 list-disc pl-5 marker:text-blue-400 text-slate-600 text-sm">
                    <li>Requests must be made during the active course period.</li>
                    <li>Subject to seat availability in the upcoming batch.</li>
                    <li>Limited to one transfer per enrollment.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Important Notice (Amber Callout) */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-6 sm:p-8 rounded-2xl shadow-sm my-10 flex flex-col sm:flex-row items-start gap-5">
              <div className="bg-amber-100 p-3 rounded-full flex-shrink-0">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-amber-900 font-bold text-xl mb-2">Important Notice on Eligibility</h3>
                <p className="text-amber-800 leading-relaxed">
                  Refund and transfer requests are evaluated strictly on a case-by-case basis. To qualify for consideration, all requests must be submitted formally through our official support channels while your current batch is still active. Post-course requests will not be entertained.
                </p>
              </div>
            </div>

            {/* Section 5: Course Cancellation */}
            <div className="flex items-start gap-6">
              <div className="text-5xl font-extrabold text-slate-100 select-none mt-1 leading-none">05</div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Course Cancellation</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  In rare circumstances, GyanHub may need to cancel or postpone a scheduled batch. If GyanHub cancels a batch, the student has full autonomy to choose one of the following:
                </p>
                <ul className="space-y-2 list-disc pl-5 marker:text-slate-300 text-slate-600 font-medium">
                  <li>A full refund of all payments made, or</li>
                  <li>A seamless transfer to another available batch.</li>
                </ul>
              </div>
            </div>

            {/* Section 6: Recorded Courses */}
            <div className="flex items-start gap-6">
              <div className="text-5xl font-extrabold text-slate-100 select-none mt-1 leading-none">06</div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  Recorded Courses <span className="text-2xl">📚</span>
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Because recorded content becomes immediately accessible after purchase, payments for recorded courses are generally non-refundable unless required by applicable law or in cases of technical issues that permanently prevent access.
                </p>
              </div>
            </div>

            {/* Section 7: Payment Methods */}
            <div className="flex items-start gap-6">
              <div className="text-5xl font-extrabold text-slate-100 select-none mt-1 leading-none">07</div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  Payment Methods <span className="text-2xl">💳</span>
                </h2>
                <p className="text-slate-600 leading-relaxed mb-3">
                  We support secure and seamless transactions through Nepal's leading payment gateways:
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg text-sm border border-slate-200">eSewa</span>
                  <span className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg text-sm border border-slate-200">Khalti</span>
                  <span className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg text-sm border border-slate-200">Fonepay</span>
                  <span className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg text-sm border border-slate-200">Bank Transfer</span>
                </div>
              </div>
            </div>

            {/* Section 8: Failed Transactions */}
            <div className="flex items-start gap-6">
              <div className="text-5xl font-extrabold text-slate-100 select-none mt-1 leading-none">08</div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Failed Transactions</h2>
                <p className="text-slate-600 leading-relaxed">
                  If payment is deducted from your bank or wallet but enrollment is not confirmed on our platform, please contact our support team immediately with your transaction details. After verification, we will coordinate with the respective payment provider to resolve the issue as quickly as possible.
                </p>
              </div>
            </div>

            {/* Section 9: Refund Processing */}
            <div className="flex items-start gap-6">
              <div className="text-5xl font-extrabold text-slate-100 select-none mt-1 leading-none">09</div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Refund Processing</h2>
                <p className="text-slate-600 leading-relaxed">
                  Approved refunds, where applicable, will be processed using the original payment method whenever possible. Processing time strictly depends on the specific payment provider or banking institution, generally taking a few business days once initiated by GyanHub.
                </p>
              </div>
            </div>

            {/* Extra Content: FAQ */}
            <div className="my-16 pt-12 border-t border-slate-200">
              <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-2">Why are some payments non-refundable?</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Some fees secure limited seats, administrative processing, or immediate access to digital learning resources. These costs are incurred as soon as your enrollment is confirmed, which is why certain payments cannot be refunded.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-2">What if I cannot attend due to an emergency?</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    We understand that unexpected situations can arise. Depending on the circumstances and the course, you may request a transfer to another batch or discuss available options with our student support team.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-2">Can someone else use my enrollment?</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Course enrollments are generally non-transferable to another person unless explicitly approved by GyanHub before the course begins.
                  </p>
                </div>
              </div>
            </div>

            {/* Policy Updates */}
            <div className="text-center text-sm text-slate-500 max-w-2xl mx-auto pt-8 border-t border-slate-200">
              <p>
                <strong>Policy Updates:</strong> This policy may be updated periodically to reflect changes in our services or legal obligations. The latest version will always be available on our website.
              </p>
            </div>

          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-slate-900 text-white px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Questions About Payments?</h2>
          <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            We're committed to making every transaction transparent and secure. If you have questions about course fees, refunds, transfers, or payment issues, our team is happy to assist.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="text-2xl mb-2">📞</div>
              <h4 className="font-semibold mb-1">Phone</h4>
              <p className="text-slate-400 text-sm">9763695665</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="text-2xl mb-2">✉️</div>
              <h4 className="font-semibold mb-1">Email</h4>
              <p className="text-slate-400 text-sm">admin@gyanhub.com.np</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="text-2xl mb-2">🏢</div>
              <h4 className="font-semibold mb-1">Office Hours</h4>
              <p className="text-slate-400 text-sm">Sun - Fri, 9 AM - 6 PM</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}