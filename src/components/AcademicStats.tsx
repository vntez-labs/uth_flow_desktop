import { useState, useEffect } from 'react';
import { IconBook2, IconChevronDown, IconCertificate, IconExternalLink } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { openUrl } from '@tauri-apps/plugin-opener';

const MotionDiv = (motion as any).div;

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
    if (score >= 8.5) return { gpa: 4.0, text: 'Xuất sắc', color: 'text-emerald-600', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500' };
    if (score >= 8.0) return { gpa: 3.5, text: 'Giỏi', color: 'text-[#008689]', bg: 'bg-teal-500/10', bar: 'bg-[#008689]' };
    if (score >= 7.0) return { gpa: 3.0, text: 'Khá', color: 'text-teal-600', bg: 'bg-teal-500/10', bar: 'bg-teal-500' };
    if (score >= 6.5) return { gpa: 2.5, text: 'TB Khá', color: 'text-amber-600', bg: 'bg-amber-500/10', bar: 'bg-amber-500' };
    if (score >= 5.5) return { gpa: 2.0, text: 'Trung bình', color: 'text-amber-600', bg: 'bg-amber-500/10', bar: 'bg-amber-500' };
    if (score >= 5.0) return { gpa: 1.5, text: 'TB Yếu', color: 'text-orange-600', bg: 'bg-orange-500/10', bar: 'bg-orange-500' };
    if (score >= 4.0) return { gpa: 1.0, text: 'Yếu', color: 'text-orange-600', bg: 'bg-orange-500/10', bar: 'bg-orange-500' };
    return { gpa: 0.0, text: 'Kém', color: 'text-rose-600', bg: 'bg-rose-500/10', bar: 'bg-rose-500' };
  };

  const validSubjects = mergedData.filter(x => x.diemTongKet !== null && x.soTinChi > 0);
  const totalCredits = validSubjects.reduce((acc, curr) => acc + curr.soTinChi, 0);
  const totalGPA = validSubjects.reduce((acc, curr) => acc + getGPA(curr.diemTongKet).gpa * curr.soTinChi, 0);
  const semesterGPA = totalCredits > 0 ? (totalGPA / totalCredits).toFixed(2) : "0.00";

  return (
    <div className="mb-8 sm:mb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* CỘT 1: TIẾN ĐỘ HỌC TẬP */}
      <div className="bg-bg-primary rounded-2xl border border-border-color shadow-sm p-6 sm:p-7 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="size-9 rounded-xl bg-teal-500/10 text-[#008689] flex items-center justify-center shrink-0">
              <IconCertificate size={20} stroke={1.8} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary font-heading">Tiến độ tích lũy</h3>
              <p className="text-xs text-text-tertiary">Tổng tín chỉ toàn khóa học</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <div className="animate-pulse bg-bg-secondary h-44 rounded-xl w-full my-2" />
            ) : progress ? (
              <MotionDiv key="content" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="flex flex-col items-center justify-center my-3">
                <div className="relative size-32 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      className="text-bg-secondary stroke-current"
                      strokeWidth="9"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                    />
                    <circle
                      className="text-[#008689] stroke-current transition-all duration-1000 ease-out"
                      strokeWidth="9"
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - Math.min(1, progress.hienTai / Math.max(1, progress.canDat)))}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-[#008689] font-heading">
                      {Math.round((progress.hienTai / Math.max(1, progress.canDat)) * 100)}%
                    </span>
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Hoàn thành</span>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-border-color text-center">
                  <div className="p-3 rounded-xl bg-[#F4F9F9] border border-border-color/80">
                    <span className="text-xs font-bold text-text-tertiary uppercase block">Đã tích lũy</span>
                    <span className="text-lg font-black text-text-primary font-heading">{progress.hienTai} <span className="text-xs font-semibold text-text-tertiary">TC</span></span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F4F9F9] border border-border-color/80">
                    <span className="text-xs font-bold text-text-tertiary uppercase block">Mục tiêu</span>
                    <span className="text-lg font-black text-text-primary font-heading">{progress.canDat} <span className="text-xs font-semibold text-text-tertiary">TC</span></span>
                  </div>
                </div>
              </MotionDiv>
            ) : (
              <div className="text-sm text-text-tertiary font-medium py-10 text-center">Không có dữ liệu tiến độ.</div>
            )}
          </AnimatePresence>
        </div>

        {progress && (
          <div className="text-xs text-text-tertiary flex items-center justify-between pt-3 border-t border-border-color font-medium">
            <span>Còn lại: <strong className="text-text-primary font-bold">{Math.max(0, progress.canDat - progress.hienTai)}</strong> tín chỉ</span>
            <span className="text-[#008689] font-bold">Chuẩn đầu ra UTH</span>
          </div>
        )}
      </div>

      {/* CỘT 2 & 3: GPA HỌC KỲ */}
      <div className="lg:col-span-2 bg-bg-primary rounded-2xl border border-border-color shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="p-5 sm:px-6 border-b border-border-color flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F4F9F9]">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-teal-500/10 text-[#008689] flex items-center justify-center shrink-0">
              <IconBook2 size={20} stroke={1.8} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary font-heading">Kết quả & GPA học kỳ</h3>
              <p className="text-xs text-text-tertiary">Điểm tổng kết các học phần</p>
            </div>
            {validSubjects.length > 0 && !loadingDetails && (
              <div className="flex items-center gap-1.5 ml-2 px-3 py-1 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <span className="text-xs font-bold text-[#008689] uppercase">GPA:</span>
                <span className="text-base font-black text-[#008689] font-heading">{semesterGPA}</span>
              </div>
            )}
          </div>

          {/* Custom Styled Select with Tabler Chevron */}
          <div className="relative min-w-[220px] w-full sm:w-auto">
            <select 
              className="w-full appearance-none pl-3.5 pr-8 py-2 rounded-xl border border-border-strong text-sm font-bold text-text-secondary outline-none focus:border-[#008689] bg-white shadow-2xs cursor-pointer transition-all"
              value={selectedSemester || ""}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              disabled={loading || semesters.length === 0}
            >
              {semesters.map(s => <option key={s.id} value={s.id}>{s.tenDot}</option>)}
            </select>
            <IconChevronDown size={16} stroke={1.8} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          </div>
        </div>
        
        <div className="flex-1 overflow-x-auto p-5 sm:p-6 max-h-[310px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <AnimatePresence mode="wait">
            {loadingDetails ? (
              <div className="flex flex-col gap-2.5">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-border-color bg-bg-secondary animate-pulse flex justify-between items-center">
                    <div className="space-y-1.5 w-1/2">
                      <div className="h-4 bg-bg-tertiary rounded w-3/4"></div>
                      <div className="h-3 bg-bg-tertiary rounded w-1/3"></div>
                    </div>
                    <div className="h-6 w-20 bg-bg-tertiary rounded"></div>
                  </div>
                ))}
              </div>
            ) : mergedData.length === 0 ? (
              <div className="py-12 text-center text-text-tertiary text-sm font-medium">
                Chưa có dữ liệu môn học cho học kỳ này.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {mergedData.map((item, idx) => {
                  const hasGrade = item.diemTongKet !== null;
                  const gpa = hasGrade ? getGPA(item.diemTongKet) : null;
                  const itemLink = item.link || item.url || item.courseUrl || item.lmsUrl;
                  
                  return (
                    <div 
                      key={idx} 
                      onClick={() => {
                        if (itemLink) {
                          openUrl(itemLink).catch(console.error);
                        }
                      }}
                      className={`p-3.5 rounded-xl border border-border-color bg-[#F4F9F9] hover:bg-white hover:border-[#008689] hover:shadow-xs transition-all flex items-center justify-between gap-3 group ${
                        itemLink ? 'cursor-pointer' : ''
                      }`}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-bold text-text-primary text-sm group-hover:text-[#008689] transition-colors truncate flex items-center gap-1.5">
                          {item.tenMonHoc}
                          {itemLink && (
                            <IconExternalLink size={14} className="text-text-tertiary group-hover:text-[#008689] shrink-0 transition-colors" />
                          )}
                        </span>
                        <span className="text-xs text-text-tertiary font-medium mt-0.5">
                          {item.maHocPhan || item.maMonHoc} &bull; {item.soTinChi} Tín chỉ
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {hasGrade && gpa ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-text-secondary">Điểm: {item.diemTongKet}</span>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20">
                              <span className={`font-black text-sm ${gpa.color}`}>{gpa.gpa.toFixed(1)}</span>
                              <span className={`text-xs font-bold ${gpa.color}`}>({gpa.text})</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-text-tertiary bg-white border border-border-color px-2.5 py-1 rounded-lg">
                            Chờ nhập điểm
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-3.5 px-6 border-t border-border-color bg-[#F4F9F9] flex items-center justify-between text-xs text-text-tertiary font-medium">
          <span>Tổng số môn: <strong className="text-text-primary">{mergedData.length}</strong></span>
          <span>Số môn đã có điểm: <strong className="text-[#008689]">{validSubjects.length}</strong>/{mergedData.length}</span>
        </div>
      </div>
    </div>
  );
}
