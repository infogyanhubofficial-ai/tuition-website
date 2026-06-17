"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Edit2, Trash2, X, Upload, ExternalLink, Loader2 } from "lucide-react";
import { Certificate, Syllabus } from "@/app/adminN/certificate/types";
import { toast } from "react-hot-toast";

interface RegistryViewProps {
  data: Certificate[];
  syllabi: Syllabus[];
  refresh: () => void;
  onSwitchTab: () => void;
}

export default function RegistryView({ data, syllabi, refresh, onSwitchTab }: RegistryViewProps) {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form State (Strictly for editing now)
  const [form, setForm] = useState({
    id: '', name: '', email: '', syllabus_name: '',
    issue_date: '', certificate_code: '', existing_image: '', file: null as File | null
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('certificates').getPublicUrl(path);
    return data.publicUrl;
  };

  const openEditModal = (cert: Certificate) => {
    setForm({
      id: cert.id, 
      name: cert.name || '', 
      email: cert.email || '', 
      syllabus_name: cert.syllabus_name || '',
      issue_date: cert.issue_date || new Date().toISOString().split('T')[0],
      certificate_code: cert.certificate_code || '', 
      existing_image: cert.certificate_image || '', 
      file: null
    });
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.id) return; // Guard clause just in case
    if (!form.name || !form.email || !form.syllabus_name) { 
      toast.error('Please fill out all text fields.'); 
      return; 
    }
    
    setUploading(true);
    let finalImageUrl = form.existing_image;
    
    // Handle optional image replacement
    if (form.file) {
      const fileExt = form.file.name.split('.').pop();
      const fileName = `${Date.now()}_${form.name.replace(/\s+/g, '_')}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('certificates').upload(fileName, form.file);
      
      if (uploadError) { 
        toast.error('Storage Upload Failed: ' + uploadError.message); 
        setUploading(false); 
        return; 
      }
      const { data: { publicUrl } } = supabase.storage.from('certificates').getPublicUrl(uploadData.path);
      finalImageUrl = publicUrl;
    }

    const matchingSyllabus = syllabi.find(s => s.name === form.syllabus_name);
    const resolvedSyllabusId = matchingSyllabus ? matchingSyllabus.id : null;
    
    const payload = { 
      name: form.name, 
      email: form.email, 
      syllabus_name: form.syllabus_name, 
      syllabus_id: resolvedSyllabusId, 
      issue_date: form.issue_date, 
      certificate_image: finalImageUrl 
    };

    const { error: updateError } = await supabase.from('certificates').update(payload).eq('id', form.id); 

    setUploading(false);
    
    if (!updateError) { 
      toast.success('Certificate Updated');
      setEditModalOpen(false); 
      refresh(); 
    } else {
      toast.error('Database Error: ' + updateError.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Permanently delete this certificate record? This action cannot be undone.")) {
      const { error } = await supabase.from("certificates").delete().eq("id", id);
      if (error) toast.error("Delete Failed: " + error.message); 
      else {
        toast.success("Certificate deleted");
        refresh();
      }
    }
  };

  // Filtration & Pagination
  const filteredData = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return data.filter(cert => 
      (cert.name && cert.name.toLowerCase().includes(s)) ||
      (cert.email && cert.email.toLowerCase().includes(s)) ||
      (cert.syllabus_name && cert.syllabus_name.toLowerCase().includes(s)) ||
      (cert.certificate_code && cert.certificate_code.toLowerCase().includes(s))
    );
  }, [data, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email, course, or certificate code..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-700" 
          />
        </div>
        <button
          onClick={onSwitchTab}
          className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all whitespace-nowrap"
        >
          <Upload size={18} /> Generate New
        </button>
      </div>

      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6">Student Credentials</th>
                <th className="p-6">Program Details</th>
                <th className="p-6">Issuance Info</th>
                <th className="p-6 text-right">Registry Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map(cert => (
                <tr
                  key={cert.id}
                  className="border-b border-slate-50 hover:bg-indigo-50/50 cursor-pointer transition-colors"
                  onClick={() => cert.certificate_image && setPreviewImage(cert.certificate_image)}
                >
                  <td className="p-6">
                    <p className="font-bold text-slate-900">{cert.name}</p>
                    <p className="text-sm text-slate-500 mt-1 break-all">{cert.email}</p>
                  </td>
                  <td className="p-6"><p className="font-bold text-slate-800">{cert.syllabus_name}</p></td>
                  <td className="p-6">
                    <p className="text-sm font-bold text-slate-800">{cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : 'N/A'}</p>
                    <p className="text-[10px] font-black tracking-widest text-indigo-500 bg-indigo-50 px-2 py-1 rounded inline-block mt-2 border border-indigo-100">{cert.certificate_code || '-'}</p>
                  </td>
                  <td className="p-6 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(cert)} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors" title="Edit Record"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(cert.id)} className="p-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors" title="Delete Record"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-medium text-lg">No matching certificates found in the registry.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {filteredData.length > 0 && (
          <div className="flex flex-wrap items-center justify-between p-6 border-t border-slate-100 bg-slate-50 shrink-0 gap-4">
            <span className="text-sm font-bold text-slate-500">
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} entries
            </span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm">Previous</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* FULL SIZE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 p-6 backdrop-blur-md" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute -top-12 right-0 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
              <X size={24} />
            </button>
            <img src={getImageUrl(previewImage)} alt="Certificate Verification Preview" className="w-full rounded-2xl shadow-2xl ring-1 ring-white/20" />
            <div className="mt-6 flex justify-center">
                <a href={getImageUrl(previewImage)} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full text-sm font-bold transition-all shadow-lg" onClick={e => e.stopPropagation()}>
                <ExternalLink size={16} /> Open Original File
                </a>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => !uploading && setEditModalOpen(false)}>
          <div className="bg-white rounded-[30px] shadow-2xl max-w-xl w-full relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditModalOpen(false)} disabled={uploading} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 z-10 bg-slate-100 rounded-full p-2"><X size={18} /></button>
            <div className="p-8 border-b border-slate-100 bg-slate-50">
              <h3 className="text-2xl font-black text-slate-900">Edit Official Record</h3>
              <p className="text-sm text-slate-500 font-medium mt-2">Update information directly in the secure verified registry.</p>
            </div>
            
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Student Full Name</label>
                    <input type="text" className="w-full bg-slate-50 p-4 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm transition-all" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Email Address</label>
                    <input type="email" className="w-full bg-slate-50 p-4 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm transition-all" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Course / Program Name</label>
                <input list="syllabi-options" type="text" className="w-full bg-slate-50 p-4 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm transition-all" value={form.syllabus_name} onChange={e => setForm({ ...form, syllabus_name: e.target.value })} placeholder="e.g. Graphic Design Masterclass" />
                <datalist id="syllabi-options">{syllabi.map(s => <option key={s.id} value={s.name} />)}</datalist>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Issue Date</label>
                    <input type="date" className="w-full bg-slate-50 p-4 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm transition-all" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Certificate Code</label>
                    <input type="text" disabled className="w-full bg-slate-100 p-4 rounded-xl outline-none border border-slate-200 text-indigo-500 font-mono font-black tracking-wider text-sm cursor-not-allowed" value={form.certificate_code} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Certificate File (PNG/JPG)</label>
                <label className="w-full flex items-center justify-center gap-3 bg-indigo-50 text-indigo-600 p-6 rounded-2xl border-2 border-dashed border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-all font-bold text-sm group">
                  <Upload size={20} className="group-hover:-translate-y-1 transition-transform" />
                  {form.file ? form.file.name : form.existing_image ? 'Update Existing Image' : 'Click to Browse Local Files'}
                  <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={e => { if (e.target.files && e.target.files[0]) setForm({ ...form, file: e.target.files[0] }); }} />
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setEditModalOpen(false)} disabled={uploading} className="px-6 py-3.5 font-bold text-slate-500 hover:text-slate-800 disabled:opacity-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={uploading} className="px-8 py-3.5 rounded-xl font-black bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2">
                {uploading ? <Loader2 size={18} className="animate-spin" /> : 'Commit Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}