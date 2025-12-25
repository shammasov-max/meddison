import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar as CalendarIcon, Clock, Users, User, Phone, Minus, Plus, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import { format, addDays, startOfToday, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isBefore, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useData } from '../../hooks/useData';
import logo from '../../assets/images/logo.svg';
import { BookingSuccess } from './BookingSuccess';

// Use absolute backend URL per Youware platform requirement.
const API_URL = `https://backend.youware.com/api/bookings`;

const formatPhoneNumber = (value: string) => {
  // 1. Get all digits
  let digits = value.replace(/\D/g, '');
  
  // 2. Handle starting 7 or 8 (Russian code)
  if (digits.startsWith('7') || digits.startsWith('8')) {
    digits = digits.slice(1);
  }
  
  // 3. Limit to 10 digits (local part)
  digits = digits.slice(0, 10);
  
  // 4. Build formatted string
  let res = '+7 (';
  if (digits.length > 0) {
    res += digits.substring(0, 3);
  }
  if (digits.length >= 3) {
    res += ') ' + digits.substring(3, 6);
  }
  if (digits.length >= 6) {
    res += '-' + digits.substring(6, 8);
  }
  if (digits.length >= 8) {
    res += '-' + digits.substring(8, 10);
  }
  
  return { formatted: res, raw: digits };
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLocation?: string;
}

// Booking settings interface
interface BookingSettings {
  title: string;
  description: string;
  image: string | null;
  working_hours_start: string;
  working_hours_end: string;
  max_guests: number;
  min_guests: number;
}

