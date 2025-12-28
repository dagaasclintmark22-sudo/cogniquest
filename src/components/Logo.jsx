import React from 'react';
import { Brain, Sparkles, Compass } from 'lucide-react';

export default function Logo({ className = "", iconSize = 8, textSize = "text-2xl" }) {
  return (
    <div className={`flex items-center gap-2 font-bold ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className={`w-${iconSize} h-${iconSize} bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3`}>
          <Brain className="text-white w-2/3 h-2/3" />
        </div>
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-pulse" />
        </div>
      </div>
      <div className={`flex flex-col leading-none ${textSize}`}>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700 tracking-tight">
          CogniQuest
        </span>
      </div>
    </div>
  );
}
