import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

// Periods to standard times lookup at UTH (morning starts at 06:45)
const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "06:45", end: "07:35" },
  2: { start: "07:35", end: "08:25" },
  3: { start: "08:35", end: "09:25" },
  4: { start: "09:35", end: "10:25" },
  5: { start: "10:25", end: "11:15" },
  6: { start: "12:30", end: "13:20" },
  7: { start: "13:20", end: "14:10" },
  8: { start: "14:20", end: "15:10" },
  9: { start: "15:20", end: "16:10" },
  10: { start: "16:10", end: "17:00" },
  11: { start: "17:30", end: "18:20" },
  12: { start: "18:20", end: "19:10" },
  13: { start: "19:20", end: "20:10" },
  14: { start: "20:10", end: "21:00" },
};

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

export function normalizeScheduleItem(item: any, mondayDate?: Date): any {
  if (!item || typeof item !== 'object') return item;
  const copy = { ...item };

  // 1. Tên môn học
  copy.tenMonHoc = copy.tenMonHoc || copy.ten_mon_hoc || copy.name || copy.monHoc || copy.tenHocPhan || copy.ten_hoc_phan || copy.lopHocPhan || copy.subjectName || copy.subject || copy.courseName || copy.title || "Môn học";

  // 2. Mã học phần & Phòng học & Giảng viên
  copy.maHocPhan = copy.maHocPhan || copy.ma_hoc_phan || copy.maMonHoc || copy.ma_mon_hoc || copy.maLopHocPhan || copy.code;
  copy.tenPhong = copy.tenPhong || copy.ten_phong || copy.roomToDisplay || copy.phongHoc || copy.phong || copy.room || copy.roomName;
  copy.giangVien = copy.giangVien || copy.tenGiangVien || copy.giang_vien || copy.teacher || copy.instructor;

  // 3. Ngày học
  let dateVal = copy.ngayHoc || copy.ngay || copy.date || copy.timeStart || copy.ngayBatDau || 
                copy.ngayDay || copy.ngay_day || copy.ngay_hoc || copy.thoiGianHoc || copy.thoiGian || 
                copy.thoi_gian || copy.studyDate || copy.startDate || copy.start_time || copy.start || copy.ngayHocDuKien;

  // Nếu không có chuỗi ngày cụ thể nhưng có "thu" (ví dụ: Thứ 2 = 2, Thứ 3 = 3,... Thứ 7 = 7, CN = 8 hoặc 'CN')
  if (!dateVal && mondayDate) {
    const rawThu = copy.thu ?? copy.thuHoc ?? copy.dayOfWeek ?? copy.thu_hoc;
    if (rawThu != null) {
      let thuNum = -1;
      if (typeof rawThu === 'number') {
        thuNum = rawThu;
      } else if (typeof rawThu === 'string') {
        const lower = rawThu.toLowerCase().trim();
        if (lower.includes('cn') || lower.includes('chủ nhật') || lower.includes('chu nhat') || lower === '8' || lower === '0') {
          thuNum = 8;
        } else {
          const match = lower.match(/\d+/);
          if (match) thuNum = parseInt(match[0], 10);
        }
      }
      
      if (thuNum >= 2 && thuNum <= 8) {
        const targetD = new Date(mondayDate);
        targetD.setDate(mondayDate.getDate() + (thuNum === 8 ? 6 : thuNum - 2));
        dateVal = `${targetD.getFullYear()}-${String(targetD.getMonth() + 1).padStart(2, '0')}-${String(targetD.getDate()).padStart(2, '0')}`;
      }
    }
  }

  copy.ngayHoc = dateVal;

  // 4. Tiết học
  const rawTietBatDau = copy.tietBatDau ?? copy.tuTiet;
  const tietBatDau = rawTietBatDau != null && !isNaN(Number(rawTietBatDau)) ? Number(rawTietBatDau) : undefined;
  const rawSoTiet = copy.soTiet;
  let soTiet = rawSoTiet != null && !isNaN(Number(rawSoTiet)) ? Number(rawSoTiet) : undefined;
  const rawDenTiet = copy.denTiet;
  const denTiet = rawDenTiet != null && !isNaN(Number(rawDenTiet)) ? Number(rawDenTiet) : undefined;
  if (!soTiet && tietBatDau != null && denTiet != null && denTiet >= tietBatDau) {
    soTiet = denTiet - tietBatDau + 1;
  }
  copy.tietBatDau = tietBatDau;
  copy.soTiet = soTiet;

  // 5. Giờ học / timeToDisplay
  let time = copy.timeToDisplay || copy.thoiGian || copy.gioHoc || copy.caHoc || copy.thoiGianHoc || "";
  if (typeof time === 'string') time = time.trim();
  if (copy.tuGio && copy.denGio) {
    time = `${String(copy.tuGio).trim()} - ${String(copy.denGio).trim()}`;
  } else if ((!time || time === 'Đang sắp xếp' || time === 'Chưa rõ ca học') && tietBatDau && PERIOD_TIMES[tietBatDau]) {
    const startStr = PERIOD_TIMES[tietBatDau].start;
    const endTiet = tietBatDau + (soTiet || 1) - 1;
    const endStr = PERIOD_TIMES[endTiet]?.end || PERIOD_TIMES[tietBatDau].end;
    time = `${startStr} - ${endStr}`;
  }
  copy.timeToDisplay = time;

  // 6. Link LMS môn học
  const rawLink = copy.link ?? copy.url ?? copy.lmsUrl ?? copy.linkLms ?? copy.courseUrl;
  copy.link = (typeof rawLink === 'string' && rawLink.trim().length > 0) ? rawLink.trim() : copy.link;

  return copy;
}

