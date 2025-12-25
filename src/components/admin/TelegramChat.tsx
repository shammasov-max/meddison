import React, { useEffect, useState } from 'react';
import { Check, Clock, Phone, RefreshCw } from 'lucide-react';

interface Booking {
  id: number;
  location: string;
  date: string;
  time: string;
  guests: number;
  name: string;
  phone: string;
  status: string;
  created_at: string;
}

export const TelegramChat = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (e) {
      console.error('Failed to fetch bookings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleCallback = async (id: number) => {
    setUpdating(id);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Encrypted-Yw-ID': 'dObLH2itOFlSn9gXJ8cLw8u6favzHedUW6eywFHFvsgMrtsTVXCf2SVxdlnNPX61AS3jnA'
        },
        body: JSON.stringify({ status: 'handled' })
      });
      
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'handled' } : b));
      }
    } catch (e) {
      console.error('Failed to update status', e);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#0e1621] min-h-[600px] rounded-lg overflow-hidden flex flex-col border border-white/10">
      {/* Header */}
      <div className="bg-[#17212b] p-4 flex items-center justify-between border-b border-black/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            ML
          </div>
          <div>
            <h3 className="text-white font-medium">Medisson Lounge Bot</h3>
            <p className="text-[#7f91a4] text-xs">bot</p>
          </div>
        </div>
        <button 
          onClick={fetchBookings} 
          className="p-2 text-[#7f91a4] hover:text-white transition-colors"
          disabled={loading}
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0e1621]">
        {bookings.length === 0 && !loading && (
          <div className="text-center text-[#7f91a4] mt-10">
            Нет новых заявок
          </div>
        )}

        {bookings.map((booking) => (
          <div key={booking.id} className="flex flex-col items-start animate-fade-in">
            <div className="bg-[#182533] rounded-tl-lg rounded-tr-lg rounded-br-lg p-3 max-w-[85%] relative group">
              <div className="text-white text-sm space-y-1 mb-2">
                <p className="font-bold text-[#4ea4f6]">Новая бронь! 🔔</p>
                <p>📍 <b>Заведение:</b> {booking.location}</p>
                <p>📅 <b>Дата:</b> {booking.date}</p>
                <p>⏰ <b>Время:</b> {booking.time}</p>
                <p>👥 <b>Гостей:</b> {booking.guests}</p>
                <p>👤 <b>Имя:</b> {booking.name}</p>
                <p>📞 <b>Телефон:</b> {booking.phone}</p>
              </div>
              
              <div className="mt-3 pt-2 border-t border-white/5">
                {booking.status === 'handled' ? (
                  <div className="w-full bg-green-500/10 text-green-400 py-2 px-4 rounded flex items-center justify-center gap-2 text-sm font-medium">
                    <Check size={16} />
                    Клиент проинформирован
                  </div>
                ) : (
                  <button
                    onClick={() => handleCallback(booking.id)}
                    disabled={updating === booking.id}
                    className="w-full bg-[#2b5278] hover:bg-[#346291] text-white py-2 px-4 rounded transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
                  >
                    {updating === booking.id ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Phone size={16} />
                    )}
                    Перезвонено
                  </button>
                )}
              </div>

              <div className="absolute bottom-1 right-2 text-[10px] text-[#7f91a4] flex items-center gap-1">
                {new Date(booking.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
