import { useState, useRef, useEffect } from 'react';
import { Button, Modal } from '@heroui/react';
import { Calendar, Download, Plus, Trash2, Copy } from 'lucide-react';
import { toPng } from 'html-to-image';

import { invoke } from '@tauri-apps/api/core';

export default function UtilitiesPage({

  monthlyData = [],
  selectedDate = new Date(),
  onDateChange = () => {}
}: {
  dailyData?: any[];
  monthlyData?: any[];
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}) {
  const exportRef = useRef<HTMLDivElement>(null);

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
    if (!exportRef.current) return;
    try {
      // Find current bg of exportRef
      const bgColor = window.getComputedStyle(exportRef.current).backgroundColor;
      const image = await toPng(exportRef.current, { backgroundColor: bgColor, pixelRatio: 2 });
      try {
        await invoke('save_base64_image', { base64Data: image });
        alert("Đã tải ảnh về thư mục Downloads thành công!");
      } catch (invokeErr) {
        alert("Lưu bằng Backend lỗi: " + invokeErr + ". Sẽ thử lưu bằng trình duyệt...");
        // Fallback for browsers/environments without rust API
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
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(date);
    startOfWeek.setDate(diff);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  };
  
  const weekDates = getWeekDates(selectedDate);
  const DAY_START = 360; // 06:00
  const DAY_END = 1320; // 22:00

  const parseTime = (tStr: string) => {
    if (!tStr) return 0;
    const [h, m] = tStr.trim().split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const getClassesForDate = (date: Date) => {
    if (!monthlyData || !Array.isArray(monthlyData)) return [];
    return monthlyData.filter(cls => {
      const dStr = cls.ngayHoc || cls.ngay || cls.date || cls.timeStart || cls.ngayBatDau || cls.start_time || cls.ngayHocDuKien;
      if (dStr) {
        if (typeof dStr === 'string') {
           const str = dStr.split(' ')[0];
           if (str.includes('/')) {
             const parts = str.split('/');
             if (parts.length === 3 && Number(parts[0]) === date.getDate() && Number(parts[1]) === date.getMonth() + 1 && Number(parts[2]) === date.getFullYear()) return true;
           }
           if (str.includes('-')) {
             const parts = str.split('-');
             if (parts.length === 3 && Number(parts[0]) === date.getFullYear() && Number(parts[1]) === date.getMonth() + 1 && Number(parts[2]) === date.getDate()) return true;
             if (parts.length === 3 && Number(parts[2]) === date.getFullYear() && Number(parts[1]) === date.getMonth() + 1 && Number(parts[0]) === date.getDate()) return true;
           }
        }
        const d = new Date(dStr);
        if (!isNaN(d.getTime()) && d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()) return true;
      }
      
      const clsStr = JSON.stringify(cls);
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return clsStr.includes(`"${dd}/${mm}/${yyyy}"`) || clsStr.includes(`"${yyyy}-${mm}-${dd}"`) || clsStr.includes(`"${yyyy}/${mm}/${dd}"`);
    });
  };

  const generateBlocksForDate = (date: Date) => {
    const classes = getClassesForDate(date);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayNotes = notes.filter(n => n.date === dateStr);

    const busySlots: { start: number, end: number, type: 'class' | 'note', data: any }[] = [];

    classes.forEach(cls => {
      if (cls.timeToDisplay) {
        const parts = cls.timeToDisplay.split('-');
        if (parts.length === 2) {
          busySlots.push({
            start: parseTime(parts[0]),
            end: parseTime(parts[1]),
            type: 'class',
            data: cls
          });
        }
      }
    });

    dayNotes.forEach(note => {
      busySlots.push({
        start: parseTime(note.startTime),
        end: parseTime(note.endTime),
        type: 'note',
        data: note
      });
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

  const renderDateSelectorControls = () => (
    <div className="flex items-center gap-2 bg-bg-secondary p-2 rounded-2xl border border-border-color mt-2 sm:mt-0 shrink-0">
      <Button 
        isIconOnly 
        variant="ghost" 
        size="sm"
        className="bg-bg-primary shadow-sm border border-border-strong w-10 h-10"
        onPress={() => {
          const d = new Date(selectedDate);
          d.setDate(d.getDate() - 7);
          onDateChange(d);
        }}
      >{"<"}</Button>
      <div className="flex flex-col items-center min-w-[150px]">
        <span className="font-bold text-[13px] sm:text-[15px] text-text-secondary">Tuần (Từ {weekDates[0].getDate()}/{weekDates[0].getMonth()+1} - {weekDates[6].getDate()}/{weekDates[6].getMonth()+1})</span>
        <span className="text-xs text-text-tertiary font-medium">Năm {selectedDate.getFullYear()}</span>
      </div>
      <Button 
        isIconOnly 
        variant="ghost" 
        size="sm"
        className="bg-bg-primary shadow-sm border border-border-strong w-10 h-10"
        onPress={() => {
          const d = new Date(selectedDate);
          d.setDate(d.getDate() + 7);
          onDateChange(d);
        }}
      >{">"}</Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 mt-4 md:mt-8 mb-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Tiện ích Thời gian biểu</h2>
        <p className="text-blue-100 font-medium text-base sm:text-lg max-w-2xl">Phân tích tuần học trực quan. Khối Đỏ là lịch học, Xanh là thời gian trống. Nhấn vào khối rảnh để thêm lịch làm việc hoặc ghi chú!</p>
      </div>

      {/* WEEKLY TIMELINE BLOCK */}
      <div className="bg-bg-primary rounded-3xl border border-border-color p-5 sm:p-8 shadow-sm overflow-hidden flex flex-col relative z-0">
        <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar width={20} height={20} />
                </div>
                Thời khóa biểu & Ghi chú tuần
              </h3>
              <p className="text-text-tertiary mt-1">Quản lý lịch học, thời gian rảnh và thêm lịch làm việc cá nhân.</p>
            </div>
            {renderDateSelectorControls()}
          </div>
          <Button 
            className="bg-blue-600 text-white font-bold shadow-sm hover:shadow-md transition-shadow" 
            onPress={() => {
              const todayStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
              setNewNoteDate(todayStr);
              setNewNoteStart("07:00");
              setNewNoteEnd("09:00");
              setIsNoteModalOpen(true);
            }}
          >
            <Plus width={18} height={18} /> Thêm Ghi chú
          </Button>
        </div>
        
        <div className="w-full overflow-x-auto pb-4">
          <div className="flex gap-2 min-w-[900px] xl:min-w-full bg-bg-secondary p-4 rounded-3xl border border-border-color" ref={exportRef}>
            {/* Timeline Labels Column */}
            <div className="w-12 flex flex-col pt-[52px] shrink-0 bg-transparent">
              {Array.from({ length: 17 }).map((_, i) => (
                <div key={i} className="text-[11px] sm:text-xs font-bold text-text-tertiary text-right pr-2" style={{ height: '66px' }}>
                  {String(6 + i).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDates.map(date => {
               const blocks = generateBlocksForDate(date);
               const isSelectedDate = date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth();
               const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
               
               return (
                 <div key={date.toISOString()} className={`flex-1 flex flex-col min-w-[120px] rounded-2xl ${isSelectedDate ? 'bg-blue-100/30' : ''}`}>
                   <div className={`text-center font-bold mb-4 rounded-xl py-3 shadow-sm border border-border-color cursor-pointer transition-colors ${isSelectedDate ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/30' : 'bg-bg-primary text-text-secondary hover:bg-bg-secondary'}`} onClick={() => onDateChange(date)}>
                     <span className="uppercase text-sm">{date.toLocaleDateString('vi-VN', { weekday: 'short' })}</span><br/>
                     <span className={`text-sm font-medium ${isSelectedDate ? 'text-blue-100' : 'text-text-tertiary'}`}>{date.getDate()}/{date.getMonth()+1}</span>
                   </div>
                   
                   <div className="relative flex flex-col gap-1 w-full" style={{ height: `${(DAY_END - DAY_START) * 1.1}px` }}>
                     {/* Hour Grid Lines */}
                     <div className="absolute inset-0 pointer-events-none z-0">
                       {Array.from({ length: 17 }).map((_, i) => (
                         <div key={i} className="border-t border-border-strong/60 w-full" style={{ height: '66px' }}></div>
                       ))}
                     </div>
                     
                     {/* Blocks */}
                     {blocks.map((block, i) => {
                       if (block.end <= DAY_START || block.start >= DAY_END) return null;
                       
                       const renderStart = Math.max(DAY_START, block.start);
                       const renderEnd = Math.min(DAY_END, block.end);
                       const rTop = (renderStart - DAY_START) * 1.1;
                       const rHeight = (renderEnd - renderStart) * 1.1;
                       
                       const GAP = 4; // 4px margin on top and bottom = 8px total vertical separation
                       const finalTop = rTop + GAP;
                       const finalHeight = Math.max(0, rHeight - GAP * 2);

                       return (
                         <div 
                           key={i} 
                           className={`absolute left-1 right-1 p-2 sm:p-2.5 rounded-xl overflow-hidden transition-all group ${
                             block.type === 'free' ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-500 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40' : 
                             block.type === 'class' ? 'bg-blue-600 text-white hover:bg-blue-700 hover:z-20 hover:scale-[1.02] shadow-sm' : 
                             'bg-rose-500 text-white hover:bg-rose-600 hover:z-20 hover:scale-[1.02] shadow-sm'
                           }`}
                           style={{ top: `${finalTop}px`, height: `${finalHeight}px`, zIndex: block.type === 'free' ? 10 : 20 }}
                           onClick={() => {
                              if (block.type === 'free') {
                                 setNewNoteDate(dateStr);
                                 setNewNoteStart(formatTime(block.start));
                                 setNewNoteEnd(formatTime(Math.min(block.start + 60, block.end)));
                                 setIsNoteModalOpen(true);
                              }
                           }}
                         >
                           {block.type !== 'free' && (
                             <div className="text-[11px] sm:text-xs font-bold opacity-90 mb-1 whitespace-nowrap leading-none">{formatTime(block.start)} - {formatTime(block.end)}</div>
                           )}
                           {block.type === 'free' ? (
                             <div className="text-[11px] sm:text-xs font-bold leading-none mt-1 opacity-0 group-hover:opacity-100 flex items-center justify-center h-full text-emerald-600 transition-opacity">
                               + Thêm ghi chú
                             </div>
                           ) : block.type === 'class' ? (
                             <div className="text-xs sm:text-[13px] font-bold leading-snug line-clamp-3" title={block.data.tenMonHoc}>{block.data.tenMonHoc}</div>
                           ) : (
                             <div className="flex justify-between items-start gap-1">
                               <div className="text-xs sm:text-[13px] font-bold leading-snug line-clamp-3" title={block.data.name}>{block.data.name}</div>
                               <button 
                                 className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 bg-bg-primary hover:bg-rose-50 rounded-md transition-all shrink-0 -mt-1 -mr-1"
                                 onClick={(e) => { e.stopPropagation(); handleDeleteNote(block.data.id); }}
                               >
                                 <Trash2 width={12} height={12} />
                               </button>
                             </div>
                           )}
                         </div>
                       );
                     })}
                   </div>
                 </div>
               )
            })}
          </div>
        </div>
      </div>

      {/* EXPORT BLOCK */}
      <div className="bg-bg-primary rounded-3xl border border-border-color p-5 sm:p-8 shadow-sm overflow-hidden mt-2">
        <div className="mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
              <Copy width={20} height={20} />
            </div>
            Trích xuất Dữ liệu
          </h3>
          <p className="text-text-tertiary mt-1">Xuất thời khóa biểu tuần ra ảnh hoặc copy lịch học ngày.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={handleExportImage}
            className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 rounded-3xl p-6 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-bg-primary rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
              <Download width={28} height={28} />
            </div>
            <h4 className="text-xl font-bold text-purple-900 mb-2">Tải Ảnh TKB Tuần</h4>
            <p className="text-purple-600/80 text-sm leading-relaxed">Chụp lại toàn bộ khung thời khóa biểu tuần ở trên làm hình nền.</p>
          </div>
          
          <div 
            onClick={handleExportText}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-3xl p-6 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-bg-primary rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-5 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <Copy width={28} height={28} />
            </div>
            <h4 className="text-xl font-bold text-blue-900 mb-2">Copy Lịch Tuần</h4>
            <p className="text-blue-600/80 text-sm leading-relaxed">Sao chép lịch trình dạng chữ của cả tuần để gửi cho bạn bè.</p>
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
                    <label className="text-sm font-semibold text-text-secondary mb-1 block">Tên sự kiện / Ghi chú</label>
                    <input type="text" value={newNoteName} onChange={(e) => setNewNoteName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-border-strong outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="VD: Đi làm thêm, Học nhóm..." />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-text-secondary mb-1 block">Ngày</label>
                    <input type="date" value={newNoteDate} onChange={(e) => setNewNoteDate(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-border-strong outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-text-secondary mb-1 block">Giờ bắt đầu</label>
                      <input type="time" value={newNoteStart} onChange={(e) => setNewNoteStart(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-border-strong outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-secondary mb-1 block">Giờ kết thúc</label>
                      <input type="time" value={newNoteEnd} onChange={(e) => setNewNoteEnd(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-border-strong outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="ghost" onPress={() => setIsNoteModalOpen(false)}>Hủy</Button>
                <Button className="bg-blue-600 text-white font-bold" onPress={handleAddNote}>Lưu Ghi chú</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
