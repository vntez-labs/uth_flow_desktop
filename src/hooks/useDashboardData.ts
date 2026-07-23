import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useDashboardData({ 
  user, 
  token, 
  isDrawerOpen, 
  viewMode, 
  currentMonth, 
  selectedDate, 
  onLogout 
}: any) {
  const [debugError, setDebugError] = useState<string>("");
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const callApi = async (command: string, args: any) => {
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
  };

  const [surveyInfo, setSurveyInfo] = useState<{haveForceSurvey: boolean, haveSurvey: boolean} | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [popups, setPopups] = useState<any[]>([]);
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [credit, setCredit] = useState<string>("*****");
  const [isFetchingCredit, setIsFetchingCredit] = useState(false);

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  
  const [moodleEvents, setMoodleEvents] = useState<any>(null);
  const [sideMenu, setSideMenu] = useState<any[]>([]);
  const [mainMenu, setMainMenu] = useState<any[]>([]);

  const [loadingMonthly, setLoadingMonthly] = useState(false);
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

    // Fetch notes later to optimize initial load
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
    }, 3000);

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
        const endpoint = viewMode === 'month' ? 'get_lich_thang' : 'get_lich_tuan';
        const d = viewMode === 'month' 
           ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
           : selectedDate;
           
        const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        const res: any = await callApi(endpoint, { token, date: formattedDate });
        const data = res?.body || res?.data || res;
        
        if (Array.isArray(data)) {
          setMonthlyData(data);
        } else if (res && res.success && Array.isArray(res.body)) {
          setMonthlyData(res.body);
        } else {
          setDebugError(prev => prev + `\nLich: Unexpected format: ${JSON.stringify(res).substring(0, 100)}`);
        }
      } catch (err: any) {
        console.error("Lỗi tải lịch:", err);
        setDebugError(prev => prev + `\nLich Error: ${err.toString()}`);
      } finally {
        setLoadingMonthly(false);
      }
    }
    fetchSchedule();
  }, [currentMonth, selectedDate, viewMode, token]);

  // Schedule Daily
  useEffect(() => {
    async function fetchDailySchedule() {
      if (!token) return;
      setLoadingDaily(true);
      try {
        const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        
        const res: any = await callApi("get_lich_ngay", { token, date: formattedDate });
        const data = res?.body || res?.data || res;
        
        if (Array.isArray(data)) {
          setDailyData(data);
        } else if (res && res.success && Array.isArray(res.body)) {
          setDailyData(res.body);
        } else {
          setDebugError(prev => prev + `\nLichNgay: Unexpected format: ${JSON.stringify(res).substring(0, 100)}`);
        }
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
      if (!token || !isDrawerOpen || sideMenu.length > 0) return;
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
  }, [isDrawerOpen, token]);

  return {
    surveyInfo, setSurveyInfo,
    notes, setNotes,
    popups, setPopups,
    isPopupModalOpen, setIsPopupModalOpen,
    isSurveyModalOpen, setIsSurveyModalOpen,
    credit, fetchCredit, isFetchingCredit,
    monthlyData, loadingMonthly,
    dailyData, loadingDaily,
    moodleEvents, loadingMoodle,
    sideMenu, loadingSideMenu,
    mainMenu, loadingMainMenu,
    debugError, errorToast, callApi
  };
}
