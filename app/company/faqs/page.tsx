"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, MapPin, MonitorPlay, Clock, Award, 
  ChevronDown, ThumbsUp, ThumbsDown, MessageCircle, 
  PhoneCall, Mail, Building, BookOpen, CreditCard, 
  ShieldCheck, ArrowRight, ChevronRight, Home, Zap,
  PlayCircle
} from "lucide-react";

// --- Types ---
interface FAQItem {
  id: string;
  isPopular?: boolean;
  question: string;
  answer: string | React.ReactNode;
}

interface FAQCategory {
  id: string;
  category: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

// --- Data Structure ---
const faqData: FAQCategory[] = [
  {
    id: "about",
    category: "About GyanHub",
    icon: <Building className="w-5 h-5" />,
    items: [
      {
        id: "what-is-gyanhub",
        isPopular: true,
        question: "What is GyanHub?",
        answer: (
          <span>
            GyanHub is Nepal’s premier education and professional development center. We provide physical classroom training, <a href="/onlinecourse" className="text-blue-600 hover:underline font-medium">live online classes</a>, and <a href="/recording" className="text-blue-600 hover:underline font-medium">recorded courses</a> to help learners achieve their academic and career goals.
          </span>
        )
      },
      {
        id: "why-choose-gyanhub",
        isPopular: true,
        question: "Why should I choose GyanHub?",
        answer: "Choosing the right learning partner is an important decision. At GyanHub, we combine practical education, experienced instructors, flexible learning options, and dedicated student support to create meaningful learning experiences. Our goal is not only to teach but to help learners develop the confidence, skills, and knowledge needed to achieve their academic and professional aspirations."
      },
      {
        id: "gyanhub-difference",
        question: "What makes GyanHub different from other training institutes?",
        answer: "At GyanHub, we believe education should create real opportunities, not just certificates. Our programs are designed to bridge the gap between academic knowledge and practical skills through industry-relevant training, experienced instructors, interactive learning, and continuous student support. Whether you choose classroom, live online, or recorded learning, our focus remains the same—helping you build confidence for your career."
      },
      {
        id: "location",
        question: "Where is GyanHub located?",
        answer: (
          <div className="space-y-4">
            <p>Our modern learning center is conveniently located near <strong>Eyeplex Mall, New Baneshwor, Kathmandu</strong>. Students are welcome to visit during office hours for counseling, course inquiries, enrollment assistance, and academic support.</p>
            <a href="https://maps.app.goo.gl/gSEdcZVAKDxB6hqu7" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition-colors">
              <MapPin className="w-4 h-4" /> View on Google Maps
            </a>
          </div>
        )
      },
      {
        id: "visit-before-enrolling",
        question: "Can I visit GyanHub before enrolling?",
        answer: "Yes. You're welcome to visit our learning center near Eyeplex Mall, New Baneshwor, Kathmandu, during office hours. Our team will be happy to explain available programs, answer your questions, and guide you through the enrollment process."
      }
    ]
  },
  {
    id: "courses",
    category: "Courses & Learning",
    icon: <BookOpen className="w-5 h-5" />,
    items: [
      {
        id: "learning-formats",
        isPopular: true,
        question: "What learning formats does GyanHub offer?",
        answer: (
          <ul className="space-y-2 list-disc list-inside">
            <li><strong>Classroom Training:</strong> In-person learning via our <a href="/offline-class" className="text-blue-600 hover:underline">offline classes</a> at our Kathmandu center.</li>
            <li><strong>Live Online Classes:</strong> Interactive, real-time virtual sessions available through our <a href="/onlinecourse" className="text-blue-600 hover:underline">online courses</a>.</li>
            <li><strong>Recorded Courses:</strong> Self-paced learning materials available in our <a href="/recording" className="text-blue-600 hover:underline">recordings library</a>.</li>
            <li><strong>Hybrid Learning:</strong> A mix of physical and digital formats (where applicable).</li>
          </ul>
        )
      },
      {
        id: "right-course",
        question: "How do I know which course is right for me?",
        answer: "Our counselors are available to understand your academic background, career goals, and interests before recommending a suitable course. We believe the right guidance is the first step toward meaningful learning."
      },
      {
        id: "prior-experience",
        question: "Do I need prior experience to join a course?",
        answer: "Not necessarily. Many of our courses are designed for beginners, while some advanced programs may recommend basic prior knowledge. Course prerequisites are clearly mentioned before enrollment, and our team can help you choose the right learning path based on your current experience."
      },
      {
        id: "practical-or-theory",
        question: "Are the classes practical or theory-based?",
        answer: "Our teaching philosophy emphasizes practical learning. While theoretical concepts are important, every program is designed to help learners apply their knowledge through real-world examples, projects, demonstrations, and hands-on practice whenever applicable."
      },
      {
        id: "study-while-working",
        question: "Can I study while working or attending college?",
        answer: (
          <span>
            Yes. Many of our learners are students and working professionals. Depending on the program, we offer flexible schedules, <a href="/onlinecourse" className="text-blue-600 hover:underline">online learning</a>, and <a href="/recording" className="text-blue-600 hover:underline">recorded content</a> to help you balance your education with your other commitments.
          </span>
        )
      },
      {
        id: "missed-class",
        question: "What if I miss a class?",
        answer: (
          <span>
            Depending on the course, you may have access to <a href="/recording" className="text-blue-600 hover:underline">recorded sessions</a> or alternative learning resources. If you're enrolled in a classroom program, our team will guide you on the best way to catch up with missed content whenever possible.
          </span>
        )
      },
      {
        id: "after-enrollment",
        question: "What happens after I enroll?",
        answer: "After enrollment, you'll receive all the necessary information, including your class schedule, learning platform (if applicable), course materials, and support contacts. Our team remains available throughout your learning journey to assist whenever needed."
      }
    ]
  },
  {
    id: "enrollment",
    category: "Enrollment & Payments",
    icon: <CreditCard className="w-5 h-5" />,
    items: [
      {
        id: "how-to-enroll",
        question: "How do I enroll in a course?",
        answer: "You can enroll by visiting our learning center in New Baneshwor, contacting us via phone/WhatsApp, or directly signing up through our website. Our academic counselors will guide you through the process."
      },
      {
        id: "booking-amount",
        isPopular: true,
        question: "Why do some courses require a booking amount?",
        answer: "A booking amount helps reserve your seat in limited-capacity batches and allows us to plan course delivery effectively. This seat booking amount is generally non-refundable unless otherwise specified. Remaining fee structures and refund conditions are clearly communicated before enrollment."
      },
      {
        id: "batch-transfer",
        question: "Can I transfer to another batch?",
        answer: "Yes. If you're unable to continue your current batch due to genuine circumstances, you may request a transfer to the next available batch, subject to course availability and our transfer policy."
      }
    ]
  },
  {
    id: "certificates",
    category: "Certificates",
    icon: <Award className="w-5 h-5" />,
    items: [
      {
        id: "get-certificate",
        isPopular: true,
        question: "Will I receive a certificate?",
        answer: (
          <span>
            Yes. Eligible courses include a <a href="/certificate" className="text-blue-600 hover:underline">certificate of completion</a> after you successfully meet the course requirements, attendance, and assessments. Certificate availability and eligibility are specified for each program.
          </span>
        )
      },
      {
        id: "recognized-certificates",
        question: "Are your certificates recognized?",
        answer: "Our certificates demonstrate successful completion of a training program and the skills gained during the course. While recognition depends on employers, institutions, or regulatory bodies, our focus is on delivering practical knowledge that supports academic and professional growth."
      }
    ]
  },
  {
    id: "privacy",
    category: "Privacy & Support",
    icon: <ShieldCheck className="w-5 h-5" />,
    items: [
      {
        id: "course-support",
        question: "Will I receive support if I face difficulties during the course?",
        answer: "Absolutely. Learning doesn't end when a class finishes. Our instructors and support team are committed to helping students overcome challenges, clarify concepts, and make the most of their learning experience."
      },
      {
        id: "contact-before-enrolling",
        question: "Can I contact GyanHub before enrolling?",
        answer: "Of course. Whether you have questions about courses, fees, or career paths, our team is always happy to assist you before you make any decision."
      },
      {
        id: "data-safety",
        question: "Is my personal information secure?",
        answer: "Yes. We value your privacy and collect only the information necessary to provide our educational services. Your personal information is handled responsibly and is never sold or shared with third-party marketing organizations. For complete details, please refer to our Privacy Policy."
      }
    ]
  }
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>(faqData[0].id);
  
  // Added typing for helpfulStatus object to resolve implicit 'any' indexing
  const [helpfulStatus, setHelpfulStatus] = useState<Record<string, "yes" | "no">>({});
  
  // Added HTMLInputElement typing to allow calling `.focus()`
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    
    // Don't forget to clean up the event listener!
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Auto-open from URL Hash
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      setOpenItems(new Set([hash]));
      const element = document.getElementById(hash);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: "smooth", block: "center" }), 500);
      }
    }
  }, []);

  // Explicit typing for id parameter
  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newOpenItems = new Set(prev);
      if (newOpenItems.has(id)) newOpenItems.delete(id);
      else newOpenItems.add(id);
      return newOpenItems;
    });
  };

  // Explicit typing for id, type, and e parameters
  const handleFeedback = (id: string, type: "yes" | "no", e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setHelpfulStatus((prev) => ({ ...prev, [id]: type }));
  };

  // Filter Logic
  const filteredData = faqData.map(section => ({
    ...section,
    items: section.items.filter(item => {
      const questionMatch = item.question.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Extract text content safely from strings or React nodes for searching
      let answerText = "";
      if (typeof item.answer === 'string') {
        answerText = item.answer;
      } else if (React.isValidElement(item.answer)) {
        const elementProps = item.answer.props as { children?: React.ReactNode };
        if (elementProps && elementProps.children) {
          const children = elementProps.children;
          answerText = Array.isArray(children) 
            ? children.map((child: any) => typeof child === 'string' ? child : '').join('')
            : typeof children === 'string' ? children : '';
        }
      }
      
      const answerMatch = answerText.toLowerCase().includes(searchQuery.toLowerCase());
      return questionMatch || answerMatch;
    })
  })).filter(section => section.items.length > 0);

  const hasSearchResults = filteredData.length > 0;
  const isSearching = searchQuery.trim().length > 0;

  // Extract popular items
  const popularItems = faqData.flatMap(cat => cat.items).filter(item => item.isPopular);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-4">
        <nav className="flex items-center space-x-2 text-sm text-slate-500">
          <a href="/" className="hover:text-blue-600 flex items-center gap-1"><Home className="w-4 h-4"/> Home</a>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-800 font-medium">FAQ</span>
        </nav>
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 pt-10 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-6">
          <Zap className="w-4 h-4" /> Support Center
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
          Questions, Answered.
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Find answers about classroom training, online learning, recorded courses, admissions, certificates, and student support.
        </p>

        {/* Search Bar */}
        <div className="mt-10 max-w-2xl mx-auto relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            className="block w-full pl-12 pr-16 py-4 bg-white border border-slate-200 rounded-2xl leading-5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-base shadow-sm transition-all hover:shadow-md"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 border border-slate-200 rounded text-xs font-sans font-medium text-slate-400 bg-slate-50">
              /
            </kbd>
          </div>
        </div>

        {/* Quick Facts / Analytics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto text-left">
          <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="text-blue-600 mb-3"><MapPin className="w-6 h-6" /></div>
            <div>
              <div className="font-bold text-slate-900 text-sm mb-1">Learning Center</div>
              <div className="text-xs text-slate-500 leading-snug">Near Eyeplex Mall, New Baneshwor</div>
            </div>
          </div>
          
          <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="text-indigo-600 mb-3"><MonitorPlay className="w-6 h-6" /></div>
            <div>
              <div className="font-bold text-slate-900 text-sm mb-1">Learning Modes</div>
              <div className="text-xs text-slate-500 leading-snug">Classroom • Live Online • Recorded</div>
            </div>
          </div>
          
          <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="text-emerald-600 mb-3"><Award className="w-6 h-6" /></div>
            <div>
              <div className="font-bold text-slate-900 text-sm mb-1">Certificates</div>
              <div className="text-xs text-slate-500 leading-snug">Available for eligible courses</div>
            </div>
          </div>
          
          <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="text-amber-600 mb-3"><MessageCircle className="w-6 h-6" /></div>
            <div>
              <div className="font-bold text-slate-900 text-sm mb-1">Student Support</div>
              <div className="text-xs text-slate-500 leading-snug">Online & In Person</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Sticky Desktop Navigation */}
        <div className="hidden lg:block lg:col-span-3 sticky top-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">Categories</h3>
          <nav className="space-y-1">
            {faqData.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchQuery(""); // Clear search when clicking category
                  document.getElementById(cat.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
  activeCategory === cat.id && !isSearching
    ? "bg-white text-blue-700 shadow-sm border border-slate-200"
    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
}`}
              >
                <span className={activeCategory === cat.id && !isSearching ? "text-blue-600" : "text-slate-400"}>
                  {cat.icon}
                </span>
                {cat.category}
              </button>
            ))}
          </nav>
        </div>

        {/* Main FAQ Content */}
        <div className="lg:col-span-9 space-y-12">
          
          {/* Most Asked (Only show when not searching) */}
          {!isSearching && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" /> Most Asked
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {popularItems.map((item) => (
                  <button 
                    key={`pop-${item.id}`}
                    onClick={() => {
                      setOpenItems(new Set([item.id]));
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="flex items-start p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all text-left group"
                  >
                    <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 pr-4 flex-1">
                      {item.question}
                    </span>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Render Categories & Questions */}
          {hasSearchResults ? (
            filteredData.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">{section.icon}</div>
                  <h2 className="text-2xl font-bold text-slate-900">{section.category}</h2>
                </div>
                
                <div className="space-y-4">
                  {section.items.map((item) => {
                    const isOpen = openItems.has(item.id);
                    return (
                      <div 
                        key={item.id} 
                        id={item.id}
                        className={`bg-white rounded-2xl border transition-all duration-300 ${isOpen ? 'border-blue-200 shadow-md ring-4 ring-blue-50/50' : 'border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md'}`}
                      >
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none group"
                          aria-expanded={isOpen}
                        >
                          <span className={`text-lg font-semibold pr-6 transition-colors ${isOpen ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-600'}`}>
                            {item.question}
                          </span>
                          <div className={`shrink-0 p-1 rounded-full transition-all duration-300 ${isOpen ? 'bg-blue-100 text-blue-600 rotate-180' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                            <ChevronDown className="w-5 h-5" />
                          </div>
                        </button>
                        
                        <div 
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                          <div className="px-6 pb-6 pt-2">
                            <div className="text-slate-600 leading-relaxed prose prose-blue max-w-none">
                              {item.answer}
                            </div>
                            
                            {/* Helpful Widget */}
                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-500">Was this helpful?</span>
                              <div className="flex gap-2">
                                <button 
                                  onClick={(e) => handleFeedback(item.id, 'yes', e)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${helpfulStatus[item.id] === 'yes' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                  <ThumbsUp className="w-4 h-4" /> Yes
                                </button>
                                <button 
                                  onClick={(e) => handleFeedback(item.id, 'no', e)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${helpfulStatus[item.id] === 'no' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                  <ThumbsDown className="w-4 h-4" /> No
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          ) : (
            // Empty State
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No answers found</h3>
              <p className="text-slate-500 mb-6">We couldn't find anything matching "{searchQuery}".</p>
              <a href="#contact" className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                Contact our support team <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

        </div>
      </div>

      {/* Modern Contact CTA Section */}
      <div id="contact" className="max-w-5xl mx-auto px-6 mt-24">
        <div className="bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl">
          {/* Background Illustration / Pattern */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-10">
            <svg width="404" height="404" fill="none" viewBox="0 0 404 404"><defs><pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="4" height="4" fill="currentColor"></rect></pattern></defs><rect width="404" height="404" fill="url(#pattern)"></rect></svg>
          </div>
          
          <div className="relative p-10 md:p-14 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Need Personal Guidance?</h2>
            <p className="text-slate-300 mb-10 max-w-2xl mx-auto text-lg">
              Whether you're choosing a course, upgrading your skills, or looking for career-focused training, our team is here to help.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <a href="https://wa.me/9779763695665" className="flex flex-col items-center p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all group">
                <MessageCircle className="w-6 h-6 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-white font-medium">WhatsApp</span>
                <span className="text-xs text-slate-400 mt-1">Chat with us</span>
              </a>
              <a href="tel:+9779763695665" className="flex flex-col items-center p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all group">
                <PhoneCall className="w-6 h-6 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-white font-medium">Call Us</span>
                <span className="text-xs text-slate-400 mt-1">9763695665</span>
              </a>
              <a href="https://maps.app.goo.gl/gSEdcZVAKDxB6hqu7" className="flex flex-col items-center p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all group">
                <Building className="w-6 h-6 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-white font-medium">Visit Office</span>
                <span className="text-xs text-slate-400 mt-1">New Baneshwor</span>
              </a>
              
              {/* Courses Dropdown */}
              <div className="relative flex flex-col group cursor-pointer">
                <div className="flex flex-col items-center w-full h-full p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all">
                  <MonitorPlay className="w-6 h-6 text-orange-400 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-white font-medium flex items-center gap-1">
                    View Courses <ChevronDown className="w-3 h-3 opacity-70" />
                  </span>
                  <span className="text-xs text-slate-400 mt-1">Explore programs</span>
                </div>

                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-white rounded-xl shadow-xl overflow-hidden z-50 py-1 border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-bottom scale-95 group-hover:scale-100">
                  <a href="/offline-class" className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-slate-100 text-left">Physical Classes</a>
                  <a href="/onlinecourse" className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-slate-100 text-left">Online Classes</a>
                  <a href="/recording" className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left">Recordings</a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Community Footer */}
      <div className="mt-24 text-center px-6 border-t border-slate-200 pt-16 max-w-6xl mx-auto">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Join thousands of learners.</h3>
        <p className="text-slate-500 max-w-xl mx-auto mb-10">
          Whether you're exploring professional training or upgrading your skills, we're here to guide you. Let's learn, grow, and succeed together.
        </p>
        
        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500">
          <a href="/offline-class" className="hover:text-blue-600 transition-colors">Classroom Training</a>
          <a href="/onlinecourse" className="hover:text-blue-600 transition-colors">Live Online</a>
          <a href="/recording" className="hover:text-blue-600 transition-colors">Recorded Courses</a>
          <a href="/company/about" className="hover:text-blue-600 transition-colors">About Us</a>
          <a href="/company/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
          <a href="/company/refund" className="hover:text-blue-600 transition-colors">Refund Policy</a>
        </div>
      </div>
      
    </div>
  );
}