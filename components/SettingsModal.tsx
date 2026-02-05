import React from 'react';
import { X, Volume2, Activity, CloudRain, Waves, Fish, Music, Upload, FileAudio, Eye, Zap, Settings } from 'lucide-react';

export interface GameSettings {
  masterVolume: number;
  bgmVolume: number;
  streamVolume: number;
  weatherVolume: number;
  animalVolume: number;
  reduceMotion: boolean;
  weatherEnabled: boolean;
  // Custom Audio URLs (Blob URLs)
  customBackgroundAudio?: string;
  customStreamAudio?: string;
  customWeatherAudio?: string;
  customAnimalAudio?: string;
}

interface SettingsModalProps {
  settings: GameSettings;
  onUpdate: (newSettings: GameSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdate, onClose }) => {
  const handleChange = (key: keyof GameSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  const handleFileUpload = (key: keyof GameSettings, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdate({ ...settings, [key]: url });
    }
  };

  // Helper to render a Volume Row
  const renderVolumeRow = (
    label: string, 
    volumeKey: keyof GameSettings, 
    fileKey: keyof GameSettings,
    icon: React.ReactNode,
    colorClass: string, // e.g. "bg-blue-500"
    accentClass: string // e.g. "accent-blue-500"
  ) => {
    const hasCustomFile = !!settings[fileKey];

    return (
      <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition-colors">
        <div className="flex justify-between items-center mb-2">
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg text-white shadow-lg ${colorClass}`}>
                 {icon}
              </div>
              <span className="font-bold text-slate-200 text-sm">{label}</span>
           </div>
           
           <div className="flex items-center gap-3">
              {/* Custom File Button */}
              <label 
                className={`
                  relative group cursor-pointer p-1.5 rounded-lg border transition-all
                  ${hasCustomFile 
                    ? 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }
                `}
                title={hasCustomFile ? "Custom Audio Loaded" : "Upload Custom Sound"}
              >
                <input 
                    type="file" 
                    accept="audio/*" 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(fileKey, e)}
                />
                {hasCustomFile ? <FileAudio size={14} /> : <Upload size={14} />}
                
                {/* Tooltip */}
                <span className="absolute -top-8 right-0 pointer-events-none opacity-0 group-hover:opacity-100 bg-black text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap transition-opacity">
                   {hasCustomFile ? 'Change File' : 'Upload MP3'}
                </span>
              </label>

              <span className="font-mono text-xs font-bold text-cyan-300 w-8 text-right">
                {Math.round((settings[volumeKey] as number) * 100)}%
              </span>
           </div>
        </div>

        <input 
          type="range" min="0" max="1" step="0.01" 
          value={settings[volumeKey] as number}
          onChange={(e) => handleChange(volumeKey, parseFloat(e.target.value))}
          className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 ${accentClass}`}
        />
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-[2rem] shadow-[0_0_50px_rgba(6,182,212,0.3)] max-w-lg w-full border border-slate-700/50 relative overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="bg-cyan-500/20 p-2 rounded-xl text-cyan-400 border border-cyan-500/30">
               <Settings size={24} />
             </div>
             <div>
               <h2 className="text-xl font-black text-white tracking-wide">Game Settings</h2>
               <p className="text-xs text-slate-400 font-medium">Customize your ocean experience</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Section: Audio Environment */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-500/80 flex items-center gap-2">
               <Volume2 size={14} /> Audio Environment
            </h3>

            {/* Master Volume - Featured */}
            <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 p-4 rounded-2xl border border-cyan-500/20">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-white flex items-center gap-2">Master Volume</span>
                <span className="bg-cyan-500 text-cyan-950 font-bold text-xs px-2 py-0.5 rounded-md">
                   {Math.round(settings.masterVolume * 100)}%
                </span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={settings.masterVolume}
                onChange={(e) => handleChange('masterVolume', parseFloat(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-cyan-400"
              />
            </div>

            <div className="space-y-2">
                {renderVolumeRow(
                    "Deep Ocean", "bgmVolume", "customBackgroundAudio", 
                    <Music size={16} />, "bg-indigo-600", "accent-indigo-500"
                )}
                {renderVolumeRow(
                    "Current Flow", "streamVolume", "customStreamAudio", 
                    <Waves size={16} />, "bg-blue-500", "accent-blue-500"
                )}
                {renderVolumeRow(
                    "Weather FX", "weatherVolume", "customWeatherAudio", 
                    <CloudRain size={16} />, "bg-yellow-500", "accent-yellow-500"
                )}
                {renderVolumeRow(
                    "Marine Life", "animalVolume", "customAnimalAudio", 
                    <Fish size={16} />, "bg-pink-500", "accent-pink-500"
                )}
            </div>
          </div>

          {/* Section: Visuals & Accessibility */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400/80 flex items-center gap-2">
               <Eye size={14} /> Visuals & Accessibility
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Weather Toggle */}
                <label className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-between cursor-pointer hover:bg-white/10 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                       <div className="bg-yellow-500/20 text-yellow-400 p-2 rounded-lg">
                          <Zap size={18} />
                       </div>
                       <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.weatherEnabled} 
                            onChange={(e) => handleChange('weatherEnabled', e.target.checked)} 
                          />
                          <div className="w-10 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                       </div>
                    </div>
                    <div>
                        <span className="font-bold text-slate-200 block text-sm">Weather Effects</span>
                        <span className="text-[10px] text-slate-500 group-hover:text-slate-400 leading-tight block mt-1">
                           Rain, fog & lightning animations
                        </span>
                    </div>
                </label>

                {/* Motion Toggle */}
                <label className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-between cursor-pointer hover:bg-white/10 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                       <div className="bg-purple-500/20 text-purple-400 p-2 rounded-lg">
                          <Activity size={18} />
                       </div>
                       <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.reduceMotion} 
                            onChange={(e) => handleChange('reduceMotion', e.target.checked)} 
                          />
                          <div className="w-10 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                       </div>
                    </div>
                    <div>
                        <span className="font-bold text-slate-200 block text-sm">Reduce Motion</span>
                        <span className="text-[10px] text-slate-500 group-hover:text-slate-400 leading-tight block mt-1">
                           Stops swaying & rotation
                        </span>
                    </div>
                </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 bg-black/20 shrink-0 flex justify-end">
           <button 
             onClick={onClose} 
             className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black rounded-xl transition shadow-lg shadow-cyan-900/20 active:scale-95 flex items-center gap-2"
           >
             Save Changes
           </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;