import { useState, useEffect } from 'react';
import { Target, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AcademicStats({ token, callApi }: { token: string, callApi: (command: string, args: any) => Promise<any> }) {
  const [progress, setProgress] = useState<{ canDat: number, hienTai: number } | null>(null);
  const [semesters, setSemesters] = useState<{ id: number, tenDot: string }[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!token) return;
    async function init() {
      setLoading(true);
      try {
        const [progRes, semRes] = await Promise.all([
          callApi("fetch_portal_get", { token, endpoint: "hoctap/tiendo" }),
          callApi("fetch_portal_get", { token, endpoint: "hoctap/hocky" })
        ]);
        if (progRes?.success && progRes.body) setProgress(progRes.body);
        if (semRes?.success && semRes.body && Array.isArray(semRes.body)) {
          setSemesters(semRes.body);
          if (semRes.body.length > 0) {
            setSelectedSemester(prev => prev ?? semRes.body[0].id);
          }
        }
      } catch(e) {
        console.error("Lỗi lấy tiến độ", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [token, callApi]);

  useEffect(() => {
    if (!token || !selectedSemester) return;
    async function fetchSemesterDetails() {
      setLoadingDetails(true);
      try {
        const [subRes, gradeRes] = await Promise.all([
          callApi("fetch_portal_get", { token, endpoint: `hoctap/montheoky/${selectedSemester}` }),
          callApi("fetch_portal_get", { token, endpoint: `hoctap/kqtheoky/${selectedSemester}` })
        ]);
        if (subRes?.success && subRes.body) setSubjects(subRes.body);
        else setSubjects([]);
        
        if (gradeRes?.success && gradeRes.body) setGrades(gradeRes.body);
        else setGrades([]);
      } catch(e) {
        console.error("Lỗi lấy chi tiết học kỳ", e);
      } finally {
        setLoadingDetails(false);
      }
    }
    fetchSemesterDetails();
  }, [token, selectedSemester, callApi]);
  
  const mergedData = subjects.map(sub => {
    const gradeInfo = grades.find(g => 
      g.lopHocPhan === sub.tenMonHoc || 
      g.lopHocPhan.includes(sub.tenMonHoc) || 
      sub.tenMonHoc.includes(g.lopHocPhan)
    );
    return {
      ...sub,
      diemTongKet: gradeInfo?.diemTongKet !== undefined ? gradeInfo.diemTongKet : null
    };
  });

  const getGPA = (score: number) => {
    if (score >= 8.5) return { gpa: 4.0, text: 'Xuất sắc', color: 'text-green-700', bg: 'bg-green-100', bar: 'bg-green-500' };
    if (score >= 8.0) return { gpa: 3.5, text: 'Giỏi', color: 'text-blue-700', bg: 'bg-blue-100', bar: 'bg-blue-500' };
    if (score >= 7.0) return { gpa: 3.0, text: 'Khá', color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-400' };
    if (score >= 6.5) return { gpa: 2.5, text: 'TB Khá', color: 'text-orange-700', bg: 'bg-orange-100', bar: 'bg-orange-500' };
    if (score >= 5.5) return { gpa: 2.0, text: 'Trung bình', color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-400' };
    if (score >= 5.0) return { gpa: 1.5, text: 'TB Yếu', color: 'text-yellow-700', bg: 'bg-yellow-100', bar: 'bg-yellow-500' };
    if (score >= 4.0) return { gpa: 1.0, text: 'Yếu', color: 'text-yellow-600', bg: 'bg-yellow-50', bar: 'bg-yellow-400' };
    return { gpa: 0.0, text: 'Kém', color: 'text-red-700', bg: 'bg-red-100', bar: 'bg-red-500' };
  };

  const validSubjects = mergedData.filter(x => x.diemTongKet !== null && x.soTinChi > 0);
  const totalCredits = validSubjects.reduce((acc, curr) => acc + curr.soTinChi, 0);
  const totalGPA = validSubjects.reduce((acc, curr) => acc + getGPA(curr.diemTongKet).gpa * curr.soTinChi, 0);
  const semesterGPA = totalCredits > 0 ? (totalGPA / totalCredits).toFixed(2) : "0.00";

  return (
    <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-bg-primary rounded-2xl border border-border-color shadow-sm p-6 flex flex-col justify-center">
         <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-3">
           <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
             <Target className="w-5 h-5" />
           </div>
           Tiến độ học tập
         </h3>
         <AnimatePresence mode="wait">
           {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="animate-pulse bg-bg-tertiary h-16 rounded-xl w-full"></motion.div>
           ) : progress ? (
              <motion.div key="content" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center gap-6 mt-2">
                <div className="relative w-28 h-28 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      className="text-bg-tertiary stroke-current"
                      strokeWidth="8"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                    ></circle>
                    <circle
                      className="text-blue-500 stroke-current drop-shadow-sm transition-all duration-1000 ease-out"
                      strokeWidth="8"
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - Math.min(1, progress.hienTai / progress.canDat))}
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-blue-600">{Math.round((progress.hienTai / progress.canDat) * 100)}%</span>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <span className="text-sm font-bold text-text-tertiary uppercase tracking-wider">Tích lũy</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-text-primary">{progress.hienTai}</span>
                    <span className="text-sm font-semibold text-text-tertiary">/ {progress.canDat} Tín chỉ</span>
                  </div>
                </div>
              </motion.div>
           ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-text-tertiary font-medium">Không có dữ liệu tiến độ.</motion.div>
           )}
         </AnimatePresence>
      </div>

      <div className="lg:col-span-2 bg-bg-primary rounded-2xl border border-border-color shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 sm:px-6 border-b border-border-color flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-secondary/50">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              GPA Học kỳ
            </h3>
            {validSubjects.length > 0 && !loadingDetails && (
              <div className="flex flex-col border-l border-border-strong pl-4">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Trung bình</span>
                <span className="text-2xl font-black text-indigo-600 leading-none">{semesterGPA}</span>
              </div>
            )}
          </div>
          <select 
            className="px-4 py-2.5 rounded-xl border border-border-strong text-sm font-bold text-text-secondary outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all bg-bg-primary shadow-sm min-w-[220px]"
            value={selectedSemester || ""}
            onChange={(e) => setSelectedSemester(Number(e.target.value))}
            disabled={loading || semesters.length === 0}
          >
            {semesters.map(s => <option key={s.id} value={s.id}>{s.tenDot}</option>)}
          </select>
        </div>
        
        <div className="flex-1 overflow-x-auto p-0 max-h-[360px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex flex-col gap-5 p-5 sm:px-6">
            <AnimatePresence mode="wait">
              {loadingDetails ? (
                 <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-5">
                   {Array(3).fill(0).map((_, i) => (
                     <div key={i} className="flex flex-col gap-2 animate-pulse">
                       <div className="flex justify-between items-end">
                         <div>
                           <div className="h-4 bg-bg-tertiary rounded w-48 mb-2"></div>
                           <div className="h-3 bg-bg-tertiary rounded w-24"></div>
                         </div>
                         <div className="h-6 bg-bg-tertiary rounded w-10"></div>
                       </div>
                       <div className="w-full bg-bg-tertiary rounded-full h-2.5"></div>
                     </div>
                   ))}
                 </motion.div>
              ) : mergedData.length === 0 ? (
                 <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-10 text-center text-text-tertiary font-medium">Chưa có dữ liệu môn học cho học kỳ này.</motion.div>
              ) : (
                <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-5">
                  {mergedData.map((item, idx) => {
                    const hasGrade = item.diemTongKet !== null;
                    const gpa = hasGrade ? getGPA(item.diemTongKet) : null;
                    
                    return (
                      <div key={idx} className="flex flex-col gap-2.5 group">
                        <div className="flex justify-between items-end">
                           <div className="flex flex-col">
                             <span className="font-bold text-text-secondary text-sm group-hover:text-indigo-600 transition-colors">{item.tenMonHoc}</span>
                             <span className="text-xs text-text-tertiary font-medium tracking-wide mt-0.5">{item.maHocPhan} &bull; {item.soTinChi} Tín chỉ</span>
                           </div>
                           <div className="flex flex-col items-end">
                             {hasGrade && gpa ? (
                               <>
                                 <span className={`font-black text-xl leading-none ${gpa.color}`}>{gpa.gpa.toFixed(1)}</span>
                                 <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${gpa.color}`}>{gpa.text}</span>
                               </>
                             ) : (
                               <span className="text-xs font-semibold text-text-tertiary bg-bg-tertiary px-2 py-1 rounded-lg">Chưa có</span>
                             )}
                           </div>
                        </div>
                        {hasGrade && gpa ? (
                          <div className="w-full bg-bg-tertiary rounded-full h-2.5 overflow-hidden">
                             <div 
                               className={`h-full rounded-full ${gpa.bar} transition-all duration-1000 relative`} 
                               style={{ width: `${(gpa.gpa / 4.0) * 100}%` }}
                             >
                               {/* optional glare effect */}
                               <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/20"></div>
                             </div>
                          </div>
                        ) : (
                          <div className="w-full bg-bg-secondary border border-border-color border-dashed rounded-full h-2.5"></div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
