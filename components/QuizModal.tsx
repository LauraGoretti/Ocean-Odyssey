import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { CheckCircle2, XCircle, ArrowRight, BrainCircuit } from 'lucide-react';

interface QuizModalProps {
  quiz: QuizQuestion;
  onComplete: () => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ quiz, onComplete }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [showResult, setShowResult] = useState(false);

  const handleOptionClick = (index: number) => {
    if (showResult) return;
    
    setSelectedOption(index);
    const correct = index === quiz.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.5)] max-w-lg w-full overflow-hidden border-4 border-cyan-400 relative">
        
        {/* Header */}
        <div className="bg-cyan-500 p-4 flex items-center justify-center gap-2">
            <BrainCircuit className="text-white animate-pulse" />
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Ocean Quiz Time!</h2>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
            <p className="text-xl md:text-2xl text-slate-800 font-bold text-center mb-6 leading-relaxed">
                {quiz.question}
            </p>

            <div className="grid gap-3 mb-6">
                {quiz.options.map((option, idx) => {
                    let btnClass = "p-4 rounded-xl text-lg font-bold border-2 transition-all transform active:scale-95 text-left flex justify-between items-center ";
                    
                    if (!showResult) {
                        btnClass += "bg-slate-50 border-slate-200 hover:bg-cyan-50 hover:border-cyan-300 text-slate-600 hover:scale-105 shadow-sm";
                    } else {
                        if (idx === quiz.correctAnswer) {
                            btnClass += "bg-green-100 border-green-500 text-green-800 shadow-md scale-105";
                        } else if (idx === selectedOption) {
                            btnClass += "bg-red-100 border-red-400 text-red-800 opacity-80";
                        } else {
                            btnClass += "bg-slate-50 border-slate-100 text-slate-400 opacity-50";
                        }
                    }

                    return (
                        <button 
                            key={idx}
                            onClick={() => handleOptionClick(idx)}
                            disabled={showResult}
                            className={btnClass}
                        >
                            {option}
                            {showResult && idx === quiz.correctAnswer && <CheckCircle2 size={24} className="text-green-600" />}
                            {showResult && idx === selectedOption && idx !== quiz.correctAnswer && <XCircle size={24} className="text-red-600" />}
                        </button>
                    );
                })}
            </div>

            {/* Result Feedback */}
            {showResult && (
                <div className={`p-4 rounded-2xl mb-4 border-l-4 animate-slide-up ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-orange-50 border-orange-400'}`}>
                    <h4 className={`font-black text-lg mb-1 ${isCorrect ? 'text-green-700' : 'text-orange-700'}`}>
                        {isCorrect ? "Correct! 🎉" : "Good try! 🐡"}
                    </h4>
                    <p className="text-slate-700 font-medium">
                        {quiz.fact}
                    </p>
                </div>
            )}

            {showResult && (
                <button 
                    onClick={onComplete}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-black text-xl py-4 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2"
                >
                    Continue Journey <ArrowRight />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default QuizModal;