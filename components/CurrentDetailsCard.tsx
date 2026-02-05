import React, { useState, useMemo } from 'react';
import { OceanCurrent } from '../types';
import { Info, Fish, Lightbulb, Thermometer, Timer, MapPin, ArrowRight, BrainCircuit, Ruler, Clock, Sparkles } from 'lucide-react';

interface CurrentDetailsCardProps {
  current: OceanCurrent;
  onCancel: () => void;
  onLaunch: () => void;
}

type Tab = 'overview' | 'life' | 'facts';

const CurrentDetailsCard: React.FC<CurrentDetailsCardProps> = ({ current, onCancel, onLaunch }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

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
  // speed m/s -> km/day: speed * 3.6 * 24
  const durationDays = Math.round(distanceKm / (parseFloat(current.avgSpeed) * 3.6 * 24)); 

  return (
    <div className="text-left flex flex-col h-[380px]"> 
      {/* HEADER */}
      <div className="flex justify-between items-center mb-2 shrink-0">
        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
          {current.name}
        </h3>
        <span className="text-3xl">🌊</span>
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-3 shrink-0">
        {[
          { id: 'overview', label: 'Overview', icon: Info, color: 'text-blue-600' },
          { id: 'life', label: 'Wildlife', icon: Fish, color: 'text-teal-600' },
          { id: 'facts', label: 'Fun Facts', icon: Lightbulb, color: 'text-indigo-600' }
        ].map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeTab === tab.id ? 'bg-white shadow-sm ' + tab.color : 'text-slate-400 hover:text-slate-600'}`}
            >
                {React.createElement(tab.icon, { size: 16 })} 
                {tab.label}
            </button>
        ))}
      </div>

      {/* CONTENT AREA: Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mb-2">
        
        {activeTab === 'overview' && (
          <div className="animate-fade-in space-y-3">
             {/* Description Bubble */}
             <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-100 text-sm text-slate-700 leading-relaxed font-medium">
                {current.description}
             </div>

             {/* 4-Grid Stats */}
             <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex items-center gap-3">
                   <div className="bg-red-100 p-1.5 rounded-lg text-red-500 shrink-0"><Thermometer size={16} /></div>
                   <div className="min-w-0">
                      <div className="text-[10px] uppercase font-bold text-slate-400 truncate">Temp</div>
                      <div className="font-bold text-slate-700 text-base leading-none">{current.avgTemp}</div>
                   </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex items-center gap-3">
                   <div className="bg-orange-100 p-1.5 rounded-lg text-orange-500 shrink-0"><Timer size={16} /></div>
                   <div className="min-w-0">
                      <div className="text-[10px] uppercase font-bold text-slate-400 truncate">Speed</div>
                      <div className="font-bold text-slate-700 text-base leading-none">{current.avgSpeed}</div>
                   </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex items-center gap-3">
                   <div className="bg-purple-100 p-1.5 rounded-lg text-purple-500 shrink-0"><Ruler size={16} /></div>
                   <div className="min-w-0">
                      <div className="text-[10px] uppercase font-bold text-slate-400 truncate">Distance</div>
                      <div className="font-bold text-slate-700 text-base leading-none truncate">~{Math.round(distanceKm).toLocaleString()} km</div>
                   </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex items-center gap-3">
                   <div className="bg-green-100 p-1.5 rounded-lg text-green-500 shrink-0"><Clock size={16} /></div>
                   <div className="min-w-0">
                      <div className="text-[10px] uppercase font-bold text-slate-400 truncate">Est. Time</div>
                      <div className="font-bold text-slate-700 text-base leading-none">{durationDays} Days</div>
                   </div>
                </div>
             </div>

             {/* Route Visualization */}
             <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-1.5 truncate max-w-[40%]">
                    <MapPin size={12} className="text-green-500 shrink-0" /> <span className="truncate">{current.startLocation}</span>
                </div>
                <ArrowRight size={14} className="text-slate-300 shrink-0" />
                <div className="flex items-center gap-1.5 truncate max-w-[40%] justify-end">
                    <MapPin size={12} className="text-red-500 shrink-0" /> <span className="truncate">{current.endLocation}</span>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'life' && (
          <div className="animate-fade-in space-y-3">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Fish size={14} /> Key Species
             </div>
             <div className="grid grid-cols-2 gap-3">
                {current.biodiversity.map((life, idx) => (
                    <div key={idx} className="flex flex-col items-center p-3 bg-teal-50 border border-teal-100 rounded-xl text-center">
                        <span className="text-3xl mb-1 filter drop-shadow-sm">{life.emoji}</span>
                        <span className="text-sm font-bold text-teal-900 leading-tight truncate w-full">{life.name}</span>
                        <span className="text-[10px] text-teal-600 bg-teal-100/50 px-2 py-0.5 rounded-full mt-1 font-medium">
                           {life.depth}
                        </span>
                    </div>
                ))}
             </div>
             <p className="text-[10px] text-center text-slate-400 mt-2 italic">
                *Keep an eye out for these animals during your journey!
             </p>
          </div>
        )}

        {activeTab === 'facts' && (
           <div className="animate-fade-in space-y-4">
              {/* Facts Cards */}
              <div className="space-y-3">
                 <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Did You Know?</h4>
                    <div className="h-px bg-indigo-100 flex-1"></div>
                 </div>
                 
                 {current.funFacts && current.funFacts.map((fact, idx) => (
                    <div key={idx} className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 flex gap-3 items-start hover:bg-indigo-50 transition-colors shadow-sm">
                        <div className="bg-white text-yellow-500 p-1.5 rounded-full shadow-sm shrink-0 border border-yellow-100 mt-0.5">
                           <Sparkles size={14} fill="currentColor" className="opacity-80" />
                        </div>
                        <p className="text-sm text-indigo-900 leading-relaxed font-medium">{fact}</p>
                    </div>
                 ))}

                 {!current.funFacts && (
                    <div className="text-center py-4 text-indigo-400 italic text-sm">
                        More secrets coming soon...
                    </div>
                 )}
              </div>

              {/* Challenge Preview */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl p-3 flex items-center justify-between shadow-sm">
                 <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-full text-orange-500 shadow-sm border border-orange-100">
                        <BrainCircuit size={18} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-orange-900">Exploration Quiz</div>
                        <div className="text-xs text-orange-700">{current.quizzes?.length || 0} questions available</div>
                    </div>
                 </div>
                 <div className="text-xs font-bold bg-white text-orange-500 px-3 py-1.5 rounded-lg shadow-sm border border-orange-100">
                    Ready?
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* FOOTER: Standard Buttons */}
      <div className="flex gap-3 pt-3 border-t border-slate-100 shrink-0">
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