export function parseScheduleResponse(res: any, fallbackDate?: string, mondayDate?: Date): any[] {
  if (!res) return [];
  let raw: any = res?.body ?? res?.data ?? res?.result ?? res?.items ?? res;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if (raw.body !== undefined) raw = raw.body;
    else if (raw.data !== undefined) raw = raw.data;
    else if (raw.result !== undefined) raw = raw.result;
    else if (raw.items !== undefined) raw = raw.items;
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if (raw.body !== undefined) raw = raw.body;
    else if (raw.data !== undefined) raw = raw.data;
  }

  if (Array.isArray(raw)) {
    return raw.map(item => {
      if (item && typeof item === 'object') {
        const copy = { ...item };
        const hasExistingDate = copy.ngayHoc || copy.ngay || copy.date || copy.timeStart || copy.ngayBatDau || copy.ngayDay || copy.studyDate || copy.startDate;
        if (fallbackDate && !hasExistingDate) {
          copy.ngayHoc = fallbackDate;
        }
        return normalizeScheduleItem(copy, mondayDate);
      }
      return item;
    });
  }

  if (raw && typeof raw === 'object') {
    const list: any[] = [];
    Object.entries(raw).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        val.forEach(item => {
          if (item && typeof item === 'object') {
            const copy = { ...item };
            const hasExistingDate = copy.ngayHoc || copy.ngay || copy.date || copy.timeStart || copy.ngayBatDau || copy.ngayDay || copy.studyDate || copy.startDate;
            if (!hasExistingDate) {
              if (key.length >= 8) copy.ngayHoc = key;
              else copy.thu = key;
            }
            list.push(normalizeScheduleItem(copy, mondayDate));
          }
        });
      } else if (val && typeof val === 'object') {
        const copy = { ...(val as any) };
        const hasExistingDate = copy.ngayHoc || copy.ngay || copy.date || copy.timeStart || copy.ngayBatDau || copy.ngayDay || copy.studyDate || copy.startDate;
        if (!hasExistingDate) {
          if (key.length >= 8) copy.ngayHoc = key;
          else copy.thu = key;
        }
        list.push(normalizeScheduleItem(copy, mondayDate));
      }
    });
    return list;
  }

  return [];
}

