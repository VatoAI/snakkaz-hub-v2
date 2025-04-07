
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";

export const ProgressSection = () => {
  const [progressValue, setProgressValue] = useState<number>(50);
  
  return (
    <div className="max-w-3xl mx-auto mt-16 mb-12 p-6 rounded-xl border-2 border-opacity-50 bg-gradient-to-r from-cyberdark-900/70 to-cyberdark-800/70 backdrop-blur-sm"
      style={{ borderImage: "linear-gradient(90deg, #1a9dff, #d62828) 1" }}
    >
      <h2 className="text-2xl font-bold mb-6 text-center"
         style={{
            background: 'linear-gradient(90deg, #1a9dff 0%, #ffffff 50%, #d62828 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: '-5px 0 15px rgba(26,157,255,0.6), 5px 0 15px rgba(214,40,40,0.6)',
          }}
      >
        Fremdrift
      </h2>
      
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-cyberblue-400">Progresjon</span>
          <span className="text-white font-semibold">{progressValue}%</span>
        </div>
        
        <div className="h-8 rounded-lg overflow-hidden relative bg-cyberdark-950/60 border border-gray-700">
          <div 
            className="h-full transition-all duration-500 ease-out"
            style={{ 
              width: `${progressValue}%`,
              background: 'linear-gradient(90deg, #1a9dff 0%, #3b82f6 50%, #d62828 100%)',
              boxShadow: '0 0 15px rgba(26,157,255,0.4), 0 0 15px rgba(214,40,40,0.4)'
            }}
          ></div>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-400 mb-3">Juster prosent (1-99%):</p>
        <Slider 
          defaultValue={[progressValue]} 
          min={1} 
          max={99} 
          step={1} 
          onValueChange={(values) => setProgressValue(values[0])}
          className="py-4"
        />
      </div>
    </div>
  );
};