const SETTINGS_API_URL = 'https://backend.youware.com/api/booking-settings';

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, defaultLocation }) => {
  const { locations, hero } = useData();
  const [locationName, setLocationName] = useState(defaultLocation || locations[0]?.name || '');
  
  // Booking settings from backend
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);
  
  // Fetch booking settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(SETTINGS_API_URL);
        if (response.ok) {
          const data = await response.json();
          setBookingSettings(data);
        }
      } catch (err) {
        console.error('Failed to fetch booking settings:', err);
      }
    };
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);
  
  // Update location if defaultLocation changes or locations become available
  useEffect(() => {
    if (defaultLocation) {
      setLocationName(defaultLocation);
    } else if (locations.length > 0 && !locationName) {
      setLocationName(locations[0].name);
    }
  }, [defaultLocation, locations, locationName]);

  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedTime, setSelectedTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // If user clears input completely
    if (!inputValue) {
      setPhone('');
      setPhoneError('');
      return;
    }

    // If user tries to delete prefix '+7 (' - prevent it by re-formatting current digits
    // But if they select all and delete, inputValue is empty (handled above)
    
    const { formatted, raw } = formatPhoneNumber(inputValue);
    setPhone(formatted);

    if (raw.length > 0 && raw.length < 10) {
      setPhoneError('Введите полный номер');
    } else {
      setPhoneError('');
    }
  };
  
  // Picker States
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(startOfToday());

  // Calendar Logic
  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  const firstDayOfMonth = getDay(startOfMonth(currentMonth)); // 0 = Sun, 1 = Mon...
  // Adjust for Russian week (Mon = 0, Sun = 6)
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Time Selection State
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);

  // Update selectedTime when hour and minute change
  useEffect(() => {
    if (selectedHour !== null && selectedMinute !== null) {
      const hourStr = selectedHour.toString().padStart(2, '0');
      const minStr = selectedMinute === 0 ? '00' : '30';
      setSelectedTime(`${hourStr}:${minStr}`);
    }
  }, [selectedHour, selectedMinute]);

  // Available hours based on settings (default 11:00 - 05:00)
  const availableHours = useMemo(() => {
    const startHour = bookingSettings?.working_hours_start 
      ? parseInt(bookingSettings.working_hours_start.split(':')[0]) 
      : 11;
    const endHour = bookingSettings?.working_hours_end 
      ? parseInt(bookingSettings.working_hours_end.split(':')[0]) 
      : 5;
    
    const hours: number[] = [];
    
    // Handle working hours that cross midnight
    if (endHour < startHour) {
      // From start to 23
      for (let i = startHour; i <= 23; i++) hours.push(i);
      // From 0 to end
      for (let i = 0; i <= endHour; i++) hours.push(i);
    } else {
      // Normal hours within same day
      for (let i = startHour; i <= endHour; i++) hours.push(i);
    }
    
    return hours;
  }, [bookingSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: locationName,
          date: format(selectedDate, 'dd.MM.yyyy'),
          time: selectedTime,
          guests,
          name,
          phone,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const errorText = await response.text();
        console.error('Booking failed:', response.status, errorText);
        alert(`Ошибка отправки (${response.status}): ${errorText.slice(0, 200)}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert(`Сбой сети или кода: ${String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Safety check for document.body
    if (typeof document === 'undefined' || !document.body) return;
    
    try {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    } catch (error) {
      console.warn('Failed to set body overflow:', error);
    }

    return () => {
      if (typeof document !== 'undefined' && document.body) {
        try {
          document.body.style.overflow = 'unset';
        } catch (error) {
          console.warn('Failed to reset body overflow:', error);
        }
      }
    };
  }, [isOpen]);

  // Close pickers when clicking outside (simplified)
  const modalRef = useRef<HTMLDivElement>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-white/5"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-sm"
            >
              <X size={20} />
            </button>

            {/* Left Side: Static Visual */}
            <div className="relative w-full md:w-1/3 h-32 md:h-auto flex-shrink-0 overflow-hidden hidden md:block">
               <div className="absolute inset-0 bg-zinc-900">
                  <img 
                    src={hero?.image} 
                    alt="Atmosphere" 
                    className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
               </div>
               
               <div className="absolute bottom-0 left-0 p-8 w-full">
                  <img 
                    src={logo} 
                    alt="Logo" 
                    className="h-8 w-auto mb-6 invert brightness-0 filter opacity-90" 
                    style={{ filter: 'brightness(0) invert(1)' }} 
                  />
                  <h3 className="text-2xl font-serif font-bold text-white mb-2">
                    {bookingSettings?.title || 'Medisson Lounge'}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {bookingSettings?.description || 'Создаем атмосферу, в которую хочется возвращаться.'}
                  </p>
               </div>
            </div>

            {/* Right Side: Form */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-950 p-6 md:p-10">
              {isSuccess ? (
                <BookingSuccess onClose={onClose} />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Location Selector - Tabs */}
                <div className="space-y-3">
                  <label className="text-xs font-medium text-amber-500/80 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} />
                    Локация
                  </label>
                  <div className="flex p-1 bg-white/5 rounded-xl">
                    {locations.map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => setLocationName(loc.name)}
                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                          locationName === loc.name
                            ? 'bg-zinc-800 text-white shadow-lg'
                            : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date & Time Pickers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Date Picker */}
                  <div className="relative space-y-3">
                    <label className="text-xs font-medium text-amber-500/80 uppercase tracking-widest flex items-center gap-2">
                      <CalendarIcon size={14} />
                      Дата
                    </label>
                    <button
                      type="button"
                      onClick={() => { setIsCalendarOpen(!isCalendarOpen); setIsTimeOpen(false); }}
                      className={`w-full flex items-center justify-between bg-white/5 border rounded-xl py-4 px-5 text-left transition-all duration-300 ${
                        isCalendarOpen ? 'border-amber-500 bg-amber-500/5' : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className="text-white font-medium">
                        {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                      </span>
                      <ChevronDown size={16} className={`text-white/40 transition-transform duration-300 ${isCalendarOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Custom Calendar Dropdown */}
                    <AnimatePresence>
                      {isCalendarOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="absolute top-full left-0 right-0 z-30 mt-2 bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-2xl overflow-hidden"
                        >
                          {/* Calendar Header */}
                          <div className="flex items-center justify-between mb-4">
                            <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-white/10 rounded-full text-white/60 hover:text-white">
                              <ChevronLeft size={18} />
                            </button>
                            <span className="text-white font-bold capitalize">
                              {format(currentMonth, 'LLLL yyyy', { locale: ru })}
                            </span>
                            <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-white/10 rounded-full text-white/60 hover:text-white">
                              <ChevronRight size={18} />
                            </button>
                          </div>

                          {/* Week Days */}
                          <div className="grid grid-cols-7 mb-2">
                            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                              <div key={day} className="text-center text-xs text-white/30 font-medium py-1">
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Days Grid */}
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: startOffset }).map((_, i) => (
                              <div key={`empty-${i}`} />
                            ))}
                            {daysInMonth.map((date) => {
                              const isSelected = isSameDay(date, selectedDate);
                              const isPast = isBefore(date, startOfToday());
                              const isTodayDate = isToday(date);

                              return (
                                <button
                                  key={date.toString()}
                                  type="button"
                                  disabled={isPast}
                                  onClick={() => {
                                    setSelectedDate(date);
                                    setIsCalendarOpen(false);
                                  }}
                                  className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-amber-500 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                                      : isPast
                                      ? 'text-white/10 cursor-not-allowed'
                                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                                  } ${isTodayDate && !isSelected ? 'border border-amber-500/30 text-amber-500' : ''}`}
                                >
                                  {format(date, 'd')}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Time Picker - Redesigned */}
                  <div className="relative space-y-3">
                    <label className="text-xs font-medium text-amber-500/80 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} />
                      Время
                    </label>
                    <button
                      type="button"
                      onClick={() => { setIsTimeOpen(!isTimeOpen); setIsCalendarOpen(false); }}
                      className={`w-full flex items-center justify-between bg-white/5 border rounded-xl py-4 px-5 text-left transition-all duration-300 ${
                        isTimeOpen ? 'border-amber-500 bg-amber-500/5' : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className={`font-medium ${selectedTime ? 'text-white' : 'text-white/40'}`}>
                        {selectedTime || 'Выберите время'}
                      </span>
                      <ChevronDown size={16} className={`text-white/40 transition-transform duration-300 ${isTimeOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Redesigned Time Picker Dropdown */}
                    <AnimatePresence>
                      {isTimeOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="absolute top-full left-0 right-0 z-30 mt-2 bg-zinc-900 border border-white/10 rounded-2xl p-5 shadow-2xl overflow-hidden"
                        >
                          {/* Step 1: Select Hour */}
                          <div className="mb-5">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Час</span>
                              {selectedHour !== null && (
                                <span className="text-sm font-bold text-amber-500">
                                  {selectedHour.toString().padStart(2, '0')}:00
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-7 gap-1.5">
                              {availableHours.map((hour) => {
                                const isSelected = selectedHour === hour;
                                // Hours after midnight (0-5) are highlighted differently
                                const endHour = bookingSettings?.working_hours_end 
                                  ? parseInt(bookingSettings.working_hours_end.split(':')[0]) 
                                  : 5;
                                const isAfterMidnight = hour <= endHour && hour <= 12;
                                return (
                                  <button
                                    key={hour}
                                    type="button"
                                    onClick={() => setSelectedHour(hour)}
                                    className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                      isSelected
                                        ? 'bg-amber-500 text-black font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                        : isAfterMidnight
                                        ? 'bg-white/5 text-amber-500/70 hover:bg-amber-500/10 hover:text-amber-500 border border-amber-500/20'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                    }`}
                                  >
                                    {hour.toString().padStart(2, '0')}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-white/20"></div>
                                <span className="text-[10px] text-white/30">День</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-amber-500/30"></div>
                                <span className="text-[10px] text-white/30">После полуночи</span>
                              </div>
                            </div>
                          </div>

                          {/* Step 2: Select Minutes */}
                          <div className="pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Минуты</span>
                              {selectedMinute !== null && selectedHour !== null && (
                                <span className="text-sm font-bold text-amber-500">
                                  {selectedHour.toString().padStart(2, '0')}:{selectedMinute === 0 ? '00' : '30'}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMinute(0);
                                  // Auto-close if hour is already selected
                                  if (selectedHour !== null) {
                                    setTimeout(() => setIsTimeOpen(false), 150);
                                  }
                                }}
                                disabled={selectedHour === null}
                                className={`py-4 rounded-xl text-base font-bold transition-all duration-200 ${
                                  selectedHour === null
                                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                    : selectedMinute === 0
                                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                                }`}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <span>:00</span>
                                  <span className="text-[10px] font-normal opacity-60">Ровно</span>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMinute(30);
                                  // Auto-close if hour is already selected
                                  if (selectedHour !== null) {
                                    setTimeout(() => setIsTimeOpen(false), 150);
                                  }
                                }}
                                disabled={selectedHour === null}
                                className={`py-4 rounded-xl text-base font-bold transition-all duration-200 ${
                                  selectedHour === null
                                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                    : selectedMinute === 30
                                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                                }`}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <span>:30</span>
                                  <span className="text-[10px] font-normal opacity-60">Половина</span>
                                </div>
                              </button>
                            </div>
                            {selectedHour === null && (
                              <p className="text-center text-[11px] text-white/30 mt-3">
                                Сначала выберите час
                              </p>
                            )}
                          </div>

                          {/* Selected Time Preview */}
                          {selectedHour !== null && selectedMinute !== null && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 pt-4 border-t border-white/5 text-center"
                            >
                              <span className="text-white/40 text-xs">Выбрано: </span>
                              <span className="text-amber-500 font-bold text-lg">
                                {selectedHour.toString().padStart(2, '0')}:{selectedMinute === 0 ? '00' : '30'}
                              </span>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Guests & Contact - Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {/* Guests */}
                  <div className="space-y-4">
                    <label className="text-xs font-medium text-amber-500/80 uppercase tracking-widest flex items-center gap-2">
                      <Users size={14} />
                      Гости
                    </label>
                    <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-2">
                      <button
                        type="button"
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      >
                        <Minus size={20} />
                      </button>
                      <span className="font-bold text-xl text-white">{guests}</span>
                      <button
                        type="button"
                        onClick={() => setGuests(Math.min(20, guests + 1))}
                        className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Contact Inputs */}
                  <div className="space-y-4 sm:col-span-2">
                    <label className="text-xs font-medium text-amber-500/80 uppercase tracking-widest flex items-center gap-2">
                      <User size={14} />
                      Контакты
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Ваше Имя"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-4 px-5 text-white placeholder:text-white/20 focus:border-amber-500/50 focus:bg-white/10 focus:ring-0 transition-all outline-none"
                      />
                      <div className="w-full">
                        <div
                          className={`relative flex items-center bg-white/5 border rounded-xl transition-all duration-300 ${
                            phoneError ? 'border-red-500/60 bg-red-500/5' : 'border-white/5 hover:border-white/20 focus-within:border-amber-500/60 focus-within:bg-white/10'
                          }`}
                        >
                          <div className="pl-5 text-white/40 pointer-events-none flex items-center gap-2 text-sm uppercase tracking-[0.2em]">
                            <Phone size={14} />
                          </div>
                          <input
                            type="tel"
                            placeholder="+7 (XXX) XXX-XX-XX"
                            value={phone}
                            onChange={handlePhoneChange}
                            onBlur={() => {
                              const digits = phone.replace(/\D/g, '');
                              // digits includes 7 at start, so length should be 11
                              if (phone && digits.length < 11) {
                                setPhoneError('Введите корректный номер');
                              }
                            }}
                            maxLength={18}
                            required
                            className="flex-1 bg-transparent border-0 py-4 px-4 text-white placeholder:text-white/20 focus:ring-0 focus:outline-none"
                          />
                        </div>
                        {phoneError && (
                          <p className="mt-2 text-xs text-red-400/80 uppercase tracking-widest">
                            {phoneError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!selectedTime || !name || phone.replace(/\D/g, '').length < 11 || isLoading}
                  className="w-full bg-white text-black font-bold uppercase tracking-widest py-5 rounded-xl hover:bg-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:shadow-none"
                >
                  {isLoading ? 'Отправка...' : 'Забронировать столик'}
                </button>
              </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
