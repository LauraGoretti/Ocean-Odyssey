import React, { useState, useMemo, useEffect } from 'react';
import { OceanCurrent } from '../types';
import { generateCurrentImage } from '../services/geminiService';
import { Info, Fish, Lightbulb, Thermometer, Timer, MapPin, ArrowRight, BrainCircuit, Ruler, Clock, Sparkles, Image as ImageIcon } from 'lucide-react';

interface CurrentDetailsCardProps {
  current: OceanCurrent;
  onCancel: () => void;
  onLaunch: () => void;
}

type Tab = 'overview' | 'life' | 'facts';

const CurrentDetailsCard: React.FC<CurrentDetailsCardProps> = ({ current, onCancel, onLaunch }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  // Fetch AI Image when current changes
  useEffect(() => {
    let active = true;
    
    const fetchImage = async () => {
      setLoadingImage(true);
      setImageUrl(null);
      
      const url = await generateCurrentImage(current);
      
      if (active) {
        setImageUrl(url);
        setLoadingImage(false);
      }
    };

    fetchImage();
    
    return () => { active = false; };
  }, [current]);

  // Helper: Calculate approx distance in km along the path
  const distanceKm = useMemo(() => {
    return current.path.reduce((acc, point, i, arr) => {
        if (i === 0) return 0;
        const prev = arr[i-1];
        const R = 6371; // Earth radius km
        const dLat = (point.lat - prev.lat) * Math.PI / 180;
        const dLon = (point.lng - prev.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(prev.lat * Math.PI / 180) * Math.cos(point.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return acc + R * c;
    }, 0);
  }, [current]);

  // Estimate travel time (approx days based on speed m/s continuous flow)
  const durationDays = Math.round(distanceKm / (parseFloat(current.avgSpeed) * 3.6 * 24)); 

  return (
    <div className="text-left flex flex-col h-[400px]"> 
      {/* HEADER */}
      <div className="flex justify-between items-center mb-2 shrink-0">
        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
          {current.name}
        </h3>
        <span className="text-3xl">🌊</span>
      </div>

      {/* BODY: Split View */}
      <div className="flex-1 flex gap-3 min-h-0">
        
        {/* LEFT COLUMN: Content */}
        <div className="flex-1 flex flex-col min-w-0">
           
           {/* TABS */}
           <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-2 shrink-0">
             {[
               { id: 'overview', label: 'Overview', icon: Info, color: 'text-blue-600' },
               { id: 'life', label: 'Wildlife', icon: Fish, color: 'text-teal-600' },
               { id: 'facts', label: 'Fun Facts', icon: Lightbulb, color: 'text-indigo-600' }
             ].map(tab => (
                 <button 
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as Tab)}
                     className={`flex-1 py-1.5 rounded-lg text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeTab === tab.id ? 'bg-white shadow-sm ' + tab.color : 'text-slate-400 hover:text-slate-600'}`}
                 >
                     {React.createElement(tab.icon, { size: 14 })} 
                     <span className="truncate">{tab.label}</span>
                 </button>
             ))}
           </div>

           {/* CONTENT AREA: Scrollable */}
           <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
             
             {activeTab === 'overview' && (
               <div className="animate-fade-in space-y-2">
                  <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-100 text-xs text-slate-700 leading-relaxed font-medium">
                     {current.description}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                     <div className="bg-slate-50 border border-slate-100 rounded-xl p-1.5 flex items-center gap-2">
                        <div className="bg-red-100 p-1 rounded text-red-500 shrink-0"><Thermometer size={14} /></div>
                        <div className="min-w-0">
                           <div className="text-[9px] uppercase font-bold text-slate-400 truncate">Temp</div>
                           <div className="font-bold text-slate-700 text-sm leading-none">{current.avgTemp}</div>
                        </div>
                     </div>
                     <div className="bg-slate-50 border border-slate-100 rounded-xl p-1.5 flex items-center gap-2">
                        <div className="bg-orange-100 p-1 rounded text-orange-500 shrink-0"><Timer size={14} /></div>
                        <div className="min-w-0">
                           <div className="text-[9px] uppercase font-bold text-slate-400 truncate">Speed</div>
                           <div className="font-bold text-slate-700 text-sm leading-none">{current.avgSpeed}</div>
                        </div>
                     </div>
                     <div className="bg-slate-50 border border-slate-100 rounded-xl p-1.5 flex items-center gap-2">
                        <div className="bg-purple-100 p-1 rounded text-purple-500 shrink-0"><Ruler size={14} /></div>
                        <div className="min-w-0">
                           <div className="text-[9px] uppercase font-bold text-slate-400 truncate">Dist</div>
                           <div className="font-bold text-slate-700 text-sm leading-none truncate">{Math.round(distanceKm).toLocaleString()}km</div>
                        </div>
                     </div>
                     <div className="bg-slate-50 border border-slate-100 rounded-xl p-1.5 flex items-center gap-2">
                        <div className="bg-green-100 p-1 rounded text-green-500 shrink-0"><Clock size={14} /></div>
                        <div className="min-w-0">
                           <div className="text-[9px] uppercase font-bold text-slate-400 truncate">Time</div>
                           <div className="font-bold text-slate-700 text-sm leading-none">{durationDays} Days</div>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2 border border-slate-100 text-[10px] font-bold text-slate-600">
                     <div className="flex items-center gap-1 truncate max-w-[40%]">
                         <MapPin size={10} className="text-green-500 shrink-0" /> <span className="truncate">{current.startLocation}</span>
                     </div>
                     <ArrowRight size={12} className="text-slate-300 shrink-0" />
                     <div className="flex items-center gap-1 truncate max-w-[40%] justify-end">
                         <MapPin size={10} className="text-red-500 shrink-0" /> <span className="truncate">{current.endLocation}</span>
                     </div>
                  </div>
               </div>
             )}

             {activeTab === 'life' && (
               <div className="animate-fade-in space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                     {current.biodiversity.map((life, idx) => (
                         <div key={idx} className="flex flex-col items-center p-2 bg-teal-50 border border-teal-100 rounded-xl text-center">
                             <span className="text-2xl mb-1 filter drop-shadow-sm">{life.emoji}</span>
                             <span className="text-xs font-bold text-teal-900 leading-tight truncate w-full">{life.name}</span>
                             <span className="text-[9px] text-teal-600 bg-teal-100/50 px-1.5 py-0.5 rounded-full mt-1 font-medium">
                                {life.depth}
                             </span>
                         </div>
                     ))}
                  </div>
               </div>
             )}

             {activeTab === 'facts' && (
                <div className="animate-fade-in space-y-2">
                   {current.funFacts && current.funFacts.map((fact, idx) => (
                      <div key={idx} className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-2.5 flex gap-2 items-start">
                          <div className="bg-white text-yellow-500 p-1 rounded-full shadow-sm shrink-0 border border-yellow-100 mt-0.5">
                             <Sparkles size={10} fill="currentColor" className="opacity-80" />
                          </div>
                          <p className="text-xs text-indigo-900 leading-relaxed font-medium">{fact}</p>
                      </div>
                   ))}

                   <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl p-2 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2">
                         <div className="bg-white p-1.5 rounded-full text-orange-500 shadow-sm border border-orange-100">
                             <BrainCircuit size={14} />
                         </div>
                         <div>
                             <div className="text-xs font-bold text-orange-900">Quiz</div>
                             <div className="text-[9px] text-orange-700">{current.quizzes?.length || 0} Qs</div>
                         </div>
                      </div>
                   </div>
                </div>
             )}
           </div>
        </div>

        {/* RIGHT COLUMN: Image */}
        <div className="w-[140px] flex-shrink-0 flex flex-col gap-2">
             <div className="flex-1 rounded-xl overflow-hidden bg-slate-100 relative group shadow-inner border border-slate-200">
                {loadingImage ? (
                   <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50">
                      <div className="flex flex-col items-center gap-1 p-2 text-center">
                         <Sparkles size={20} className="animate-spin text-cyan-400" />
                         <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-600 animate-pulse leading-tight">Painting...</span>
                      </div>
                   </div>
                ) : imageUrl ? (
                   <>
                     <img src={imageUrl} alt={current.name} className="w-full h-full object-cover animate-fade-in transition-transform duration-700 group-hover:scale-105" />
                     <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                        <div className="flex items-center gap-1 text-[9px] text-white/90 font-medium justify-center">
                           <Sparkles size={8} /> AI View
                        </div>
                     </div>
                   </>
                ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-1">
                      <ImageIcon size={20} />
                      <span className="text-[9px]">No image</span>
                   </div>
                )}
             </div>
        </div>

      </div>

      {/* FOOTER: Standard Buttons */}
      <div className="flex gap-3 pt-3 border-t border-slate-100 shrink-0 mt-2">
        <button 
          onClick={onCancel}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl text-sm transition"
        >
          Back
        </button>
        <button 
          onClick={onLaunch}
          className="flex-[2] bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl shadow-md transition transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-sm"
        >
          Start Journey 🚀
        </button>
      </div>
    </div>
  );
};

export default CurrentDetailsCard;