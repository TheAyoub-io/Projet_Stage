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
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 2000,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                    onClick={onClose}
                >
                    {/* Header bar */}
                    <div
                        style={{
                            padding: '1rem 2rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: 'white',
                            background: 'rgba(0,0,0,0.3)',
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>
                                {currentDoc.document_type.replace('_', ' ').toUpperCase()}
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                Document {currentIndex + 1} sur {documents.length}
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {isImage && (
                                <>
                                    <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="btn-text" style={{ color: 'white' }} title="Zoomer"><ZoomIn size={20} /></button>
                                    <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="btn-text" style={{ color: 'white' }} title="Dézoomer"><ZoomOut size={20} /></button>
                                    <button onClick={() => setRotation(r => (r + 90) % 360)} className="btn-text" style={{ color: 'white' }} title="Pivoter"><RotateCw size={20} /></button>
                                </>
                            )}
                            <a href={fileUrl} download target="_blank" rel="noreferrer" className="btn-text" style={{ color: 'white' }} title="Télécharger">
                                <Download size={20} />
                            </a>
                            <button onClick={onClose} className="btn-text" style={{ color: 'white', marginLeft: '1rem' }}>
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {documents.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                    style={{ position: 'absolute', left: '2rem', zIndex: 10, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <ChevronLeft size={32} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                    style={{ position: 'absolute', right: '2rem', zIndex: 10, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <ChevronRight size={32} />
                                </button>
                            </>
                        )}

                        <motion.div
                            key={currentDoc.id}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 20 }}
                            style={{
                                maxWidth: '90%',
                                maxHeight: '90%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            {isImage ? (
                                <img
                                    src={fileUrl}
                                    alt={currentDoc.document_type}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                        transition: 'transform 0.2s',
                                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                                        borderRadius: '4px'
                                    }}
                                />
                            ) : isPDF ? (
                                <iframe
                                    src={fileUrl}
                                    style={{
                                        width: '80vw',
                                        height: '80vh',
                                        border: 'none',
                                        background: 'white',
                                        borderRadius: '8px',
                                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                                    }}
                                    title="PDF Viewer"
                                />
                            ) : (
                                <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', textAlign: 'center' }}>
                                    <FileText size={64} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                                    <p style={{ color: 'var(--text-main)', fontWeight: '600' }}>Format non supporté pour la prévisualisation</p>
                                    <a href={fileUrl} className="btn btn-primary" style={{ marginTop: '1rem' }}>Télécharger le fichier</a>
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