export function useDashboardData({ 
  user, 
  token, 
  currentMonth, 
  selectedDate, 
  onLogout 
}: any) {
  const [debugError, setDebugError] = useState<string>("");
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const callApi = useCallback(async (command: string, args: any) => {
    try {
      const res: any = await invoke(command, args);
      if (res && typeof res === 'object' && (res.error || res.status === 401 || res.message === "Invalid JWT token")) {
        throw new Error(res.error || res.message || "Lỗi kết nối hoặc phiên đăng nhập hết hạn");
      }
      return res;
    } catch (e: any) {
      const msg = typeof e === 'string' ? e : e.message || String(e);
      console.error("API Error:", msg);
      setErrorToast(msg);
      setTimeout(() => {
        onLogout();
      }, 2000); 
      throw e;
    }
  }, [onLogout]);

  const [surveyInfo, setSurveyInfo] = useState<{haveForceSurvey: boolean, haveSurvey: boolean} | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [popups, setPopups] = useState<any[]>([]);
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [credit, setCredit] = useState<string>("*****");
  const [isFetchingCredit, setIsFetchingCredit] = useState(false);

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  
  const [moodleEvents, setMoodleEvents] = useState<any>(null);
  const [sideMenu, setSideMenu] = useState<any[]>([]);
  const [mainMenu, setMainMenu] = useState<any[]>([]);

  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingMoodle, setLoadingMoodle] = useState(false);
  const [loadingSideMenu, setLoadingSideMenu] = useState(false);
  const [loadingMainMenu, setLoadingMainMenu] = useState(false);

  // Portal Data (surveys, popups, notes)
  useEffect(() => {
    async function fetchPortalData() {
      if (!token) return;

      try {
        const [surveyRes, popupRes] = await Promise.all([
          callApi("fetch_portal_get", { token, endpoint: "survey/checkSurvey" }).catch(() => null),
          callApi("fetch_portal_get", { token, endpoint: "notification/getPopup" }).catch(() => null)
        ]) as [any, any];

        if (surveyRes?.success && surveyRes?.body) {
          setSurveyInfo(surveyRes.body);
          if (surveyRes.body.haveSurvey) {
            setIsSurveyModalOpen(true);
          }
        }
        
        if (popupRes?.success && Array.isArray(popupRes.body) && popupRes.body.length > 0) {
          setPopups(popupRes.body);
          setIsPopupModalOpen(true);
        }
      } catch (err) {
        console.error("Lỗi lấy data portal:", err);
      }
    }
    fetchPortalData();

    // Fetch notes for notifications
    const noteTimer = setTimeout(async () => {
      if (!token) return;
      try {
        const noteRes = await callApi("fetch_portal_get", { token, endpoint: "notification/getNote" }).catch(() => null);
        if (noteRes?.success && Array.isArray(noteRes.body)) {
          setNotes(noteRes.body);
        }
      } catch (err) {
        console.error("Lỗi lấy notes:", err);
      }
    }, 1500);

    return () => clearTimeout(noteTimer);
  }, [token]);

  const fetchCredit = async () => {
    if (credit !== "*****" || isFetchingCredit || !token) return;
    setIsFetchingCredit(true);
    try {
      const res: any = await callApi("fetch_portal_get", { token, endpoint: "user/getCredit" });
      if (res?.success && res?.body) {
        setCredit(res.body);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingCredit(false);
    }
  };

  // Schedule Monthly
  useEffect(() => {
    async function fetchSchedule() {
      if (!token) return;
      setLoadingMonthly(true);
      try {
        const d = currentMonth || new Date();
        const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        const res: any = await callApi("get_lich_thang", { token, date: formattedDate });
        const list = parseScheduleResponse(res, formattedDate);
        setMonthlyData(list);
      } catch (err: any) {
        console.error("Lỗi tải lịch tháng:", err);
        setDebugError(prev => prev + `\nLichThang Error: ${err.toString()}`);
      } finally {
        setLoadingMonthly(false);
      }
    }
    fetchSchedule();
  }, [currentMonth, token]);

  // Schedule Weekly
  useEffect(() => {
    async function fetchWeeklySchedule() {
      if (!token) return;
      setLoadingWeekly(true);
      try {
        const d = selectedDate || new Date();
        const monday = getMondayOfWeek(d);
        const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
        const res: any = await callApi("get_lich_tuan", { token, date: mondayStr });
        const list = parseScheduleResponse(res, undefined, monday);
        setWeeklyData(list);
      } catch (err: any) {
        console.error("Lỗi tải lịch tuần:", err);
        setDebugError(prev => prev + `\nLichTuan Error: ${err.toString()}`);
      } finally {
        setLoadingWeekly(false);
      }
    }
    fetchWeeklySchedule();
  }, [selectedDate, token]);

  // Schedule Daily
  useEffect(() => {
    async function fetchDailySchedule() {
      if (!token) return;
      setLoadingDaily(true);
      try {
        const d = selectedDate || new Date();
        const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const res: any = await callApi("get_lich_ngay", { token, date: formattedDate });
        const list = parseScheduleResponse(res, formattedDate);
        setDailyData(list);
      } catch (err: any) {
        console.error("Lỗi tải lịch ngày:", err);
        setDebugError(prev => prev + `\nLichNgay Error: ${err.toString()}`);
      } finally {
        setLoadingDaily(false);
      }
    }
    fetchDailySchedule();
  }, [selectedDate, token]);

  // Moodle Events
  useEffect(() => {
    async function fetchMoodle() {
      if (!user) return;
      setLoadingMoodle(true);
      try {
        const username = user?.mssv || (user as any)?.username;
        const res = await invoke("get_moodle_events", { username });
        setMoodleEvents(res);
      } catch (err: any) {
        console.error("Lỗi tải moodle:", err);
      } finally {
        setLoadingMoodle(false);
      }
    }
    fetchMoodle();
  }, [user, token]);

  // Main Menu
  useEffect(() => {
    async function fetchMainMenu() {
      if (!token) return;
      setLoadingMainMenu(true);
      try {
        const mainRes: any = await callApi("get_main_menu", { token });
        const mainData = mainRes?.body || mainRes?.data || mainRes;
        if (Array.isArray(mainData)) setMainMenu(mainData);
        else setDebugError(prev => prev + `\nMainMenu Error: Not array.`);
      } catch (err: any) {
        console.error("Lỗi tải menu chính:", err);
        setDebugError(prev => prev + `\nMenu Fetch Error: ${err.toString()}`);
      } finally {
        setLoadingMainMenu(false);
      }
    }
    fetchMainMenu();
  }, [token]);

  // Side Menu
  useEffect(() => {
    async function fetchSideMenu() {
      if (!token || sideMenu.length > 0) return;
      setLoadingSideMenu(true);
      try {
        const sideRes: any = await callApi("get_side_menu", { token });
        const sideData = sideRes?.body || sideRes?.data || sideRes;
        if (Array.isArray(sideData)) setSideMenu(sideData);
        else setDebugError(prev => prev + `\nSideMenu Error: Not array.`);
      } catch (err: any) {
        console.error("Lỗi tải menu phụ:", err);
        setDebugError(prev => prev + `\nSideMenu Fetch Error: ${err.toString()}`);
      } finally {
        setLoadingSideMenu(false);
      }
    }
    fetchSideMenu();
  }, [token]);

  return {
    surveyInfo, setSurveyInfo,
    notes, setNotes,
    popups, setPopups,
    isPopupModalOpen, setIsPopupModalOpen,
    isSurveyModalOpen, setIsSurveyModalOpen,
    credit, fetchCredit, isFetchingCredit,
    monthlyData, loadingMonthly,
    weeklyData, loadingWeekly,
    dailyData, loadingDaily,
    moodleEvents, loadingMoodle,
    sideMenu, loadingSideMenu,
    mainMenu, loadingMainMenu,
    debugError, errorToast, callApi
  };
}
