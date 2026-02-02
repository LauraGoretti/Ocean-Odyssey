import React from 'react';
import { OceanCurrent } from '../types';

interface CurrentDetailsCardProps {
  current: OceanCurrent;
  onCancel: () => void;
  onLaunch: () => void;
}

const CurrentDetailsCard: React.FC<CurrentDetailsCardProps> = ({ current, onCancel, onLaunch }) => {
  return (
    <div className="text-left">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            {current.name}
          </h3>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-wider mt-1">
            From {current.startLocation} to {current.endLocation}
          </p>
        </div>
        <div className="text-4xl">🌊</div>
      </div>
      
      <p className="my-4 text-slate-700 leading-relaxed bg-blue-50 p-3 rounded-lg border border-blue-100">
        {current.description}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-100 rounded-lg p-2 text-center">
          <span className="block text-xs text-slate-400 font-bold">TEMP</span>
          <span className="font-bold text-slate-700">{current.avgTemp}</span>
        </div>
        <div className="bg-slate-100 rounded-lg p-2 text-center">
          <span className="block text-xs text-slate-400 font-bold">SPEED</span>
          <span className="font-bold text-slate-700">{current.avgSpeed}</span>
        </div>
      </div>

      <div className="mb-6">
        <span className="block text-xs text-slate-400 font-bold mb-2 uppercase">Marine Life to Spot</span>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {current.biodiversity.map((life, idx) => (
                <div key={idx} className="flex-shrink-0 flex items-center gap-2 bg-teal-50 border border-teal-100 px-3 py-2 rounded-lg">
                    <span className="text-xl" role="img" aria-label={life.name}>{life.emoji}</span>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-teal-800">{life.name}</span>
                        <span className="text-[10px] text-teal-600">{life.depth}</span>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={onCancel}
          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold py-3 rounded-xl transition"
        >
          Cancel
        </button>
        <button 
          onClick={onLaunch}
          className="flex-2 w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl shadow-lg transition transform hover:scale-105"
        >
          Launch Bubble! 🚀
        </button>
      </div>
    </div>
  );
};

export default CurrentDetailsCard;