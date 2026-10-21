import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@heroui/react';
import { useUserStore } from '../../stores/user.store';
import { IconCalendar, IconClock, IconMapPin, IconInfoCircle, IconArrowLeft, IconCircleCheck, IconTicket, IconSparkles } from '@tabler/icons-react';
import MarkdownNote from '../MarkdownNote';

interface EventDetail {
  id: number;
  name: string;
  description: string;
  linkImage: string | null;
  startRegister: string;
  endRegister: string;
  locationName: string | null;
  locationAddress: string | null;
  isAllowRegister: boolean;
}

interface EventDate {
  id: number;
  date: string;
}

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useUserStore();
  
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventDetail | null>(null);
  const [dates, setDates] = useState<EventDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, mins: number, secs: number} | null>(null);
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<{success: boolean, message: string} | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [detailRes, datesRes]: any = await Promise.all([
          invoke('fetch_portal_get', { token, endpoint: `eventWeb/getDetail/${id}` }),
          invoke('fetch_portal_get', { token, endpoint: `eventWeb/getDate?eventId=${id}` })
        ]);
        
        if (detailRes?.success && detailRes?.body) {
          setEventData(detailRes.body);
        }
        if (datesRes?.success && datesRes?.body) {
          setDates(datesRes.body);
          if (datesRes.body.length > 0) {
            setSelectedDate(datesRes.body[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch event data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, token]);

  useEffect(() => {
    if (!eventData?.endRegister) return;
    
    // Parse format "30/07/2026 17:00"
    const [datePart, timePart] = eventData.endRegister.split(' ');
    if (!datePart || !timePart) return;
    
    const [day, month, year] = datePart.split('/');
    const [hour, min] = timePart.split(':');
    
    const endTime = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min)).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;
      
      if (distance < 0) {
        setTimeLeft(null);
        clearInterval(interval);
        return;
      }
      
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [eventData]);

  const handleRegister = async () => {
    if (!id || !selectedDate) return;
    
    setIsRegistering(true);
    setRegisterResult(null);
    
    try {
      const res: any = await invoke('fetch_portal_post', {
        token,
        endpoint: `eventWeb/register?eventId=${id}`,
        body: { dateId: selectedDate }
      });
      
      if (res) {
        setRegisterResult({
          success: res.success === true,
          message: res.message || (res.success ? "Đăng ký thành công!" : "Đăng ký thất bại")
        });
      }
    } catch (err: any) {
      console.error("Failed to register:", err);
      setRegisterResult({
        success: false,
        message: err.toString()
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-pulse">
        <div className="w-24 h-8 bg-bg-tertiary rounded-xl mb-4"></div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 h-[600px] bg-bg-tertiary rounded-3xl"></div>
          <div className="flex-1 flex flex-col gap-6">
            <div className="w-32 h-6 bg-bg-tertiary rounded-lg"></div>
            <div className="w-full h-20 bg-bg-tertiary rounded-xl"></div>
            <div className="w-full h-40 bg-bg-tertiary rounded-xl"></div>
            <div className="w-3/4 h-32 bg-bg-tertiary rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-20 text-text-tertiary">
        <IconTicket size={64} className="mb-4 opacity-30" />
        <h2 className="text-xl font-bold">Không tìm thấy sự kiện</h2>
        <Button className="mt-4" onPress={() => navigate(-1)}>Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-tertiary hover:text-[#008689] dark:hover:text-[#2DD4BF] font-medium transition-colors mb-6 group cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-bg-primary border border-border-color flex items-center justify-center group-hover:bg-teal-500/10 group-hover:border-teal-500/30 transition-all">
          <IconArrowLeft size={16} />
        </div>
        <span>Quay lại</span>
      </button>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column - Image & Countdown */}
        <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 flex flex-col gap-4 sticky top-24">
          <div className="relative w-full rounded-3xl overflow-hidden bg-bg-primary border border-border-color shadow-lg group">
            {eventData.linkImage ? (
              <img 
                src={eventData.linkImage} 
                alt={eventData.name} 
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full aspect-[4/3] flex items-center justify-center bg-teal-500/10 text-[#008689] dark:text-[#2DD4BF]">
                <IconTicket size={80} />
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold mb-4">
              <IconSparkles size={18} className="animate-pulse" />
              <span className="tracking-wide uppercase text-sm">Đang mở đăng ký</span>
            </div>
            
            {timeLeft ? (
              <div className="flex items-center justify-center gap-3">
                <div className="flex flex-col items-center bg-white dark:bg-bg-primary shadow-sm rounded-xl px-4 py-2 w-16">
                  <span className="text-xl font-black text-text-primary">{String(timeLeft.days).padStart(2, '0')}</span>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Ngày</span>
                </div>
                <span className="text-emerald-500 font-bold text-xl">:</span>
                <div className="flex flex-col items-center bg-white dark:bg-bg-primary shadow-sm rounded-xl px-4 py-2 w-16">
                  <span className="text-xl font-black text-text-primary">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Giờ</span>
                </div>
                <span className="text-emerald-500 font-bold text-xl">:</span>
                <div className="flex flex-col items-center bg-white dark:bg-bg-primary shadow-sm rounded-xl px-4 py-2 w-16">
                  <span className="text-xl font-black text-text-primary">{String(timeLeft.mins).padStart(2, '0')}</span>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Phút</span>
                </div>
                <span className="text-emerald-500 font-bold text-xl">:</span>
                <div className="flex flex-col items-center bg-white dark:bg-bg-primary shadow-sm rounded-xl px-4 py-2 w-16">
                  <span className="text-xl font-black text-text-primary">{String(timeLeft.secs).padStart(2, '0')}</span>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Giây</span>
                </div>
              </div>
            ) : (
              <div className="text-center font-bold text-red-500 bg-white dark:bg-bg-primary rounded-xl py-3 shadow-sm">
                Đã kết thúc đăng ký
              </div>
            )}

            <div className="flex flex-col gap-3 mt-5 pt-5 border-t border-emerald-200/50 dark:border-emerald-800/30">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <IconClock size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Thời gian đăng ký</span>
              </div>
              <div className="flex flex-col gap-1.5 text-sm font-semibold text-emerald-900/80 dark:text-emerald-100/80">
                <div className="flex justify-between items-center bg-white/60 dark:bg-black/20 rounded-xl px-3 py-2.5">
                   <span className="text-emerald-700/70 dark:text-emerald-400/70">Bắt đầu</span>
                   <span>{eventData.startRegister}</span>
                </div>
                <div className="flex justify-between items-center bg-white/60 dark:bg-black/20 rounded-xl px-3 py-2.5">
                   <span className="text-emerald-700/70 dark:text-emerald-400/70">Kết thúc</span>
                   <span>{eventData.endRegister}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="flex-1 flex flex-col">
          <div className="bg-bg-primary border border-border-color rounded-3xl p-6 sm:p-10 shadow-sm flex flex-col">
            <span className="text-xs font-bold tracking-widest text-text-tertiary uppercase mb-3">Sự kiện nổi bật</span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight mb-8 text-text-primary">
              {eventData.name}
            </h1>
            
            <div className="prose max-w-none mb-10 bg-bg-secondary p-6 sm:p-8 rounded-3xl border border-border-color shadow-xs">
              <div className="text-[15px] sm:text-base leading-loose text-text-secondary space-y-4">
                <MarkdownNote content={eventData.description} />
              </div>
            </div>

            {(eventData.locationName || eventData.locationAddress) && (
              <div className="mb-10">
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-bg-secondary border border-border-color shadow-sm w-full md:w-1/2">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <IconMapPin size={20} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Địa điểm</span>
                    <span className="text-sm font-semibold text-text-primary">{eventData.locationName || "Chưa cập nhật"}</span>
                    {eventData.locationAddress && <span className="text-sm text-text-secondary">{eventData.locationAddress}</span>}
                  </div>
                </div>
              </div>
            )}

            {dates.length > 0 && (
              <div className="flex flex-col gap-5 mb-10">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <IconCalendar size={20} className="text-[#008689] dark:text-[#2DD4BF]" />
                  Chọn ngày tham gia
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dates.map((date) => (
                    <button
                      key={date.id}
                      onClick={() => setSelectedDate(date.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        selectedDate === date.id 
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/20 shadow-sm' 
                          : 'border-border-color bg-bg-primary hover:border-emerald-300 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10'
                      }`}
                    >
                      <span className={`font-semibold text-sm ${selectedDate === date.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-text-secondary'}`}>
                        {date.date}
                      </span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        selectedDate === date.id ? 'bg-emerald-500 text-white' : 'border-2 border-border-strong text-transparent'
                      }`}>
                        <IconCircleCheck size={14} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {registerResult && (
              <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 font-semibold ${
                registerResult.success 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {registerResult.success ? <IconCircleCheck size={20} /> : <IconInfoCircle size={20} />}
                <span>{registerResult.message}</span>
              </div>
            )}

            <Button 
              size="lg" 
              onPress={handleRegister}
              isDisabled={isRegistering || !eventData.isAllowRegister || !timeLeft || (!selectedDate && dates.length > 0)}
              className={`w-full h-14 text-lg font-bold shadow-lg mt-auto rounded-2xl ${
                eventData.isAllowRegister && timeLeft && (selectedDate || dates.length === 0)
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-emerald-500/30'
                  : 'bg-bg-tertiary text-text-tertiary shadow-none'
              }`}
            >
              {!isRegistering && <IconTicket size={22} className="mr-2" />}
              {isRegistering ? "ĐANG ĐĂNG KÝ..." : "ĐĂNG KÝ NGAY"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
