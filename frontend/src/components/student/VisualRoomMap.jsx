import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Tv, Wifi, ShieldAlert, BadgeInfo, CheckCircle, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const VisualRoomMap = ({ room, profile, application }) => {
  const { t } = useTranslation();
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Generate deterministic roommates based on the room number to simulate a premium layout without DB changes
  const roommates = useMemo(() => {
    if (!room) return [];
    
    // Seed helper
    const getHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };

    const seed = getHash(room.room_number || '101');
    const firstNames = ['Mohamed', 'Youssef', 'Amine', 'Anass', 'Karim', 'Hamza', 'Omar', 'Mehdi', 'Sara', 'Fatima', 'Yasmin', 'Imane', 'Salma', 'Khadija', 'Noura'];
    const lastNames = ['El Idrissi', 'Alaoui', 'Tahiri', 'Mansouri', 'Berrada', 'Amrani', 'Slaoui', 'Bennani', 'Kabbaj', 'Rami'];
    const filieres = ['CPGE - MPSI', 'CPGE - PCSI', 'CPGE - TSI', '2BAC - Sciences Math', '1BAC - Sciences Math', '2BAC - Sciences Éco'];

    const capacity = room.capacity || 3;
    const isMale = room.gender_type === 'Male';
    
    const list = [];
    
    // Primary slot is the current student
    list.push({
      isMe: true,
      name: profile?.full_name || 'Vous',
      initials: profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'VS',
      filiere: application?.filière || 'CPGE',
      gender: room.gender_type,
      status: 'Confirmé',
      bedIndex: 0
    });

    // Populate other slots based on capacity
    for (let i = 1; i < capacity; i++) {
      const isOccupied = (seed + i) % 5 !== 0; // 80% occupied
      if (isOccupied) {
        const fnIdx = (seed + i * 7) % (isMale ? 8 : 7 + (isMale ? 0 : 7)); // offset male/female index
        const lnIdx = (seed + i * 11) % lastNames.length;
        const name = `${firstNames[fnIdx]} ${lastNames[lnIdx]}`;
        const initials = `${firstNames[fnIdx][0]}${lastNames[lnIdx][0]}`;
        const filIdx = (seed + i * 13) % filieres.length;

        list.push({
          isMe: false,
          name,
          initials,
          filiere: filieres[filIdx],
          gender: room.gender_type,
          status: 'Actif',
          bedIndex: i
        });
      } else {
        list.push({
          isMe: false,
          isEmpty: true,
          bedIndex: i
        });
      }
    }

    return list;
  }, [room, profile, application]);

  if (!room) return null;

  const activeSlot = selectedSlot !== null ? roommates.find(r => r.bedIndex === selectedSlot) : null;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Visual map header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Home size={18} />
          </div>
          <div>
            <h4 className="font-black text-slate-900 dark:text-white text-base">Plan Interactif 2D</h4>
            <p className="text-xs text-slate-400 dark:text-gray-500">Chambre {room.room_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Capacité: {room.capacity} personnes
        </div>
      </div>

      {/* SVG Layout Map */}
      <div className="relative aspect-video max-w-md mx-auto w-full border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/20 rounded-[2rem] overflow-hidden p-6 flex items-center justify-center shadow-inner">
        {/* Ambient room outline */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.04),transparent)] dark:bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent)] pointer-events-none" />
        
        {/* Vector Room Diagram */}
        <div className="relative w-full h-full max-w-[340px] max-h-[190px] bg-white dark:bg-slate-900 border-4 border-slate-350 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all duration-300">
          {/* Room Features (Window, Door) */}
          <div className="absolute top-[-4px] left-[40%] right-[40%] h-[4px] bg-sky-300 dark:bg-sky-500 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]" title="Fenêtre" />
          <div className="absolute bottom-[-4px] left-[70%] w-[50px] h-[4px] bg-amber-600 rounded-full" title="Porte d'entrée" />

          {/* Beds Row */}
          <div className="flex justify-between items-center w-full h-full">
            {roommates.map((slot) => {
              const isSelected = selectedSlot === slot.bedIndex;
              let bedStyle = "border-slate-200 bg-slate-50 text-slate-450 hover:border-emerald-300 hover:bg-emerald-50/20";
              
              if (slot.isEmpty) {
                bedStyle = "border-dashed border-slate-300 dark:border-slate-800 bg-transparent text-slate-350 dark:text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/5";
              } else if (slot.isMe) {
                bedStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
              } else {
                bedStyle = "border-indigo-400 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 dark:bg-indigo-950/10 hover:border-emerald-300";
              }

              if (isSelected) {
                bedStyle += " ring-2 ring-emerald-500 border-emerald-500 scale-[1.05]";
              }

              return (
                <motion.button
                  key={slot.bedIndex}
                  whileHover={{ y: -4, scale: isSelected ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSlot(slot.bedIndex === selectedSlot ? null : slot.bedIndex)}
                  className={`w-[74px] h-[105px] border-2 rounded-xl flex flex-col items-center justify-between p-2.5 transition-all cursor-pointer ${bedStyle}`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">Lit {slot.bedIndex + 1}</span>
                  
                  {slot.isEmpty ? (
                    <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600">Libre</span>
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${slot.isMe ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                      {slot.initials}
                    </div>
                  )}

                  <span className="text-[8px] font-black truncate max-w-full">
                    {slot.isEmpty ? 'Libre' : slot.isMe ? 'Vous' : slot.name.split(' ')[0]}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Slot Drawer */}
      <div className="min-h-[110px]">
        <AnimatePresence mode="wait">
          {activeSlot ? (
            <motion.div
              key={selectedSlot}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm flex items-start gap-4"
            >
              {activeSlot.isEmpty ? (
                <>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                    <Tv size={20} />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-800 dark:text-white mb-1">Lit Vacant</h5>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Cette place est actuellement libre et sera affectée par l'administration.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className={`p-3 rounded-xl flex-shrink-0 flex items-center justify-center ${activeSlot.isMe ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'}`}>
                    <User size={20} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h5 className="font-black text-sm text-slate-900 dark:text-white truncate m-0">
                        {activeSlot.name}
                      </h5>
                      {activeSlot.isMe && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                          Moi
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">{activeSlot.filiere}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 flex items-center gap-1">
                        <CheckCircle size={12} className="text-emerald-500" /> {activeSlot.status}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 py-8"
            >
              <BadgeInfo size={24} className="mb-2 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold uppercase tracking-wider mb-1">Explorez votre chambre</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Cliquez sur un lit ci-dessus pour voir le profil de votre colocataire.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Amenities Grid */}
      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800/50 pt-4">
        {[
          { icon: Wifi, label: 'Wi-Fi Internat', desc: 'Débit 100 Mbps' },
          { icon: Tv, label: 'Pavillon Club', desc: 'Salon commun' }
        ].map((item, idx) => (
          <div key={idx} className="flex gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <item.icon size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-900 dark:text-white truncate mb-0.5 uppercase tracking-wide">{item.label}</p>
              <p className="text-[9px] text-slate-450 dark:text-slate-500 truncate">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisualRoomMap;
