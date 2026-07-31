"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import {
  Building2,
  Search,
  ChevronDown,
  User,
  History,
  ClipboardList,
  RotateCcw
} from "lucide-react";

/**
 * NEPAL e-GP LEARNING SIMULATOR FRONTEND (GYANHUB EDITION)
 * Features: Offline-capable state management & LocalStorage persistence.
 * Disclaimer: Created as a sample for learning purposes only.
 */

const SAMPLE_PE = "Department of quality assurance";
const SERVER_TIME = "2026-07-31 23:12:16 NPT";
const LOGGED_IN_USER = "Nischal";
const LOGGED_IN_ROLE = "Creator";

// --- Initial Seed Data ---
const INITIAL_PENDING_TASKS = [
  { id: 1, label: "PE REGISTRATION", count: 4 },
  { id: 2, label: "BIDDER REGISTRATION", count: 12 },
  { id: 3, label: "IC REGISTRATION", count: 3 },
  { id: 4, label: "BANK USER REGISTRATION", count: 2 },
];

const INITIAL_RECENT_TASKS = [
  { sl: 1, name: "PE REGISTRATION Approve", by: "Sabana Rai", on: "13-11-2014", status: "Approval Pending" },
  { sl: 2, name: "BANK USER REGISTRATION Approve", by: "Bakhane Pun", on: "11-11-2014", status: "Approval Pending" },
  { sl: 3, name: "BANK USER REGISTRATION Approve", by: "Biraja Chhetri", on: "10-11-2014", status: "Approval Pending" },
  { sl: 4, name: "IC REGISTRATION Approve", by: "Umesh Sharma", on: "11-11-2014", status: "Approval Pending" },
  { sl: 5, name: "BIDDER REGISTRATION Approve", by: "Aabi Kapoor", on: "17-10-2014", status: "Approval Pending" },
];

// --- Context & State Management ---
const SimulatorContext = createContext<any>(null);

function SimulatorProvider({ children }: { children: React.ReactNode }) {
  const [pendingTasks, setPendingTasks] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("egp_pending_tasks");
      if (saved) return JSON.parse(saved);
    }
    return INITIAL_PENDING_TASKS;
  });

  const [recentTasks, setRecentTasks] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("egp_recent_tasks");
      if (saved) return JSON.parse(saved);
    }
    return INITIAL_RECENT_TASKS;
  });

  // Persist to LocalStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("egp_pending_tasks", JSON.stringify(pendingTasks));
      localStorage.setItem("egp_recent_tasks", JSON.stringify(recentTasks));
    }
  }, [pendingTasks, recentTasks]);

  // Reset function for trainees
  const resetSimulator = () => {
    setPendingTasks(INITIAL_PENDING_TASKS);
    setRecentTasks(INITIAL_RECENT_TASKS);
    if (typeof window !== "undefined") {
      localStorage.removeItem("egp_pending_tasks");
      localStorage.removeItem("egp_recent_tasks");
    }
    alert("Simulator has been reset to its initial state.");
  };

  // Mock function to simulate a form submission
  const completeTask = (taskLabel: string) => {
    setPendingTasks((prev: any[]) =>
      prev.map(t => (t.label === taskLabel && t.count > 0 ? { ...t, count: t.count - 1 } : t))
    );
    
    const newTask = {
      sl: recentTasks.length + 1,
      name: `${taskLabel} Submitted`,
      by: LOGGED_IN_USER,
      on: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      status: "Submitted"
    };
    setRecentTasks((prev: any[]) => [newTask, ...prev]);
    alert(`${taskLabel} successfully submitted in simulator!`);
  };

  return (
    <SimulatorContext.Provider value={{ pendingTasks, recentTasks, resetSimulator, completeTask }}>
      {children}
    </SimulatorContext.Provider>
  );
}

const useSimulator = () => useContext(SimulatorContext);

