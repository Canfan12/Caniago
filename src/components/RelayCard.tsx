import { Power } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface RelayCardProps {
  id: number;
  label: string;
  isOn: boolean;
  onToggle: (id: number, state: boolean) => void;
  disabled?: boolean;
}

export const RelayCard: React.FC<RelayCardProps> = ({ id, label, isOn, onToggle, disabled }) => {
  return (
    <div 
      className={cn(
        "bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
        <div className={cn(
          "w-3 h-3 rounded-full transition-all duration-300",
          isOn ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-slate-700"
        )}></div>
      </div>
      <h4 className="text-base font-semibold text-slate-200">
        {id === 0 ? "Main Lamp" : id === 1 ? "Exhaust Fan" : id === 2 ? "Pump System" : "Garage Light"}
      </h4>
      <button
        onClick={() => onToggle(id, !isOn)}
        disabled={disabled}
        className={cn(
          "w-full py-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all active:scale-95",
          isOn 
            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
            : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300 hover:bg-slate-700 hover:border-slate-600"
        )}
      >
        {isOn ? "Active" : "Inactive"}
      </button>
    </div>
  );
}
