import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { SensorData } from "@/types";

interface SensorChartProps {
  data: SensorData[];
}

export function SensorChart({ data }: SensorChartProps) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl flex-1 p-6 flex flex-col min-h-[300px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Sensor Feed</h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] uppercase font-bold tracking-widest rounded border border-cyan-500/20">Realtime</span>
        </div>
      </div>
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#475569" 
              fontSize={10}
              tickMargin={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="left" 
              stroke="#475569" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#475569" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '0.5rem', fontSize: '12px' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              itemStyle={{ padding: '2px 0' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} iconType="circle" />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="temp" 
              name="Temperature (°C)" 
              stroke="#06b6d4" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#06b6d4', stroke: '#083344', strokeWidth: 2 }} 
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="hum" 
              name="Humidity (%)" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