// --- Reusable UI ---
function Field({ label, required, children, colSpan = 1 }: { label: string; required?: boolean; children: React.ReactNode, colSpan?: number }) {
  return (
    <div className={`flex items-center text-xs mb-2 col-span-${colSpan}`}>
      <label className="w-1/3 text-gray-700 font-medium pr-2 text-right">
        {label} {required && <span className="text-red-600">*</span>} :
      </label>
      <div className="w-2/3">
        {children}
      </div>
    </div>
  );
}

const inputCls = "w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white shadow-inner";

// --- Layout Components ---
function Header() {
  const { resetSimulator } = useSimulator();

  return (
    <header className="bg-[#990000] text-white">
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex items-center gap-3">
          {/* GyanHub Logo Placeholder */}
          <div className="h-12 w-12 flex items-center justify-center bg-white text-[#990000] font-extrabold text-xs rounded-full border-2 border-yellow-500 p-1 text-center leading-none">
            Gyan<br/>Hub
          </div>
          <div>
            <div className="font-bold text-lg leading-tight flex items-baseline gap-2">
              Government of Nepal 
              <span className="text-[10px] font-normal text-yellow-300 italic tracking-wide">
                (created as a sample for learning purpose only)
              </span>
            </div>
            <div className="text-xs leading-tight">Public Procurement Monitoring Office (PPMO)</div>
            <div className="text-xs leading-tight">National Electronic Government Procurement System</div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 mb-1">
            <button 
              onClick={resetSimulator}
              className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-black text-[10px] font-bold px-2 py-1 rounded shadow-sm transition-colors mr-2"
              title="Reset Simulator Data"
            >
              <RotateCcw size={10} /> Reset Simulator
            </button>
            <div className="bg-white flex items-center px-1 rounded text-gray-800">
              <input type="text" className="outline-none text-xs px-1 w-32" />
              <Search size={12} className="text-red-800" />
            </div>
            <span className="text-[10px] hover:underline cursor-pointer">Advanced Search</span>
          </div>
          <div className="text-[10px] mb-1">Server Time: {SERVER_TIME}</div>
          <div className="flex items-center justify-end gap-2 text-xs">
            <span>Welcome : <strong>{LOGGED_IN_USER}</strong><br/>{LOGGED_IN_ROLE}</span>
            <User size={24} className="bg-white/20 p-1 rounded" />
          </div>
        </div>
      </div>
    </header>
  );
}

