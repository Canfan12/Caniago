import { Copy, Check, TerminalSquare } from "lucide-react";
import { useState } from "react";
import { esp32Code } from "@/esp32Code";

export function CodeInstructions() {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(esp32Code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gray-900 rounded-2xl border border-gray-800 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-500/10 rounded-lg">
          <TerminalSquare className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Kode C++ ESP32/ESP8266</h2>
          <p className="text-gray-400 text-sm">Upload kode ini ke ESP agar fitur Direct IP berfungsi.</p>
        </div>
      </div>
      
      <div className="mb-6 space-y-4 text-sm text-gray-300">
        <ul className="list-disc pl-5 space-y-2">
          <li>Aplikasi React modern ini berjalan di HTTPS, sedangkan ESP32 berjalan di HTTP lokal.</li>
          <li>Pastikan Anda menggunakan fitur <strong className="text-white">CORS (Access-Control-Allow-Origin)</strong> yang sudah ditambahkan di script bawah ini.</li>
          <li>Ganti <code className="text-blue-300">NAMA_WIFI_ANDA</code> dan <code className="text-blue-300">PASSWORD_WIFI_ANDA</code>.</li>
          <li>Upload menggunakan Arduino IDE. Buka Serial Monitor (115200) untuk mengetahui IP yang didapat.</li>
          <li>Masukkan IP ESP tersebut di halaman Dashboard aplikasi ini.</li>
        </ul >
      </div>

      <div className="relative group">
        <div className="absolute right-4 top-4">
          <button
            onClick={copyCode}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-all active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            <span className="text-xs font-medium">{copied ? "Disalin!" : "Salin Kode"}</span>
          </button>
        </div>
        <pre className="bg-[#0d1117] text-gray-300 p-4 rounded-xl overflow-x-auto text-xs font-mono border border-gray-800 h-[400px]">
          <code>{esp32Code}</code>
        </pre>
      </div>
    </div>
  );
}
