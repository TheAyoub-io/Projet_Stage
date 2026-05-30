import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, MessageCircle, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatWindow from './ChatWindow';

const ReviewPanel = ({ application, onClose, onStatusChange }) => {
    const [activeDocIndex, setActiveDocIndex] = useState(0);
    const [showChat, setShowChat] = useState(false);

    if (!application) return null;

    const currentDoc = application.documents?.[activeDocIndex];

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[1000] flex bg-white dark:bg-slate-900"
        >
            {/* Left: Document Viewer */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 flex flex-col border-r border-slate-200 dark:border-slate-700">
                <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-xs">Documents ({application.documents?.length || 0})</h3>
                        <div className="flex gap-1">
                            {application.documents?.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveDocIndex(idx)}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === activeDocIndex ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" onClick={() => setActiveDocIndex(i => Math.max(0, i - 1))}><ChevronLeft size={18} /></button>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" onClick={() => setActiveDocIndex(i => Math.min((application.documents?.length || 1) - 1, i + 1))}><ChevronRight size={18} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-8 flex justify-center bg-slate-200 dark:bg-slate-950">
                    {currentDoc ? (
                        <div className="shadow-2xl max-w-4xl w-full bg-white rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                            <iframe
                                src={`http://localhost:8000/${currentDoc.file_url}`}
                                className="w-full h-full min-h-[80vh] border-none"
                                title="Document Preview"
                            />
                        </div>
                    ) : (
                        <div className="m-auto text-slate-400 flex flex-col items-center gap-4">
                            <FileText size={64} className="opacity-20" />
                            <p className="font-bold uppercase tracking-widest text-xs">Aucun document disponible</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Review Form & Info */}
            <div className="w-[450px] flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white leading-none mb-1">{application.profile?.full_name}</h2>
                        <p className="text-xs font-medium text-slate-400">{application.student_email}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <section>
                        <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-4">Informations Dossier</h4>
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <InfoItem label="Moyenne" value={`${parseFloat(application.grade_average).toFixed(2)}/20`} />
                            <InfoItem label="Filière" value={application.filière} />
                            <InfoItem label="Type" value={application.student_type} />
                            <InfoItem label="Statut" value={application.status} />
                        </div>
                    </section>

                    <section>
                        <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-4">Pièces Justificatives</h4>
                        <div className="space-y-2">
                            {application.documents?.map((doc, idx) => (
                                <button
                                    key={doc.id}
                                    onClick={() => setActiveDocIndex(idx)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${idx === activeDocIndex ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-50 dark:border-slate-800 hover:border-slate-200'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${idx === activeDocIndex ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                            <FileText size={16} />
                                        </div>
                                        <span className={`text-xs font-bold uppercase tracking-tight ${idx === activeDocIndex ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {doc.document_type.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    {idx === activeDocIndex && <CheckCircle size={16} className="text-blue-600" />}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                            <MessageCircle size={18} className="text-blue-600" />
                            Besoin de précision?
                        </h4>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">Discutez en direct avec l'étudiant concernant son dossier pour éviter un rejet définitif.</p>
                        <button
                            onClick={() => setShowChat(true)}
                            className="btn btn-primary w-full py-2.5 text-xs uppercase tracking-widest shadow-blue-500/20"
                        >
                            Ouvrir le Chat
                        </button>
                    </section>
                </div>

                {/* Action Bar */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 space-y-3">
                    <div className="flex gap-3">
                        <button
                            onClick={() => onStatusChange(application.id, 'approved')}
                            className="flex-1 btn bg-emerald-600 hover:bg-emerald-700 text-white border-none py-3.5 text-sm font-bold shadow-emerald-500/20"
                        >
                            Approuver
                        </button>
                        <button
                            onClick={() => onStatusChange(application.id, 'rejected')}
                            className="flex-1 btn bg-red-600 hover:bg-red-700 text-white border-none py-3.5 text-sm font-bold shadow-red-500/20"
                        >
                            Rejeter
                        </button>
                    </div>
                    <button
                        onClick={() => onStatusChange(application.id, 'incomplete')}
                        className="w-full btn btn-outline border-pink-200 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 py-3 text-xs uppercase tracking-widest font-black"
                    >
                        Demander Correction
                    </button>
                </div>
            </div>

            <ChatWindow
                applicationId={application.id}
                isOpen={showChat}
                onClose={() => setShowChat(false)}
            />
        </motion.div>
    );
};

const InfoItem = ({ label, value }) => (
    <div>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 capitalize truncate">{value}</p>
    </div>
);

export default ReviewPanel;
