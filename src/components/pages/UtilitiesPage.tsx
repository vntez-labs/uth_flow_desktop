import { useState, useRef, useEffect } from 'react';
import { Button, Modal } from '@heroui/react';
import { IconCalendar, IconDownload, IconPlus, IconTrash, IconCopy, IconLoader2, IconExternalLink } from '@tabler/icons-react';
import { toPng } from 'html-to-image';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { getMondayOfWeek } from '../../hooks/useDashboardData';

export default function UtilitiesPage({
  weeklyData = [],
  monthlyData: _monthlyData = [],
  loadingWeekly = false,
  selectedDate = new Date(),
  onDateChange = () => {}
}: {
  weeklyData?: any[];
  monthlyData?: any[];
  loadingWeekly?: boolean;
  dailyData?: any[];
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // States for custom notes (shifts)
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    async function loadNotes() {
      try {
        const data: any = await invoke('get_notes');
        const mapped = data.map((n: any) => ({
          ...n,
          startTime: n.start_time,
          endTime: n.end_time
        }));
        setNotes(mapped);
      } catch (err) {
        console.error("Lỗi lấy ghi chú:", err);
      }
    }
    loadNotes();
  }, []);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNoteDate, setNewNoteDate] = useState('');
  const [newNoteStart, setNewNoteStart] = useState('');
  const [newNoteEnd, setNewNoteEnd] = useState('');
  const [newNoteName, setNewNoteName] = useState('');

  const handleAddNote = async () => {
    if (!newNoteName || !newNoteStart || !newNoteEnd) {
      alert('Vui lòng nhập đủ thông tin (Tên, Giờ bắt đầu, Giờ kết thúc)');
      return;
    }
    if (newNoteStart >= newNoteEnd) {
      alert('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
      return;
    }
    const newNote = {
      id: Date.now().toString(),
      name: newNoteName,
      date: newNoteDate,
      startTime: newNoteStart,
      endTime: newNoteEnd,
    };
    
    try {
      await invoke('add_note', {
        id: newNote.id,
        name: newNote.name,
        date: newNote.date,
        startTime: newNote.startTime,
        endTime: newNote.endTime
      });
      setNotes(prev => [...prev, newNote]);
      setIsNoteModalOpen(false);
      setNewNoteName('');
    } catch (err) {
      console.error(err);
      alert('Lỗi lưu ghi chú!');
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await invoke('delete_note', { id });
      setNotes(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
      alert('Lỗi xóa ghi chú!');
    }
  };

  const handleExportImage = async () => {
    if (!exportRef.current || isExporting) return;
    setIsExporting(true);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      const bgColor = window.getComputedStyle(exportRef.current).backgroundColor;
      const image = await toPng(exportRef.current, { backgroundColor: bgColor, pixelRatio: 1.5, skipFonts: true });
      try {
        await invoke('save_base64_image', { base64Data: image });
        alert("Đã tải ảnh về thư mục Downloads thành công!");
      } catch (invokeErr) {
        alert("Lưu bằng Backend lỗi: " + invokeErr + ". Sẽ thử lưu bằng trình duyệt...");
        const link = document.createElement("a");
        link.download = `ThoiKhoaBieu_Tuan.png`;
        link.href = image;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      console.error(err);
      alert("Lỗi xuất ảnh (HTML-to-image): " + (err.message || err));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportText = () => {
    const dates = getWeekDates(selectedDate);
    let text = `Lịch học tuần (Từ ${dates[0].getDate()}/${dates[0].getMonth() + 1} - ${dates[6].getDate()}/${dates[6].getMonth() + 1})\n\n`;
    let hasData = false;
    
    dates.forEach(date => {
      const blocks = generateBlocksForDate(date);
      const busy = blocks.filter(b => b.type !== 'free');
      if (busy.length > 0) {
        hasData = true;
        text += `Ngày ${date.getDate()}/${date.getMonth() + 1}:\n`;
        busy.forEach(b => {
          if (b.type === 'class') {
            text += `- ${formatTime(b.start)} - ${formatTime(b.end)}: ${b.data.tenMonHoc || "Môn học"}\n`;
            text += `  Phòng: ${b.data.tenPhong || "Chưa rõ"}\n`;
          } else {
            text += `- ${formatTime(b.start)} - ${formatTime(b.end)}: ${b.data.name} (Ghi chú)\n`;
          }
        });
        text += '\n';
      }
    });
    
    if (!hasData) {
      alert("Không có lịch tuần này để copy!");
      return;
    }
    
    navigator.clipboard.writeText(text);
    alert("Đã copy lịch tuần vào clipboard!");
  };

  const getWeekDates = (date: Date) => {
    const monday = getMondayOfWeek(date);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  };
  
  const weekDates = getWeekDates(selectedDate);
  const DAY_START = 360; // 06:00
  const DAY_END = 1320; // 22:00

  const extractTime = (str: string): string => {
    if (!str) return '';
    const match = str.match(/(\d{1,2}):(\d{2})/);
    return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '';
  };

  const parseTime = (tStr: string) => {
    if (!tStr) return 0;
    const match = tStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 0;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    return h * 60 + m;
  };

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const getClassesForDate = (date: Date) => {
    const list = (weeklyData && weeklyData.length > 0) ? weeklyData : [];
    if (!list || !Array.isArray(list)) return [];

    const targetY = date.getFullYear();
    const targetM = date.getMonth() + 1;
    const targetD = date.getDate();

    return list.filter(cls => {
      if (!cls) return false;
      const dStr = cls.ngayHoc || cls.ngay || cls.date || cls.timeStart || cls.ngayBatDau || cls.ngayDay || cls.start_time || cls.ngayHocDuKien;
      if (!dStr) return false;

      if (typeof dStr === 'string') {
        const clean = dStr.trim().split(' ')[0].split('T')[0];
        if (clean.includes('/')) {
          const parts = clean.split('/').map(Number);
          if (parts.length === 3) {
            if (parts[0] > 1000) {
              if (parts[0] === targetY && parts[1] === targetM && parts[2] === targetD) return true;
            } else {
              if (parts[0] === targetD && parts[1] === targetM && parts[2] === targetY) return true;
            }
          }
        }
        if (clean.includes('-')) {
          const parts = clean.split('-').map(Number);
          if (parts.length === 3) {
            if (parts[0] > 1000) {
              if (parts[0] === targetY && parts[1] === targetM && parts[2] === targetD) return true;
            } else {
              if (parts[0] === targetD && parts[1] === targetM && parts[2] === targetY) return true;
            }
          }
        }
        const d = new Date(dStr);
        if (!isNaN(d.getTime()) && d.getDate() === targetD && d.getMonth() + 1 === targetM && d.getFullYear() === targetY) {
          return true;
        }
      }
      return false;
    });
  };

  const generateBlocksForDate = (date: Date) => {
    const classes = getClassesForDate(date);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayNotes = notes.filter(n => n.date === dateStr);

    const busySlots: { start: number, end: number, type: 'class' | 'note', data: any }[] = [];

    classes.forEach(cls => {
      let startTime = '';
      let endTime = '';
      if (cls.timeToDisplay && typeof cls.timeToDisplay === 'string' && cls.timeToDisplay.includes('-')) {
        const parts = cls.timeToDisplay.split('-');
        if (parts.length >= 2) {
          startTime = extractTime(parts[0]);
          endTime = extractTime(parts[1]);
        }
      }
      if (!startTime || !endTime) {
        if (cls.tuGio && cls.denGio) {
          startTime = extractTime(String(cls.tuGio));
          endTime = extractTime(String(cls.denGio));
        }
      }

      if (startTime && endTime) {
        const sMins = parseTime(startTime);
        const eMins = parseTime(endTime);
        if (eMins > sMins) {
          busySlots.push({
            start: sMins,
            end: eMins,
            type: 'class',
            data: cls
          });
        }
      }
    });

    dayNotes.forEach(note => {
      const sMins = parseTime(note.startTime);
      const eMins = parseTime(note.endTime);
      if (eMins > sMins) {
        busySlots.push({
          start: sMins,
          end: eMins,
          type: 'note',
          data: note
        });
      }
    });

    busySlots.sort((a, b) => a.start - b.start);
    
    const mergedBusy: { start: number, end: number }[] = [];
    busySlots.forEach(slot => {
      if (mergedBusy.length === 0) {
        mergedBusy.push({ start: slot.start, end: slot.end });
      } else {
        const last = mergedBusy[mergedBusy.length - 1];
        if (slot.start <= last.end) {
          last.end = Math.max(last.end, slot.end);
        } else {
          mergedBusy.push({ start: slot.start, end: slot.end });
        }
      }
    });

    const blocks: { start: number, end: number, type: 'class' | 'note' | 'free', data?: any }[] = [...busySlots];
    
    let current = DAY_START;
    mergedBusy.forEach(slot => {
      if (slot.start > current) {
        blocks.push({ start: current, end: slot.start, type: 'free' });
      }
      current = Math.max(current, slot.end);
    });
    
    if (current < DAY_END) {
      blocks.push({ start: current, end: DAY_END, type: 'free' });
    }
    
    return blocks;
  };

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const isCurrentTimeInRange = currentMins >= DAY_START && currentMins <= DAY_END;
  const currentTimeTop = (currentMins - DAY_START) * 1.1;

  const renderDateSelectorControls = () => (
    <div className="flex items-center gap-1.5 sm:gap-2 bg-bg-secondary p-1.5 rounded-2xl border border-border-color mt-2 sm:mt-0 shrink-0">
      <Button 
        isIconOnly 
        variant="ghost" 
        size="sm"
        className="bg-bg-primary shadow-xs border border-border-color w-8 h-8 sm:w-9 sm:h-9 rounded-xl cursor-pointer"
        onPress={() => {
          const d = new Date(selectedDate);
          d.setDate(d.getDate() - 7);
          onDateChange(d);
        }}
      >{"<"}</Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-xs font-semibold px-2.5 h-8 rounded-lg cursor-pointer bg-teal-500/10 text-[#008689] dark:text-[#2DD4BF] hover:bg-teal-500/20 border border-teal-500/20"
        onPress={() => onDateChange(new Date())}
      >
        Hôm nay
      </Button>
      <div className="flex flex-col items-center min-w-[130px] sm:min-w-[150px]">
        <span className="font-bold text-xs sm:text-[13px] text-text-primary">Tuần ({weekDates[0].getDate()}/{weekDates[0].getMonth()+1} - {weekDates[6].getDate()}/{weekDates[6].getMonth()+1})</span>
        <span className="text-[11px] text-text-tertiary font-medium">Năm {selectedDate.getFullYear()}</span>
      </div>
      <Button 
        isIconOnly 
        variant="ghost" 
        size="sm"
        className="bg-bg-primary shadow-xs border border-border-color w-8 h-8 sm:w-9 sm:h-9 rounded-xl cursor-pointer"
        onPress={() => {
          const d = new Date(selectedDate);
          d.setDate(d.getDate() + 7);
          onDateChange(d);
        }}
      >{">"}</Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 mt-4 md:mt-6 mb-12 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header Banner */}
      <div className="bg-bg-primary rounded-3xl border border-border-color p-7 sm:p-9 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-semibold text-[#008689] dark:text-[#2DD4BF] mb-2">
            Tiện ích sinh viên
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary">Thời gian biểu & Ghi chú tuần</h2>
          <p className="text-text-tertiary text-sm mt-1 max-w-2xl">
            Phân tích tuần học trực quan theo timeline. Khối màu là lịch học, thời gian rảnh hiển thị rõ ràng để bạn sắp xếp thêm lịch làm việc hoặc tự học.
          </p>
        </div>
      </div>

      {/* WEEKLY TIMELINE BLOCK */}
      <div className="bg-bg-primary rounded-3xl border border-border-color p-5 sm:p-8 shadow-sm overflow-hidden flex flex-col relative z-0">
        <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-3">
                <div className="h-10 w-10 bg-teal-500/10 text-[#008689] dark:text-[#2DD4BF] rounded-xl flex items-center justify-center shrink-0">
                  <IconCalendar size={20} />
                </div>
                Thời khóa biểu tuần
              </h3>
              <p className="text-text-tertiary text-xs sm:text-sm mt-1">Quản lý lịch học, thời gian rảnh và thêm ca làm thêm.</p>
            </div>
            {renderDateSelectorControls()}
          </div>
          <Button 
            className="bg-[#008689] hover:bg-[#006f72] text-white font-semibold rounded-xl shadow-xs transition-all cursor-pointer" 
            onPress={() => {
              const todayStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
              setNewNoteDate(todayStr);
              setNewNoteStart("07:00");
              setNewNoteEnd("09:00");
              setIsNoteModalOpen(true);
            }}
          >
            <IconPlus size={18} /> Thêm Ghi chú
          </Button>
        </div>
        
        <div className={`w-full overflow-x-auto pb-4 transition-opacity duration-200 ${loadingWeekly ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex gap-2 min-w-[900px] xl:min-w-full bg-bg-secondary p-4 rounded-3xl border border-border-color" ref={exportRef}>
            {/* Timeline Labels Column */}
            <div className="w-12 flex flex-col shrink-0 bg-transparent">
              {/* Header spacer to match day column headers height */}
              <div className="h-16 mb-4 shrink-0 flex items-center justify-end pr-2 text-[11px] font-bold text-text-tertiary uppercase">
                Giờ
              </div>
              <div className="relative w-full" style={{ height: `${(DAY_END - DAY_START) * 1.1}px` }}>
                {Array.from({ length: 17 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute right-2 -translate-y-1/2 text-[11px] sm:text-xs font-bold text-text-tertiary text-right select-none tabular-nums" 
                    style={{ top: `${i * 66}px` }}
                  >
                    {String(6 + i).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
            </div>

            {/* Day Columns */}
            {weekDates.map(date => {
               const blocks = generateBlocksForDate(date);
               const isSelectedDate = date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
               const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
               const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
               
               return (
                 <div key={date.toISOString()} className={`flex-1 flex flex-col min-w-[120px] rounded-2xl ${isSelectedDate ? 'bg-teal-500/5' : ''}`}>
                   {/* Column Header */}
                   <div 
                     className={`text-center h-16 mb-4 rounded-2xl px-2 shadow-xs border cursor-pointer transition-all flex flex-col items-center justify-center shrink-0 ${
                       isSelectedDate 
                         ? 'bg-[#008689] text-white border-[#008689] shadow-teal-500/20' 
                         : isToday
                         ? 'bg-teal-500/10 border-teal-500/30 text-[#008689] dark:text-[#2DD4BF]'
                         : 'bg-bg-primary text-text-secondary border-border-color hover:bg-bg-secondary'
                     }`} 
                     onClick={() => onDateChange(date)}
                   >
                     <span className="uppercase text-xs font-bold leading-tight">
                       {date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                     </span>
                     <span className={`text-sm font-semibold mt-0.5 leading-tight ${isSelectedDate ? 'text-teal-100' : 'text-text-primary'}`}>
                       {date.getDate()}/{date.getMonth() + 1}
                     </span>
                   </div>
                   
                   {/* Timeline Column Canvas */}
                   <div className="relative flex-1 w-full" style={{ height: `${(DAY_END - DAY_START) * 1.1}px` }}>
                     {/* Hour Grid Lines */}
                     <div className="absolute inset-0 pointer-events-none z-0">
                       {Array.from({ length: 17 }).map((_, i) => (
                         <div 
                           key={i} 
                           className="absolute left-0 right-0 border-t border-border-strong/40" 
                           style={{ top: `${i * 66}px` }}
                         />
                       ))}
                     </div>

                     {/* Current time indicator line if this column is today */}
                     {isToday && isCurrentTimeInRange && (
                       <div 
                         className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                         style={{ top: `${currentTimeTop}px` }}
                       >
                         <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm -ml-1 border-2 border-white"></div>
                         <div className="flex-1 border-t-2 border-rose-500 border-dashed opacity-80"></div>
                       </div>
                     )}
                     
                     {/* Blocks */}
                     {blocks.map((block, i) => {
                       if (block.end <= DAY_START || block.start >= DAY_END) return null;
                       
                       const renderStart = Math.max(DAY_START, block.start);
                       const renderEnd = Math.min(DAY_END, block.end);
                       const rTop = (renderStart - DAY_START) * 1.1;
                       const rHeight = (renderEnd - renderStart) * 1.1;
                       
                       const GAP = 3;
                       const finalTop = rTop + GAP;
                       const finalHeight = Math.max(30, rHeight - GAP * 2);

                       const isClass = block.type === 'class';
                       const classLink = isClass ? (block.data?.link || block.data?.url || block.data?.lmsUrl || block.data?.courseUrl) : undefined;

                       return (
                         <div 
                           key={i} 
                           className={`absolute left-1 right-1 p-2 sm:p-2.5 rounded-xl overflow-hidden transition-all group flex flex-col justify-between ${
                             block.type === 'free' ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-500/20' : 
                             block.type === 'class' ? 'bg-[#008689] text-white hover:bg-[#006f72] hover:z-30 hover:shadow-md cursor-pointer' : 
                             'bg-rose-500 text-white hover:bg-rose-600 hover:z-30 hover:shadow-md'
                           }`}
                           style={{ top: `${finalTop}px`, height: `${finalHeight}px`, zIndex: block.type === 'free' ? 10 : 20 }}
                           title={isClass ? `${block.data?.tenMonHoc}${block.data?.tenPhong ? ` - Phòng: ${block.data.tenPhong}` : ''}${classLink ? ' (Nhấn để mở môn học trên LMS)' : ''}` : block.data?.name}
                           onClick={() => {
                              if (block.type === 'free') {
                                 setNewNoteDate(dateStr);
                                 setNewNoteStart(formatTime(block.start));
                                 setNewNoteEnd(formatTime(Math.min(block.start + 60, block.end)));
                                 setIsNoteModalOpen(true);
                              } else if (isClass && classLink) {
                                 openUrl(classLink).catch(console.error);
                              }
                           }}
                         >
                           {/* Time Header */}
                           {block.type !== 'free' && (
                             <div className="text-[11px] sm:text-xs font-bold opacity-90 mb-1 whitespace-nowrap leading-none flex items-center justify-between shrink-0">
                               <span>{formatTime(block.start)} - {formatTime(block.end)}</span>
                               {isClass && classLink && (
                                 <IconExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                               )}
                             </div>
                           )}

                           {/* Card Body */}
                           {block.type === 'free' ? (
                             <div className="text-[11px] sm:text-xs font-bold leading-none opacity-0 group-hover:opacity-100 flex items-center justify-center h-full text-emerald-600 dark:text-emerald-400 transition-opacity">
                               + Thêm ghi chú
                             </div>
                           ) : block.type === 'class' ? (
                             <div className="flex-1 min-h-0 flex flex-col justify-between gap-1">
                               <div className="text-xs sm:text-[13px] font-bold leading-snug line-clamp-2" title={block.data.tenMonHoc}>
                                 {block.data.tenMonHoc}
                               </div>
                               <div className="shrink-0 flex flex-col gap-0.5 mt-auto">
                                 {block.data.tenPhong && (
                                   <div className="text-[11px] opacity-90 font-medium truncate" title={block.data.tenPhong}>
                                     Phòng: {block.data.tenPhong}
                                   </div>
                                 )}
                                 {block.data.giangVien && (
                                   <div className="text-[10px] opacity-75 truncate" title={block.data.giangVien}>
                                     GV: {block.data.giangVien}
                                   </div>
                                 )}
                               </div>
                             </div>
                           ) : (
                             <div className="flex-1 min-h-0 flex flex-col justify-between">
                               <div className="flex justify-between items-start gap-1">
                                 <div className="text-xs sm:text-[13px] font-bold leading-snug line-clamp-3" title={block.data.name}>
                                   {block.data.name}
                                 </div>
                                 <button 
                                   type="button"
                                   className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 bg-bg-primary hover:bg-rose-50 rounded-md transition-all shrink-0 -mt-0.5 -mr-0.5 cursor-pointer"
                                   onClick={(e) => { e.stopPropagation(); handleDeleteNote(block.data.id); }}
                                 >
                                   <IconTrash size={12} />
                                 </button>
                               </div>
                               <span className="text-[10px] opacity-80 uppercase tracking-wider font-semibold mt-auto">Ghi chú</span>
                             </div>
                           )}
                         </div>
                       );
                     })}
                   </div>
                 </div>
               );
            })}
          </div>
        </div>
      </div>

      {/* EXPORT BLOCK */}
      <div className="bg-bg-primary rounded-3xl border border-border-color p-5 sm:p-8 shadow-sm overflow-hidden mt-2">
        <div className="mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-3">
            <div className="h-10 w-10 bg-teal-500/10 text-[#008689] dark:text-[#2DD4BF] rounded-xl flex items-center justify-center shrink-0">
              <IconCopy size={20} />
            </div>
            Trích xuất dữ liệu
          </h3>
          <p className="text-text-tertiary text-sm mt-1">Xuất thời khóa biểu tuần ra ảnh hoặc sao chép lịch học dạng văn bản.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div 
            onClick={isExporting ? undefined : handleExportImage}
            className={`bg-bg-secondary border border-border-color rounded-2xl p-6 transition-all group flex flex-col items-center text-center ${isExporting ? 'opacity-70 cursor-wait' : 'hover:border-teal-500/40 hover:shadow-xs cursor-pointer'}`}
          >
            <div className={`w-14 h-14 bg-bg-primary rounded-2xl flex items-center justify-center text-[#008689] dark:text-[#2DD4BF] mb-4 transition-all shadow-xs ${isExporting ? 'scale-105 bg-[#008689] text-white' : 'group-hover:scale-105 group-hover:bg-[#008689] group-hover:text-white'}`}>
              {isExporting ? <IconLoader2 className="animate-spin" size={24} /> : <IconDownload size={24} />}
            </div>
            <h4 className="text-base font-bold text-text-primary mb-1">{isExporting ? "Đang xử lý ảnh..." : "Tải ảnh TKB tuần"}</h4>
            <p className="text-text-tertiary text-xs leading-relaxed max-w-xs">Chụp lại toàn bộ khung thời khóa biểu tuần ở trên làm hình nền máy tính hoặc điện thoại.</p>
          </div>
          
          <div 
            onClick={handleExportText}
            className="bg-bg-secondary border border-border-color rounded-2xl p-6 hover:border-teal-500/40 hover:shadow-xs transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-14 h-14 bg-bg-primary rounded-2xl flex items-center justify-center text-[#008689] dark:text-[#2DD4BF] mb-4 group-hover:scale-105 group-hover:bg-[#008689] group-hover:text-white transition-all shadow-xs">
              <IconCopy size={24} />
            </div>
            <h4 className="text-base font-bold text-text-primary mb-1">Sao chép lịch tuần</h4>
            <p className="text-text-tertiary text-xs leading-relaxed max-w-xs">Sao chép toàn bộ lịch trình dạng văn bản có cấu trúc để gửi cho bạn bè hoặc nhóm học.</p>
          </div>
        </div>
      </div>

      <Modal isOpen={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading className="font-bold text-lg">Thêm Lịch / Ghi chú</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="py-4">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Tên sự kiện / Ghi chú</label>
                    <input type="text" value={newNoteName} onChange={(e) => setNewNoteName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-border-strong bg-bg-secondary outline-none focus:border-[#008689] focus:ring-2 focus:ring-[#008689]/20 text-text-primary text-sm" placeholder="VD: Đi làm thêm, Học nhóm..." />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Ngày</label>
                    <input type="date" value={newNoteDate} onChange={(e) => { setNewNoteDate(e.target.value); e.target.blur(); }} className="w-full px-3.5 py-2.5 rounded-xl border border-border-strong bg-bg-secondary outline-none focus:border-[#008689] focus:ring-2 focus:ring-[#008689]/20 text-text-primary text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Giờ bắt đầu</label>
                      <input type="time" value={newNoteStart} onChange={(e) => setNewNoteStart(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-border-strong bg-bg-secondary outline-none focus:border-[#008689] focus:ring-2 focus:ring-[#008689]/20 text-text-primary text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Giờ kết thúc</label>
                      <input type="time" value={newNoteEnd} onChange={(e) => setNewNoteEnd(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-border-strong bg-bg-secondary outline-none focus:border-[#008689] focus:ring-2 focus:ring-[#008689]/20 text-text-primary text-sm" />
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="ghost" onPress={() => setIsNoteModalOpen(false)}>Hủy</Button>
                <Button className="bg-[#008689] hover:bg-[#006f72] text-white font-bold rounded-xl" onPress={handleAddNote}>Lưu Ghi chú</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
