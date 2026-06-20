import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const IntegratedDocumentViewer = ({ isOpen, onClose, documents, initialIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    if (!isOpen || !documents || documents.length === 0) return null;

    const currentDoc = documents[currentIndex];
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(currentDoc.file_url);
    const isPDF = /\.pdf$/i.test(currentDoc.file_url);
    const fileUrl = `http://localhost:8000/${currentDoc.file_url}`;

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % documents.length);
        setZoom(1);
        setRotation(0);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + documents.length) % documents.length);
        setZoom(1);
        setRotation(0);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[2000] flex flex-col"
                    onClick={onClose}
                >
                    {/* Header bar */}
                    <div
                        className="px-6 py-4 flex justify-between items-center bg-slate-900/50 border-b border-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        <div>
                            <h3 className="text-white font-bold uppercase tracking-wider text-sm">
                                {currentDoc.document_type.replace('_', ' ')}
                            </h3>
                            <p className="text-white/50 text-xs font-medium">
                                Document {currentIndex + 1} sur {documents.length}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {isImage && (
                                <div className="flex bg-white/10 rounded-lg p-1">
                                    <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="p-2 text-white hover:bg-white/10 rounded-md transition-colors" title="Zoomer"><ZoomIn size={18} /></button>
                                    <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-2 text-white hover:bg-white/10 rounded-md transition-colors" title="Dézoomer"><ZoomOut size={18} /></button>
                                    <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-2 text-white hover:bg-white/10 rounded-md transition-colors" title="Pivoter"><RotateCw size={18} /></button>
                                </div>
                            )}
                            <a href={fileUrl} download target="_blank" rel="noreferrer" className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors" title="Télécharger">
                                <Download size={20} />
                            </a>
                            <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors ml-2">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden p-10">
                        {documents.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                    className="absolute left-6 z-10 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
                                >
                                    <ChevronLeft size={28} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                    className="absolute right-6 z-10 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
                                >
                                    <ChevronRight size={28} />
                                </button>
                            </>
                        )}

                        <motion.div
                            key={currentDoc.id}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full h-full flex items-center justify-center"
                            onClick={e => e.stopPropagation()}
                        >
                            {isImage ? (
                                <img
                                    src={fileUrl}
                                    alt={currentDoc.document_type}
                                    className="max-w-full max-h-full object-contain shadow-2xl rounded-sm transition-transform duration-200"
                                    style={{
                                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                    }}
                                />
                            ) : isPDF ? (
                                <iframe
                                    src={fileUrl}
                                    className="w-full max-w-5xl h-full bg-white rounded-xl shadow-2xl"
                                    title="PDF Viewer"
                                />
                            ) : (
                                <div className="bg-white p-12 rounded-3xl text-center max-w-sm">
                                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <FileText size={40} />
                                    </div>
                                    <h4 className="text-slate-900 font-bold text-lg mb-2">Format non supporté</h4>
                                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">Nous ne pouvons pas prévisualiser ce type de fichier directement.</p>
                                    <a href={fileUrl} className="btn btn-primary w-full py-3">Télécharger le fichier</a>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default IntegratedDocumentViewer;