function Navigation({ setRoute }: { setRoute: (r: string) => void }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const menus = [
    { label: "Home", action: () => setRoute("dashboard") },
    { 
      label: "Procurement Preparation", 
      sub: [
        { label: "Master Procurement Plan", action: () => setRoute("mpp") },
        { label: "Annual Procurement Plan", action: () => setRoute("app") },
        { label: "Procurement Document", action: () => {} },
        { label: "Bid Addendum", action: () => {} },
        { label: "Bid Query", action: () => {} },
      ]
    },
    { label: "Procurement Execution", sub: [] },
    { 
      label: "Admin", 
      sub: [
        { label: "User Management", action: () => setRoute("pe-user") },
        { label: "Public Entity", action: () => setRoute("pe-reg") },
      ] 
    },
  ];

  return (
    <nav className="bg-[#2A2A2A] text-white text-[11px] relative z-50 border-b-4 border-[#7A0000]">
      <ul className="flex px-4">
        {menus.map((m) => (
          <li 
            key={m.label}
            className="relative"
            onMouseEnter={() => m.sub && setOpenMenu(m.label)}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button 
              onClick={m.action}
              className="px-4 py-2 hover:bg-[#7A0000] flex items-center gap-1 transition-colors"
            >
              {m.label} {m.sub && m.sub.length > 0 && <ChevronDown size={10} />}
            </button>
            {m.sub && m.sub.length > 0 && openMenu === m.label && (
              <ul className="absolute left-0 top-full bg-[#333333] min-w-[200px] shadow-lg border border-gray-600">
                {m.sub.map(s => (
                  <li key={s.label}>
                    <button onClick={s.action} className="w-full text-left px-4 py-2 hover:bg-[#7A0000] border-b border-gray-600 last:border-0">
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Sidebars() {
  const { pendingTasks } = useSimulator();

  return (
    <>
      <div className="w-56 flex flex-col gap-4">
        <div>
          <div className="text-[#990000] font-bold text-xs border-b-2 border-[#990000] mb-2 uppercase tracking-wide">
            MY PENDING TASKS
          </div>
          <ul className="text-xs divide-y divide-gray-200 border border-gray-200 bg-white">
            {pendingTasks.map((t: any) => (
              <li key={t.id} className="flex justify-between items-center p-2 hover:bg-gray-50 cursor-pointer">
                <span className="text-gray-700">{t.label}</span>
                <span className="bg-gray-200 text-gray-700 text-[10px] px-1.5 rounded-full">{t.count}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <button className="flex items-center gap-2 bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-300 p-2 text-xs font-bold text-red-800 rounded shadow-sm hover:from-gray-50 hover:to-gray-100">
          <ClipboardList size={16} className="text-blue-500" /> My Recent Tasks
        </button>
        <button className="flex items-center gap-2 bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-300 p-2 text-xs font-bold text-red-800 rounded shadow-sm hover:from-gray-50 hover:to-gray-100">
          <History size={16} className="text-red-500" /> My Task History
        </button>
      </div>
    </>
  );
}

function RightSidebar() {
  return (
    <div className="w-56 flex flex-col gap-4">
      <div>
        <div className="text-[#990000] font-bold text-xs border-b-2 border-[#990000] mb-2 uppercase tracking-wide">
          USEFUL LINKS
        </div>
        <ul className="text-[11px] text-blue-700 divide-y divide-gray-100">
          <li className="py-1.5 hover:underline cursor-pointer">Public Procurement Monitoring Office</li>
          <li className="py-1.5 hover:underline cursor-pointer">National Portal of Nepal</li>
          <li className="py-1.5 hover:underline cursor-pointer">Office of Prime Minister</li>
        </ul>
      </div>
      <div>
        <div className="text-[#990000] font-bold text-xs border-b-2 border-[#990000] mb-2 uppercase tracking-wide">
          DOWNLOADS
        </div>
        <ul className="text-[11px] text-blue-700 divide-y divide-gray-100">
          <li className="py-1.5 hover:underline cursor-pointer">Public Procurement Act</li>
          <li className="py-1.5 hover:underline cursor-pointer">Public Procurement Regulation</li>
          <li className="py-1.5 hover:underline cursor-pointer">Electronic Transaction Act</li>
        </ul>
      </div>
    </div>
  );
}

// --- Page Components ---
function Dashboard() {
  const { recentTasks } = useSimulator();

  return (
    <div className="flex-1">
      <div className="text-[#990000] font-bold text-xs border-b-2 border-[#990000] mb-2 uppercase tracking-wide">
        RECENT TASKS
      </div>
      <table className="w-full text-xs border border-gray-200 bg-white">
        <thead>
          <tr className="bg-[#990000] text-white">
            <th className="p-2 border-r border-red-900 font-medium">Sl. No.</th>
            <th className="p-2 border-r border-red-900 font-medium">Task Name</th>
            <th className="p-2 border-r border-red-900 font-medium">Assigned By</th>
            <th className="p-2 border-r border-red-900 font-medium">Assigned On</th>
            <th className="p-2 font-medium">Current Status</th>
          </tr>
        </thead>
        <tbody>
          {recentTasks.map((t: any, i: number) => (
            <tr key={i} className="border-b border-gray-200 text-center hover:bg-gray-50">
              <td className="p-2 border-r border-gray-200">{t.sl}</td>
              <td className="p-2 border-r border-gray-200 text-left">{t.name}</td>
              <td className="p-2 border-r border-gray-200">{t.by}</td>
              <td className="p-2 border-r border-gray-200">{t.on}</td>
              <td className="p-2 text-gray-600">{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PERegistration({ setRoute }: { setRoute: (r: string) => void }) {
  const { completeTask } = useSimulator();

  const handleSubmit = () => {
    completeTask("PE REGISTRATION");
    setRoute("dashboard");
  };

  return (
    <div className="flex-1 bg-white border border-gray-200 p-4">
      <div className="text-xs text-gray-600 mb-4">Fields marked with (*) are mandatory.</div>
      
      {/* PE Details */}
      <div className="border-b-2 border-[#990000] text-[#990000] font-bold text-xs mb-3 pb-1">PE Details</div>
      <div className="w-3/4 mb-6">
        <Field label="Name of PE" required>
          <div className="flex items-center gap-2">
            <input className={inputCls} defaultValue={SAMPLE_PE} />
            <span className="text-[10px] text-green-700 italic whitespace-nowrap">'{SAMPLE_PE}' is available</span>
          </div>
        </Field>
        <Field label="Parent PE"><input className={inputCls} /></Field>
        <Field label="Acronym"><input className={inputCls} /></Field>
        <Field label="Description" required><textarea className={inputCls} rows={3} defaultValue="testDescription" /></Field>
        <Field label="Office Category" required>
          <select className={inputCls}>
            <option>Government Organization / Boards</option>
          </select>
        </Field>
        <Field label="Website"><input className={inputCls} /></Field>
      </div>

      {/* Address Details */}
      <div className="border-b-2 border-[#990000] text-[#990000] font-bold text-xs mb-3 pb-1">Address Details</div>
      <div className="w-3/4">
        <Field label="Address Line 1" required><input className={inputCls} defaultValue="265th testAddress" /></Field>
        <Field label="Address Line 2"><input className={inputCls} /></Field>
        <Field label="Address Line 3"><input className={inputCls} /></Field>
        <Field label="City"><input className={inputCls} /></Field>
        <Field label="District" required>
          <select className={inputCls}>
            <option>Kathmandu</option>
          </select>
        </Field>
        <Field label="Municipality"><input className={inputCls} defaultValue="Kathmandu" /></Field>
        <Field label="VDC">
          <select className={inputCls}>
            <option>-Select VDC-</option>
          </select>
        </Field>
        <Field label="Fax No. 1" required><input className={inputCls} defaultValue="90515253" /></Field>
        <Field label="Fax No. 2"><input className={inputCls} /></Field>
        <Field label="Contact No. 1" required><input className={inputCls} defaultValue="9891029394" /></Field>
        <Field label="Contact No. 2"><input className={inputCls} /></Field>
      </div>

      <div className="flex justify-center gap-2 mt-6">
        <button onClick={handleSubmit} className="bg-[#990000] text-white text-xs px-4 py-1.5 rounded hover:bg-red-800">Submit</button>
        <button className="bg-[#990000] text-white text-xs px-4 py-1.5 rounded hover:bg-red-800">Reset</button>
      </div>
    </div>
  );
}

function MasterProcurementPlan({ setRoute }: { setRoute: (r: string) => void }) {
  const { completeTask } = useSimulator();

  const handleSave = () => {
    completeTask("Master Procurement Plan");
    setRoute("dashboard");
  };

  return (
    <div className="flex-1 bg-white border border-gray-200 p-4">
      <div className="text-sm font-bold text-gray-800 mb-2">Master Procurement Plan Project - Create</div>
      <div className="text-xs text-gray-600 mb-4">Fields marked with (*) are mandatory.</div>
      
      <div className="border-b-2 border-[#990000] text-[#990000] font-bold text-xs mb-3 pb-1">MPP Details</div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-6">
        <Field label="Entity Name"><input className={`${inputCls} bg-gray-100`} defaultValue="Department of electricity alt" readOnly /></Field>
        <Field label="Start Fiscal Year" required>
          <select className={inputCls}><option>2071/72</option></select>
        </Field>
        <Field label="Name Of Project" required><input className={inputCls} defaultValue="Test MPP II" /></Field>
        <Field label="Budget Sub-head No." required><input className={inputCls} defaultValue="Bud-223" /></Field>
      </div>

      <div className="border-b-2 border-[#990000] text-[#990000] font-bold text-xs mb-3 pb-1">Project Details</div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-1">
        <Field label="Procurement Description" required><textarea className={inputCls} rows={3} defaultValue="Test description" /></Field>
        <Field label="First FY (2071/72)"><input className={inputCls} defaultValue="50000000" /></Field>
        
        <Field label="Procurement Category" required>
          <select className={inputCls}><option>Works</option></select>
        </Field>
        <Field label="Second FY (2)"><input className={inputCls} defaultValue="50000000" /></Field>
        
        <Field label="Procurement Method/Procedure" required>
          <select className={inputCls}><option>NCB</option></select>
        </Field>
        <Field label="Third FY (3)"><input className={inputCls} defaultValue="50000000" /></Field>
        
        <Field label="No. Of Package" required><input className={inputCls} defaultValue="2" /></Field>
        <Field label="Fourth FY (4)"><input className={inputCls} defaultValue="50000000" /></Field>
        
        <Field label="Type Of Contract" required>
          <select className={inputCls}><option>Unit rate contract</option></select>
        </Field>
        <Field label="Fifth FY (5)"><input className={inputCls} defaultValue="50000000" /></Field>
        
        <Field label="1st Year (1 Year starting from 2071/72 inclusive Base Year)" required>
          <input className={inputCls} defaultValue="1" />
        </Field>
        <Field label="Estimated Amount(NPR)"><input className={inputCls} defaultValue="250000000" /></Field>
        
        <Field label="Remarks"><textarea className={inputCls} rows={2} defaultValue="test" /></Field>
        <Field label="Amount"><input className={inputCls} /></Field>
      </div>

      <div className="flex justify-center gap-2 mt-6">
        <button onClick={() => setRoute("dashboard")} className="bg-[#990000] text-white text-xs px-3 py-1 rounded">Back</button>
        <button className="bg-[#990000] text-white text-xs px-3 py-1 rounded">Reset</button>
        <button onClick={handleSave} className="bg-[#990000] text-white text-xs px-3 py-1 rounded">Save</button>
        <button className="bg-[#990000] text-white text-xs px-3 py-1 rounded flex items-center gap-1">Add Project</button>
        <button onClick={() => setRoute("dashboard")} className="bg-[#990000] text-white text-xs px-3 py-1 rounded">Cancel</button>
      </div>
    </div>
  );
}

// --- Main App Wrapper ---
function NepalEGPApp() {
  const [route, setRoute] = useState("dashboard");

  return (
    <div className="min-h-screen bg-[#F0F0F0] font-sans text-gray-800 flex flex-col">
      <Header />
      <Navigation setRoute={setRoute} />
      
      <main className="flex-1 flex gap-4 p-4 max-w-7xl mx-auto w-full">
        {route === "dashboard" && (
          <>
            <Sidebars />
            <Dashboard />
            <RightSidebar />
          </>
        )}
        
        {route === "pe-reg" && (
          <>
            <Sidebars />
            <PERegistration setRoute={setRoute} />
          </>
        )}

        {route === "mpp" && (
          <MasterProcurementPlan setRoute={setRoute} />
        )}
        
        {route === "app" && (
          <div className="flex-1 bg-white p-8 text-center border border-gray-300 text-gray-500">
            Annual Procurement Plan Module (Similar layout to MPP)
          </div>
        )}
        
        {route === "pe-user" && (
           <div className="flex-1 bg-white p-8 text-center border border-gray-300 text-gray-500">
             Public Entity User Management Module 
           </div>
        )}
      </main>

      <footer className="bg-[#333333] text-gray-400 text-[10px] py-4 text-center">
        About US | Terms & Conditions | Disclaimer | FAQ | Help | Date Converter<br/><br/>
        Copyright © 2026 GyanHub. (Created as a sample for learning purpose only). Not affiliated with Govt of Nepal.
      </footer>
    </div>
  );
}

export default function NepalEGP() {
  return (
    <SimulatorProvider>
      <NepalEGPApp />
    </SimulatorProvider>
  );
}