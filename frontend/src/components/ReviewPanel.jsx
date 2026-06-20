import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, MessageCircle, FileText, Download, ChevronLeft, ChevronRight } from 'lucide-react';
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
            className="fixed inset-0 z-[1000] flex bg-white dark:bg-gray-900"
        >
            {/* Left: Document Viewer */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 flex flex-col border-r dark:border-gray-700">
                <div className="p-4 bg-white dark:bg-gray-900 border-b flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold">Documents ({application.documents?.length || 0})</h3>
                        <div className="flex gap-1">
                            {application.documents?.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveDocIndex(idx)}
                                    className={`w-2 h-2 rounded-full ${idx === activeDocIndex ? 'bg-primary' : 'bg-gray-300'}`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-outline" onClick={() => setActiveDocIndex(i => Math.max(0, i - 1))}><ChevronLeft size={18} /></button>
                        <button className="btn btn-outline" onClick={() => setActiveDocIndex(i => Math.min((application.documents?.length || 1) - 1, i + 1))}><ChevronRight size={18} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-8 flex justify-center bg-[#525659]">
                    {currentDoc ? (
                        <div className="shadow-2xl max-w-4xl w-full bg-white">
                            <iframe
                                src={`http://localhost:8000${currentDoc.file_url}`}
                                className="w-full h-[120vh] border-none"
                                title="Document Preview"
                            />
                        </div>
                    ) : (
                        <div className="m-auto text-white flex flex-col items-center gap-4">
                            <FileText size={64} opacity={0.2} />
                            <p>Aucun document disponible</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Review Form & Info */}
            <div className="w-[450px] flex flex-col glass-panel" style={{ borderRadius: 0, border: 'none', shadow: 'none' }}>
                <div className="p-6 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black">{application.profile?.full_name}</h2>
                        <p className="text-sm text-gray-500">{application.student_email}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <section>
                        <h4 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4">Informations Dossier</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <InfoItem label="Moyenne" value={`${application.grade_average}/20`} />
                            <InfoItem label="Filière" value={application.filière} />
                            <InfoItem label="Type" value={application.student_type} />
                            <InfoItem label="Statut" value={application.status} />
                        </div>
                    </section>

                    <section>
                        <h4 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4">Pièces Justificatives</h4>
                        <div className="space-y-2">
                            {application.documents?.map((doc, idx) => (
                                <button
                                    key={doc.id}
                                    onClick={() => setActiveDocIndex(idx)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${idx === activeDocIndex ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-100 hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${idx === activeDocIndex ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <FileText size={16} />
                                        </div>
                                        <span className="text-sm font-semibold">{doc.document_type.replace(/_/g, ' ')}</span>
                                    </div>
                                    {idx === activeDocIndex && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                            <MessageCircle size={18} className="text-primary" />
                            Besoin de précision?
                        </h4>
                        <p className="text-xs text-gray-500 mb-4">Ouvrez le chat pour discuter en direct avec l'étudiant concernant son dossier.</p>
                        <button
                            onClick={() => setShowChat(true)}
                            className="btn btn-outline w-full py-2 text-sm"
                        >
                            Ouvrir la Discussion
                        </button>
                    </section>
                </div>

                {/* Action Bar */}
                <div className="p-6 border-t bg-gray-50 dark:bg-gray-900 space-y-3">
                    <div className="flex gap-3">
                        <button
                            onClick={() => onStatusChange(application.id, 'approved')}
                            className="flex-1 btn btn-primary bg-success hover:bg-success/90 border-none py-4"
                        >
                            <CheckCircle size={20} /> Valider
                        </button>
                        <button
                            onClick={() => onStatusChange(application.id, 'rejected')}
                            className="flex-1 btn bg-danger text-white hover:bg-danger/90 border-none py-4"
                        >
                            <XCircle size={20} /> Rejeter
                        </button>
                    </div>
                    <button
                        onClick={() => onStatusChange(application.id, 'incomplete')}
                        className="w-full btn btn-outline border-pink-200 text-pink-600 hover:bg-pink-50 py-4"
                    >
                        <AlertCircle size={20} /> Demander Correction
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
        <p className="text-[10px] text-gray-400 font-bold uppercase">{label}</p>
        <p className="text-sm font-semibold dark:text-white capitalize">{value}</p>
    </div>
);

export default ReviewPanel;
