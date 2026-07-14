import { useAlerts } from "@/hooks/useAlerts";
import { Bell, AlertCircle, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function AlertsDropdown() {
  const { alerts, loading } = useAlerts();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#A09DC0] transition-colors hover:bg-white/5 hover:text-[#F1F0FF]"
      >
        <Bell size={20} />
        {!loading && alerts.length > 0 && (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#0A0A0F]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#111118] shadow-2xl z-50">
          <div className="border-b border-white/5 bg-white/[0.02] px-4 py-3">
            <h3 className="font-semibold text-[#F1F0FF]">Notificações</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-[#6B6890]">Carregando...</div>
            ) : alerts.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-[#6B6890]">
                  <Bell size={24} />
                </div>
                <p className="text-sm text-[#A09DC0]">Nenhum alerta no momento.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-4 hover:bg-white/[0.02] transition-colors">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      alert.type === 'danger' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
                    }`}>
                      {alert.type === 'danger' ? <AlertCircle size={16} /> : <AlertTriangle size={16} />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${alert.type === 'danger' ? 'text-red-400' : 'text-orange-400'}`}>
                        {alert.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[#A09DC0]">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
