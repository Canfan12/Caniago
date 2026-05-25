import { useState, useEffect, useRef } from "react";
import { Cpu, Settings2, Activity, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeviceApi } from "@/api";
import { DeviceStatus, SensorData } from "@/types";
import { RelayCard } from "@/components/RelayCard";
import { SensorChart } from "@/components/SensorChart";
import { VoiceCommand } from "@/components/VoiceCommand";
import { CodeInstructions } from "@/components/CodeInstructions";

export default function App() {
  const [tab, setTab] = useState<"dashboard" | "setup">("setup");
  const [ipAddress, setIpAddress] = useState<string>("192.168.x.x");
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    temp: 0,
    hum: 0,
    relays: [false, false, false, false],
    mode: 0,
  });
  
  const [history, setHistory] = useState<SensorData[]>([]);
  const apiRef = useRef<DeviceApi | null>(null);

  // Re-initialize API when IP changes (and user clicks connect)
  const connectDevice = () => {
    apiRef.current = new DeviceApi(ipAddress);
    setIsConnecting(true);
    setStatusError(null);
    fetchStatus();
    setTab("dashboard");
  };

  const fetchStatus = async () => {
    if (!apiRef.current) return;
    try {
      const data = await apiRef.current.getStatus();
      
      setDeviceStatus((prev) => ({
        ...prev,
        temp: data.temp,
        hum: data.hum,
        relays: data.relays,
        mode: data.mode,
      }));

      // Append history
      setHistory(prev => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        const newHist = [...prev, { time: timeStr, temp: data.temp, hum: data.hum }];
        if (newHist.length > 20) newHist.shift(); // keep last 20 ticks
        return newHist;
      });

      setStatusError(null);
      setIsConnecting(false);
    } catch (err) {
      console.error(err);
      setStatusError("Gagal mengambil status. Pastikan IP benar dan ESP menyala. (Info: Browser mungkin memblokir HTTP karena Mixed Content. Cek panduan di Setup ESP).");
      setIsConnecting(false);
    }
  };

  // Poll every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (tab === "dashboard" && apiRef.current && !isConnecting) {
        fetchStatus();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [tab, isConnecting]);

  const toggleRelay = async (id: number, state: boolean) => {
    if (!apiRef.current) return;
    try {
      await apiRef.current.setRelay(id, state);
      // Optimistic update
      setDeviceStatus(prev => {
        const newRelays = [...prev.relays] as typeof prev.relays;
        newRelays[id] = state;
        return { ...prev, relays: newRelays, mode: 0 };
      });
    } catch (e) {
      console.error("Relay toggle failed", e);
    }
  };

  const handleAll = async (state: boolean) => {
    if (!apiRef.current) return;
    try {
      await apiRef.current.setAllRelays(state);
      setDeviceStatus(prev => ({
        ...prev,
        relays: [state, state, state, state],
        mode: 0
      }));
    } catch (e) {
      console.error("All toggle failed", e);
    }
  };

  const setVariasi = async (modeNum: number) => {
    if (!apiRef.current) return;
    try {
      await apiRef.current.setVariasi(modeNum);
      setDeviceStatus(prev => ({
        ...prev,
        mode: modeNum,
        relays: modeNum !== 0 ? [false,false,false,false] : prev.relays // if mode active, UI considers relays managed by ESP
      }));
    } catch(e) {
      console.error("Set variasi failed", e);
    }
  };

  const handleVoiceCommand = (cmd: string) => {
    console.log("Voice Command Received:", cmd);
    
    const isMati = cmd.includes("mati") || cmd.includes("off");
    const isNyala = cmd.includes("nyala") || cmd.includes("hidup") || cmd.includes("on");
    
    if (cmd.includes("semua")) {
      if (isNyala) handleAll(true);
      else if (isMati) handleAll(false);
      return;
    }

    if (cmd.includes("relay satu") || cmd.includes("relay 1")) {
      if (isNyala) toggleRelay(0, true); else if (isMati) toggleRelay(0, false);
    } else if (cmd.includes("relay dua") || cmd.includes("relay 2")) {
      if (isNyala) toggleRelay(1, true); else if (isMati) toggleRelay(1, false);
    } else if (cmd.includes("relay tiga") || cmd.includes("relay 3")) {
      if (isNyala) toggleRelay(2, true); else if (isMati) toggleRelay(2, false);
    } else if (cmd.includes("relay empat") || cmd.includes("relay 4")) {
      if (isNyala) toggleRelay(3, true); else if (isMati) toggleRelay(3, false);
    }

    if (cmd.includes("variasi satu") || cmd.includes("variasi 1")) {
      setVariasi(1);
    } else if (cmd.includes("variasi dua") || cmd.includes("variasi 2")) {
      setVariasi(2);
    }

    if (cmd.includes("berhenti") || cmd.includes("stop")) {
      setVariasi(0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 flex flex-col relative overflow-hidden">
      {/* Background Atmospheric Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] text-slate-950">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase text-white">
                ESP32 Control Hub
              </h1>
              <div className="flex items-center gap-2 text-[10px] text-cyan-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                DIRECT IP LINK: {ipAddress} {statusError ? "• DISCONNECTED" : ""}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">System Tab</p>
              <p className="font-mono text-sm uppercase">{tab}</p>
            </div>
            <div className="h-10 w-[1px] bg-slate-800 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTab("setup")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${tab === "setup" ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white"}`}
              >
                <Settings2 className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider hidden md:inline">Setup ESP</span>
              </button>
              <button
                onClick={() => setTab("dashboard")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${tab === "dashboard" ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white"}`}
              >
                <Activity className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider hidden md:inline">Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full z-10 flex-1">
        
        {/* SETUP TAB */}
        {tab === "setup" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-xl mx-auto bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
              <h2 className="text-lg font-bold uppercase tracking-widest mb-4 text-slate-300 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-500" />
                Configure Local IP Address
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Device Target IP</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                      placeholder="192.168.1.100"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                    />
                    <button
                      onClick={connectDevice}
                      disabled={isConnecting}
                      className="bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                    >
                      {isConnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Connect"}
                    </button>
                  </div>
                </div>
                {statusError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                    <p className="text-[10px] font-mono text-rose-400">{statusError}</p>
                  </div>
                )}
              </div>
            </div>

            <CodeInstructions />
          </div>
        )}

        {/* DASHBOARD TAB */}
        {tab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
            
            {/* STATUS BANNER & VOICE */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <VoiceCommand onCommand={handleVoiceCommand} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
              
              {/* LEFT COLUMN: SENSOR DATA (Col-Span 7 in reference) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between h-40 relative group">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Temperature</p>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-5xl font-bold text-cyan-400">{deviceStatus.temp.toFixed(1)}</span>
                      <span className="text-2xl text-slate-400 font-light italic">°C</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full mt-4 overflow-hidden relative">
                      {/* Simple progress bar calculation (temp max assumed ~50c for visual scale) */}
                      <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-1000" style={{ width: `${Math.min(deviceStatus.temp / 50 * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between h-40 relative group">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Humidity</p>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-5xl font-bold text-emerald-400">{deviceStatus.hum.toFixed(1)}</span>
                      <span className="text-2xl text-slate-400 font-light italic">%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full mt-4 overflow-hidden relative">
                      <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all duration-1000" style={{ width: `${Math.min(deviceStatus.hum, 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                <SensorChart data={history} />
              </div>

              {/* RIGHT COLUMN: RELAYS & CONTROLS (Col-Span 5 in reference) */}
              <div className="lg:col-span-5 flex flex-col gap-6">

                <div className="flex justify-between items-center bg-slate-900/60 p-4 border border-slate-800 rounded-2xl hidden">
                   <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Relay Controls</h2>
                </div>
                  
                <div className="grid grid-cols-2 gap-4">
                  {deviceStatus.relays.map((state, idx) => (
                    <RelayCard 
                      key={idx} 
                      id={idx} 
                      label={`Relay 0${idx + 1}`} 
                      isOn={state} 
                      onToggle={toggleRelay}
                      disabled={deviceStatus.mode !== 0} 
                    />
                  ))}
                </div>

                {/* Variasi Modes */}
                <div className="bg-slate-900/40 border border-dashed border-slate-700 p-6 rounded-2xl">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Light Pattern Sequences</h3>
                  <div className="flex flex-wrap sm:flex-nowrap gap-3">
                    <button 
                      onClick={() => setVariasi(1)}
                      className={`flex-1 py-3 px-2 rounded-lg border text-xs font-bold transition-all active:scale-95 ${deviceStatus.mode === 1 ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                      VARIASI 1 (1→4)
                    </button>
                    <button 
                      onClick={() => setVariasi(2)}
                      className={`flex-1 py-3 px-2 rounded-lg border text-xs font-bold transition-all active:scale-95 ${deviceStatus.mode === 2 ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                      VARIASI 2 (4→1)
                    </button>
                    <button 
                       onClick={() => setVariasi(0)}
                       className="px-6 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold hover:bg-rose-500/20 transition-all active:scale-95"
                    >
                       STOP
                    </button>
                  </div>
                </div>
                
                {/* Global Controls */}
                <div className="flex gap-4">
                  <button onClick={() => handleAll(true)} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 text-center">Master ON</button>
                  <button onClick={() => handleAll(false)} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-500 hover:text-rose-400 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 text-center">Master OFF</button>
                </div>

              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer / System Logs */}
      <footer className="px-8 py-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center z-10 w-full mt-auto hidden sm:flex">
        <div className="flex gap-8 items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Node</span>
            <span className="text-xs font-mono text-cyan-400">{ipAddress}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logs</span>
            <span className="text-xs text-slate-400 truncate w-64">[SYSTEM] {statusError ? "Connection Failed" : "Online & Active"}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex gap-1">
             <div className={cn("w-1 h-3 rounded-full", statusError ? "bg-slate-700" : "bg-emerald-500")}></div>
             <div className={cn("w-1 h-3 rounded-full", statusError ? "bg-slate-700" : "bg-emerald-500")}></div>
             <div className={cn("w-1 h-3 rounded-full", statusError ? "bg-slate-700" : "bg-emerald-500")}></div>
             <div className="w-1 h-3 bg-slate-700 rounded-full"></div>
           </div>
           <span className="text-[10px] font-bold text-slate-500 uppercase">Signal Strength</span>
        </div>
      </footer>
    </div>
  );
}

