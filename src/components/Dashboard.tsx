// @ts-nocheck
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { NavLink, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { openUrl } from "@tauri-apps/plugin-opener";
import CourseDetail from "../pages/CourseDetail";
import { useUserStore } from "../stores/user.store";
import { Dropdown, Label, Button, Accordion, Drawer, Modal } from "@heroui/react";
// @ts-ignore
import {
  CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, House, LayoutDashboard,
  LogOut, GraduationCap, Clock, FileText, Settings, ShieldAlert, Users, Heart, Share2, Target, Moon, Sun, Search, Bell, BookOpen, ExternalLink, Activity, Trophy, Coffee, ArrowUpRight, ShieldCheck, Mail, Lock, Smartphone, Globe, Cloud, Sparkles, Map, RefreshCw, X, AlertTriangle, Fingerprint, Calendar as CalendarIcon, Check, Copy, Link, CheckSquare, Plus, Trash2, Rocket
} from 'lucide-react';
import {
  GeoPin,
  ShieldKeyhole,
  Bars,
  Xmark,
  Calendar, 
  CreditCard,
  Pencil, 
  Headphones,
  Person
} from "@gravity-ui/icons";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

import UtilitiesPage from "./pages/UtilitiesPage";
import AboutPage from "./pages/AboutPage";
import NotificationPage from "./pages/NotificationPage";
import AcademicStats from "./AcademicStats";

interface MenuItem {
  id: number;
  name: string;
  icon?: string;
  route?: string;
  children?: MenuItem[];
}

function getStudentYear(khoaHoc?: string) {
  if (!khoaHoc) return "";
  const year = parseInt(khoaHoc, 10);
  if (isNaN(year)) return "";
  const currentYear = new Date().getFullYear();
  const studentYear = currentYear - year + 1;
  return studentYear > 0 ? `Sinh viên năm ${studentYear}` : "Tân sinh viên";
}


export default function Dashboard({ onLogout, getGradient }: { onLogout: () => void, getGradient: (name: string) => string }) {
  const navigate = useNavigate();
  const { user, token, setAuth } = useUserStore();
  const [sideMenu, setSideMenu] = useState<MenuItem[]>([]);
  const [mainMenu, setMainMenu] = useState<MenuItem[]>([]);
  const [openingRoute, setOpeningRoute] = useState<string | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  
  const [moodleEvents, setMoodleEvents] = useState<any>(null);

  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Apply theme on load and change
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [loadingMoodle, setLoadingMoodle] = useState(false);
  const [deadlineFilter, setDeadlineFilter] = useState<'1' | '7' | '30' | 'all'>('30');
  
  const [courseSearch, setCourseSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [courseSort, setCourseSort] = useState("lastaccessed");
  const [coursePage, setCoursePage] = useState(1);
  const [courseLimit, setCourseLimit] = useState(12);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openDrawer = () => setIsDrawerOpen(true);
  const onDrawerOpenChange = (isOpen: boolean) => setIsDrawerOpen(isOpen);

  const [isCourseDrawerOpen, setIsCourseDrawerOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseContents, setCourseContents] = useState<any[]>([]);
  const [loadingCourse, setLoadingCourse] = useState(false);

  const handleCourseClick = async (e: React.MouseEvent, course: any) => {
    e.preventDefault();
    navigate(`course/${course.id}`);
  };

  useEffect(() => {
    const isTourCompleted = localStorage.getItem('uth_tour_completed');
    if (!isTourCompleted) {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        nextBtnText: 'Tiếp theo',
        prevBtnText: 'Trở lại',
        doneBtnText: 'Hoàn thành',
        steps: [
          { element: '#tour-nav', popover: { title: 'Thanh điều hướng', description: 'Điều hướng nhanh giữa các trang chính của ứng dụng.', side: "bottom", align: 'start' }},
          { element: '#tour-profile', popover: { title: 'Hồ sơ người dùng', description: 'Quản lý tài khoản, xem thông tin sinh viên và đăng xuất tại đây.', side: "bottom", align: 'start' }},
          { element: '#tour-drawer', popover: { title: 'Tiện ích (Menu phải)', description: 'Chứa tất cả các tiện ích về học tập, công nợ, hỗ trợ sinh viên...', side: "bottom", align: 'end' }},
          { element: '#tour-quick-access', popover: { title: 'Truy cập nhanh', description: 'Lối tắt truy cập nhanh vào các tính năng hay dùng nhất.', side: "right", align: 'start' }},
          { element: '#tour-calendar', popover: { title: 'Lịch học & Deadline', description: 'Xem lịch học chi tiết và tất cả các bài tập Moodle sắp tới.', side: "top", align: 'start' }},
          { element: '#tour-courses', popover: { title: 'Khóa học của tôi', description: 'Danh sách khóa học Moodle, hỗ trợ tìm kiếm, phân trang và xem tiến trình.', side: "top", align: 'start' }},
        ],
        onDestroyed: () => {
          localStorage.setItem('uth_tour_completed', 'true');
        }
      });
      
      setTimeout(() => {
        driverObj.drive();
      }, 1000);
    }
  }, []);

  useEffect(() => {
    setCoursePage(1);
  }, [courseFilter, courseSearch, courseSort, courseLimit]);

  const handleOpenRoute = async (route?: string, name?: string) => {
    if (!route) {
      alert("Chức năng đang được phát triển: " + name);
      return;
    }
    if (openingRoute) return; // Prevent spam clicking

    setOpeningRoute(route);
    try {
      let finalUrl = route;
      if (!route.startsWith('http')) {
        finalUrl = route.startsWith('/') ? `https://portal.ut.edu.vn${route}` : `https://portal.ut.edu.vn/${route}`;
      }
      await openUrl(finalUrl);
    } catch (err) {
      console.error("Lỗi mở link:", err);
    } finally {
      setTimeout(() => setOpeningRoute(null), 800);
    }
  };

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [debugError, setDebugError] = useState<string>("");
  
  // Portal States
  const [surveyInfo, setSurveyInfo] = useState<{haveForceSurvey: boolean, haveSurvey: boolean} | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [popups, setPopups] = useState<any[]>([]);
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [credit, setCredit] = useState<string>("*****");
  const [isFetchingCredit, setIsFetchingCredit] = useState(false);



  const [showScrollTop, setShowScrollTop] = useState(false);
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (e.currentTarget.scrollTop > 300) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };
  const scrollToTop = () => {
    const main = document.getElementById("main-scroll-container");
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  };
  useEffect(() => {
    async function fetchPortalData() {
      if (!token) return;

      try {
        const [surveyRes, popupRes, noteRes] = await Promise.all([
          callApi("fetch_portal_get", { token, endpoint: "survey/checkSurvey" }).catch(() => null),
          callApi("fetch_portal_get", { token, endpoint: "notification/getPopup" }).catch(() => null),
          callApi("fetch_portal_get", { token, endpoint: "notification/getNote" }).catch(() => null)
        ]) as [any, any, any];

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
        
        if (noteRes?.success && Array.isArray(noteRes.body)) {
          setNotes(noteRes.body);
        }
      } catch (err) {
        console.error("Lỗi lấy data portal:", err);
      } finally {

      }
    }
    fetchPortalData();
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
      }, 2000); // Chờ 2s cho user đọc toast rồi văng ra màn chọn account
      throw e;
    }
  };

  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // adjust firstDay for Monday start (0 is Sunday, so make 1 = Mon, ..., 7 = Sun)
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    
    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push({ date: i, month, year });
    // fill remaining to complete rows of 7
    while (days.length % 7 !== 0) days.push(null);
    
    return days;
  };

  const generateWeekDays = () => {
    const date = new Date(selectedDate.getTime());
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    const startOfWeek = new Date(date.setDate(diff));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek.getTime());
      d.setDate(startOfWeek.getDate() + i);
      days.push({ date: d.getDate(), month: d.getMonth(), year: d.getFullYear() });
    }
    return days;
  };

  const [loadingMonthly, setLoadingMonthly] = useState(false);
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
        
        // Since res is already a parsed JSON object
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

  // Fetch Moodle Events
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

  const [loadingDaily, setLoadingDaily] = useState(false);
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
  
  const [loadingSideMenu, setLoadingSideMenu] = useState(false);
  const [loadingMainMenu, setLoadingMainMenu] = useState(false);

  useEffect(() => {
    async function fetchMainMenu() {
      if (!token) return;
      setLoadingMainMenu(true);
      try {
        const mainRes: any = await callApi("get_main_menu", { token });
        const mainData = mainRes?.body || mainRes?.data || mainRes;
        if (Array.isArray(mainData)) setMainMenu(mainData);
        else setDebugError(prev => prev + `\nMainMenu Error: Not array. Type=${typeof mainData}, Res=${JSON.stringify(mainRes).substring(0,100)}`);
      } catch (err: any) {
        console.error("Lỗi tải menu chính:", err);
        setDebugError(prev => prev + `\nMenu Fetch Error: ${err.toString()}`);
      } finally {
        setLoadingMainMenu(false);
      }
    }
    fetchMainMenu();
  }, [token]);

  useEffect(() => {
    async function fetchSideMenu() {
      if (!token || !isDrawerOpen || sideMenu.length > 0) return;
      setLoadingSideMenu(true);
      try {
        const sideRes: any = await callApi("get_side_menu", { token });
        const sideData = sideRes?.body || sideRes?.data || sideRes;
        if (Array.isArray(sideData)) setSideMenu(sideData);
        else setDebugError(prev => prev + `\nSideMenu Error: Not array. Type=${typeof sideData}, Res=${JSON.stringify(sideRes).substring(0,100)}`);
      } catch (err: any) {
        console.error("Lỗi tải menu phụ:", err);
        setDebugError(prev => prev + `\nSideMenu Fetch Error: ${err.toString()}`);
      } finally {
        setLoadingSideMenu(false);
      }
    }
    fetchSideMenu();
  }, [isDrawerOpen, token]);


  if (!user) return null;

  const currentHour = new Date().getHours();
  const isAfternoon = currentHour >= 12 && currentHour < 18;
  const isEvening = currentHour >= 18;
  const GreetingIcon = isEvening ? Moon : Sun;
  const greetingText = isEvening ? "Chào buổi tối" : (isAfternoon ? "Chào buổi chiều" : "Chào buổi sáng");
  const firstName = user.ten?.split(' ').pop() || user.mssv;

  return (
    <div className="flex h-screen w-full flex-col bg-bg-secondary text-text-secondary">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full bg-bg-primary border-b border-border-color shadow-sm h-16">
        <div className="container mx-auto flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-4 sm:gap-8 h-full">
            <div className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80 shrink-0" onClick={() => {}}>
              <img src="/logo.jpg" alt="UTH Sync Logo" className="h-10 w-10 shrink-0 object-contain drop-shadow-sm rounded-full" />
              <h1 className="text-xl font-bold tracking-tight text-text-primary hidden sm:block">
                UTH Sync<span className="text-blue-600">.</span>
              </h1>
            </div>
            
            {/* Header Navigation */}
            <nav id="tour-nav" className="hidden md:flex items-center gap-1 h-full">
              {[
                { id: "", name: "Trang chủ", icon: House },
                { id: "notifications", name: "Thông báo", icon: Bell },
                { id: "utilities", name: "Tiện ích", icon: Rocket },
                { id: "about", name: "Ủng hộ & Tác giả", icon: Person },
              ].map(tab => (
                <NavLink
                  key={tab.name}
                  to={tab.id === "" ? "/dashboard" : `/dashboard/${tab.id}`}
                  end={tab.id === ""}
                  className={({ isActive }) => `relative flex items-center gap-2 px-3 mx-1 h-full transition-all border-b-2 ${isActive ? 'text-blue-600 font-bold border-blue-600' : 'text-text-tertiary border-transparent hover:text-text-primary hover:border-border-strong font-medium'}`}
                >
                  {({ isActive }) => (
                    <>
                      <tab.icon width={16} height={16} className={`hidden lg:block shrink-0 ${isActive ? "text-blue-600" : "text-text-tertiary"}`} />
                      <span className="text-sm whitespace-nowrap">{tab.name}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div 
              className="relative flex items-center justify-center w-10 h-10 text-text-secondary rounded-xl hover:bg-bg-tertiary overflow-visible cursor-pointer outline-none transition-colors"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? "Chế độ Sáng" : "Chế độ Tối"}
            >
              {isDarkMode ? <Sun width={20} height={20} /> : <Moon width={20} height={20} />}
            </div>
            
            <Dropdown>
              <Dropdown.Trigger id="tour-notifications">
                <div className="relative flex items-center justify-center w-10 h-10 text-text-secondary rounded-xl hover:bg-bg-tertiary overflow-visible cursor-pointer outline-none transition-colors">
                  <Bell width={20} height={20} />
                  {notes.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white border-2 border-white shadow-sm">
                      {notes.length > 99 ? '99+' : notes.length}
                    </span>
                  )}
                </div>
              </Dropdown.Trigger>
              <Dropdown.Popover placement="bottom end">
                <Dropdown.Menu aria-label="Notifications" className="w-80 p-0 max-h-96 overflow-y-auto">
                  {notes.length === 0 ? (
                    <Dropdown.Item className="py-4 text-center text-text-tertiary pointer-events-none" textValue="Không có thông báo">
                      Không có thông báo mới
                    </Dropdown.Item>
                  ) : (
                    notes.map((note, idx) => (
                      <Dropdown.Item 
                        key={note.id ? `note-${note.id}` : `note-idx-${idx}`} 
                        textValue={note.tieuDe}
                        className="!h-auto !py-3 border-b border-border-color hover:bg-bg-secondary rounded-none !whitespace-normal"
                        style={{ height: 'auto', minHeight: 'fit-content' }}
                        onPress={() => {
                          const href = note.noiDung.match(/href=['"]([^'"]+)['"]/);
                          if (href && href[1]) handleOpenRoute(href[1]);
                        }}
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-xs text-text-primary">{note.tieuDe}</span>
                          <div className="text-xs text-text-tertiary line-clamp-3 prose prose-sm prose-blue max-w-none">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]} 
                              rehypePlugins={[rehypeRaw]}
                              components={{
                                a: ({node, ...props}) => <a {...props} onClick={(e) => e.preventDefault()} className="text-blue-600 font-medium" />
                              }}
                            >
                              {note.noiDung}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </Dropdown.Item>
                    ))
                  )}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>

            <Dropdown>
              <Dropdown.Trigger id="tour-profile">
                <div className="flex cursor-pointer items-center gap-3 rounded-full transition-transform hover:scale-105 active:scale-95">
                  {user.avatar ? (
                    <img src={user.avatar} className="h-10 w-10 rounded-full border-2 border-blue-100 object-cover shadow-sm" alt="avatar" />
                  ) : (
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold border-2 border-blue-100 shadow-sm"
                      style={{ background: getGradient(user.ten || user.mssv) }}
                    >
                      {user.ten?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </Dropdown.Trigger>
              <Dropdown.Popover>
                <Dropdown.Menu aria-label="User Actions" onAction={(key) => {
                  if (key === 'logout') onLogout();
                }}>
                  <Dropdown.Item id="profile" textValue="Profile" className="h-14 gap-2">
                    <Label className="flex flex-col items-start">
                      <p className="font-semibold text-xs text-gray-500">Đăng nhập với</p>
                      <p className="font-semibold text-sm">{user.email || user.mssv}</p>
                    </Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="settings" textValue="Cài đặt">
                    <Label>Cài đặt</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="help_and_feedback" textValue="Trợ giúp">
                    <Label>Trợ giúp</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="logout" textValue="Đăng xuất" variant="danger">
                    <Label>Đăng xuất</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>

            <Button 
              id="tour-drawer"
              isIconOnly 
              variant="ghost" 
              onPress={openDrawer}
              className="text-text-secondary rounded-xl hover:bg-bg-tertiary"
            >
              {isDrawerOpen ? <Xmark width={20} height={20} /> : <Bars width={20} height={20} />}
            </Button>
            
            <Drawer isOpen={isDrawerOpen} onOpenChange={onDrawerOpenChange}>
              <Drawer.Backdrop>
                <Drawer.Content placement="right">
                  <Drawer.Dialog>
                    <Drawer.Header className="border-b border-border-color p-4">
                      <Drawer.Heading className="font-black text-lg text-text-primary uppercase tracking-widest">Tiện ích</Drawer.Heading>
                    </Drawer.Header>
                    <Drawer.Body className="p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      <Accordion>
                        {loadingSideMenu ? (
                           Array(5).fill(0).map((_, i) => (
                             <div key={i} className="p-4 border-b border-slate-50 last:border-0 flex items-center justify-between">
                               <div className="h-4 w-1/2 bg-bg-tertiary rounded animate-pulse"></div>
                               <div className="h-4 w-4 bg-bg-tertiary rounded animate-pulse"></div>
                             </div>
                           ))
                        ) : sideMenu.map(item => (
                          <Accordion.Item key={item.id}>
                            <Accordion.Heading>
                              <Accordion.Trigger className="flex justify-between items-center w-full p-4 hover:bg-bg-secondary font-bold uppercase text-xs text-text-secondary group rounded-xl outline-none">
                                <span className="group-data-[open=true]:text-blue-700 transition-colors">{item.name}</span>
                                <Accordion.Indicator className="text-text-tertiary group-data-[open=true]:text-blue-600" />
                              </Accordion.Trigger>
                            </Accordion.Heading>
                            <Accordion.Panel>
                              <Accordion.Body className="flex flex-col gap-1 p-2">
                                {item.children && item.children.map(child => (
                                  <a 
                                    key={child.id}
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleOpenRoute(child.route, child.name);
                                    }}
                                    className="group/item flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary transition-all hover:bg-blue-50 hover:text-blue-700"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/item:bg-blue-500 transition-colors"></span>
                                    <span className="truncate flex-1">{child.name}</span>
                                  </a>
                                ))}
                              </Accordion.Body>
                            </Accordion.Panel>
                          </Accordion.Item>
                        ))}
                      </Accordion>
                    </Drawer.Body>
                  </Drawer.Dialog>
                </Drawer.Content>
              </Drawer.Backdrop>
            </Drawer>

            {/* COURSE CONTENTS DRAWER */}
            <Drawer isOpen={isCourseDrawerOpen} onOpenChange={setIsCourseDrawerOpen}>
              <Drawer.Backdrop>
                <Drawer.Content placement="right" className="sm:max-w-2xl w-full">
                  <Drawer.Dialog>
                    <Drawer.Header className="border-b border-border-color p-4 flex justify-between items-center">
                      <Drawer.Heading className="font-bold text-lg text-text-primary pr-8">
                        {selectedCourse?.fullname}
                      </Drawer.Heading>
                    </Drawer.Header>
                    <Drawer.Body className="p-4 sm:p-6 overflow-y-auto bg-bg-secondary [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {loadingCourse ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="font-medium text-text-tertiary">Đang tải nội dung môn học...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-6">
                          {courseContents?.map((section: any, idx: number) => (
                            <div key={idx} className="bg-bg-primary p-5 rounded-2xl border border-border-color shadow-sm">
                              <h3 className="font-bold text-lg text-text-primary mb-4" dangerouslySetInnerHTML={{__html: section.name}} />
                              {section.summary && (
                                <div className="text-sm text-text-secondary mb-4 prose prose-blue max-w-none" dangerouslySetInnerHTML={{__html: section.summary}} />
                              )}
                              <div className="flex flex-col gap-2">
                                {section.modules?.map((mod: any, mIdx: number) => (
                                  <a 
                                    key={mIdx} 
                                    href={mod.url || '#'} 
                                    onClick={(e) => {
                                       if (mod.url) {
                                         e.preventDefault();
                                         openUrl(mod.url);
                                       } else {
                                         e.preventDefault();
                                       }
                                    }}
                                    className="flex items-center gap-3 p-3 hover:bg-bg-secondary rounded-xl transition-colors border border-transparent hover:border-border-color group"
                                  >
                                    <img src={mod.modicon} alt={mod.modname} className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className="font-medium text-sm text-blue-700 break-words whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: mod.modname === 'label' ? (mod.description || mod.customdata || mod.name) : mod.name}} />
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          ))}
                          
                          {(!courseContents || courseContents.length === 0) && !loadingCourse && (
                            <div className="text-center py-10 text-text-tertiary font-medium">
                              Không có nội dung cho môn học này.
                            </div>
                          )}
                        </div>
                      )}
                    </Drawer.Body>
                  </Drawer.Dialog>
                </Drawer.Content>
              </Drawer.Backdrop>
            </Drawer>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* APP SIDEBAR (LEFT) - QUICK ACCESS */}
        <aside id="tour-quick-access" className="w-64 flex-shrink-0 bg-bg-primary border-r border-border-strong shadow-[2px_0_8px_rgba(0,0,0,0.02)] py-6 flex flex-col z-10 hidden md:flex overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="px-6 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Truy cập nhanh</h2>
          </div>
          <nav className="flex flex-col gap-1 w-full px-3">
            {loadingMainMenu ? (
               Array(6).fill(0).map((_, i) => (
                 <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                   <div className="w-5 h-5 rounded bg-bg-tertiary animate-pulse shrink-0"></div>
                   <div className="h-4 bg-bg-tertiary rounded w-full animate-pulse"></div>
                 </div>
               ))
            ) : mainMenu.map((item) => {
              let Icon: any = Rocket;
              switch(item.icon) {
                case "CastForEducation": Icon = BookOpen; break;
                case "CalendarMonthIcon": Icon = Calendar; break;
                case "AppRegistration": Icon = Pencil; break;
                case "TryIcon": Icon = Target; break;
                case "EditCalendarIcon": Icon = Calendar; break;
                case "CurrencyExchangeIcon": Icon = CreditCard; break;
                case "AttachMoneyIcon": Icon = CreditCard; break;
                case "SupportAgent": Icon = Headphones; break;
                case "DescriptionIcon": Icon = BookOpen; break;
              }
              
              return (
                <button 
                  key={item.id} 
                  onClick={() => handleOpenRoute(item.route, item.name)}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-text-secondary hover:bg-bg-secondary hover:text-blue-700 font-medium text-sm w-full text-left"
                >
                  <Icon width={18} height={18} className="text-text-tertiary group-hover:text-blue-600 shrink-0 transition-colors" />
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main 
          id="main-scroll-container"
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 bg-bg-secondary scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <Modal isOpen={isSurveyModalOpen} onOpenChange={setIsSurveyModalOpen}>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog>
                  <Modal.Header>
                    <Modal.Heading className="font-bold text-lg">Khảo sát {surveyInfo?.haveForceSurvey ? "bắt buộc" : "không bắt buộc"}</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body className="py-4">
                    <p>Bạn có một khảo sát cần hoàn thành. Vui lòng truy cập trang Portal để thực hiện.</p>
                  </Modal.Body>
                  <Modal.Footer className="flex justify-end gap-2">
                    <Button variant="ghost" onPress={() => setIsSurveyModalOpen(false)}>
                      Đóng
                    </Button>
                    <Button className="bg-blue-600 text-white" onPress={() => {
                      openUrl("https://portal.ut.edu.vn");
                      setIsSurveyModalOpen(false);
                    }}>
                      Đến Portal
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>

          <Modal isOpen={isPopupModalOpen} onOpenChange={setIsPopupModalOpen}>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog>
                  <Modal.Header>
                    <Modal.Heading className="font-bold text-lg">
                      {popups.length === 1 ? popups[0].tieuDe : "Thông báo"}
                    </Modal.Heading>
                  </Modal.Header>
                  <Modal.Body className="py-4 max-h-[70vh] overflow-y-auto">
                    {popups.map((popup, idx) => (
                      <div key={idx} className="mb-4 last:mb-0">
                        {(popups.length > 1 || (popup.tieuDe.toLowerCase() !== "thông báo" && popups.length === 1)) && (
                          <h4 className="font-bold text-md mb-2">{popup.tieuDe}</h4>
                        )}
                        <div className="text-sm text-text-secondary prose prose-blue max-w-none break-words">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]} 
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium" />
                            }}
                          >
                            {popup.noiDung}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </Modal.Body>
                  <Modal.Footer className="flex justify-end">
                    <Button className="bg-blue-600 text-white" onPress={() => setIsPopupModalOpen(false)}>
                      Đóng
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>

          <div className="container mx-auto">
            <Routes>
              <Route path="/" element={
                <>
                  {/* Main Greeting & Balance Header */}
                  <div className="mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-3xl font-bold text-text-primary tracking-tight flex items-center gap-3">
                          <GreetingIcon className="w-8 h-8 text-orange-400" />
                          {greetingText}, {firstName}!
                        </h2>
                        <p className="mt-2 text-text-tertiary font-medium flex items-center gap-2">
                          <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                            {getStudentYear((user as any).khoa_hoc) || "Sinh viên"}
                          </span>
                          {((user as any).chuyen_nganh || (user as any).nganh) && (
                            <span className="font-semibold text-text-tertiary">- {((user as any).chuyen_nganh || (user as any).nganh)}</span>
                          )}
                        </p>
                      </div>
                      
                      <div 
                        className="flex flex-col items-end cursor-pointer group bg-bg-primary border border-border-strong shadow-sm px-5 py-3 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all active:scale-95"
                        onClick={fetchCredit}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard width={16} height={16} className="text-text-tertiary group-hover:text-blue-500 transition-colors" />
                          <span className="text-xs font-bold uppercase tracking-widest text-text-tertiary group-hover:text-blue-600 transition-colors">Số dư tài khoản</span>
                        </div>
                        <div className="text-xl font-black text-blue-700">
                          {isFetchingCredit ? "Đang tải..." : credit}
                        </div>
                      </div>
                    </div>
                    {debugError && (
                      <div className="mt-4 p-5 bg-red-50 border border-red-200/60 rounded-2xl shadow-sm">
                        {(debugError.includes("401") || debugError.includes("JWT")) ? (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <ShieldKeyhole width={20} height={20} />
                              </div>
                              <div>
                                <h4 className="font-bold text-red-800">Phiên đăng nhập đã hết hạn</h4>
                                <p className="text-sm text-red-700/80 mt-0.5 font-medium">Bạn không cần đăng nhập lại, chỉ cần bấm vào nút bên dưới để cấp lại quyền truy cập.</p>
                              </div>
                            </div>
                            <Button 
                               className="w-fit bg-red-600 font-bold text-white shadow-sm mt-1 ml-13 border-none hover:bg-red-700 disabled:opacity-50" 
                               onPress={() => {
                                 setIsRenewing(true);
                                 // autoLogin logic removed for simplicity here, assume it's handled via a simpler state trigger or we can just reload
                                 window.location.reload();
                               }}
                               isDisabled={isRenewing}
                            >
                              Khôi phục phiên đăng nhập
                            </Button>
                          </div>
                        ) : (
                          <details>
                            <summary className="font-bold text-red-800 cursor-pointer hover:text-red-900 outline-none select-none">
                              Phát hiện lỗi đồng bộ (Nhấn để xem chi tiết)
                            </summary>
                            <div className="mt-3 flex items-center gap-2">
                              <Button 
                                size="sm"
                                className="bg-red-200/50 text-red-700 font-bold hover:bg-red-200 border-none"
                                onPress={() => {
                                  navigator.clipboard.writeText(debugError);
                                  alert("Đã copy mã lỗi vào clipboard!");
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <Copy width={14} height={14} />
                                  <span>Copy mã lỗi</span>
                                </div>
                              </Button>
                            </div>
                            <pre className="mt-3 p-3 bg-red-900/10 rounded-lg whitespace-pre-wrap font-mono text-sm text-red-900">
                              {debugError}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Calendar & Lịch học */}
                  <div id="tour-calendar" className="mb-8 flex flex-col xl:flex-row gap-6">
              {/* Lịch tháng */}
              <div id="calendar-export-area" className="flex-1 bg-bg-primary p-6 rounded-2xl shadow-sm border border-border-color">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-text-primary">Lịch học</h3>
                    <div className="flex items-center bg-bg-secondary rounded-full p-1 border border-border-strong">
                      <button 
                        onClick={() => setViewMode('week')} 
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${viewMode === 'week' ? 'bg-bg-primary text-blue-600 border border-blue-600 shadow-sm' : 'text-text-tertiary'}`}
                      >
                        Tuần
                      </button>
                      <button 
                        onClick={() => setViewMode('month')} 
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${viewMode === 'month' ? 'bg-bg-primary text-blue-600 border border-blue-600 shadow-sm' : 'text-text-tertiary'}`}
                      >
                        Tháng
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 pl-4">
                      <Button variant="ghost" size="sm" className="min-w-8 w-8 h-8 p-0" onPress={() => {
                      if (viewMode === 'month') setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
                      else {
                        const d = new Date(selectedDate);
                        d.setDate(d.getDate() - 7);
                        setSelectedDate(d);
                      }
                    }}>{"<"}</Button>
                    <span className="font-bold text-text-primary min-w-[120px] text-center">
                      {viewMode === 'month' ? `Tháng ${currentMonth.getMonth() + 1}/${currentMonth.getFullYear()}` : `Tháng ${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`}
                    </span>
                    <Button variant="ghost" size="sm" className="min-w-8 w-8 h-8 p-0" onPress={() => {
                      if (viewMode === 'month') setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
                      else {
                        const d = new Date(selectedDate);
                        d.setDate(d.getDate() + 7);
                        setSelectedDate(d);
                      }
                    }}>{">"}</Button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-4 mb-3">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                    <div key={d} className="text-center font-bold text-text-tertiary text-sm">{d}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-4">
                  {loadingMonthly ? (
                    Array(viewMode === 'month' ? 35 : 7).fill(0).map((_, i) => (
                      <div key={i} className="min-h-[110px] flex flex-col items-center justify-center p-3 rounded-2xl bg-bg-secondary border border-border-color animate-pulse">
                        <div className="h-6 w-6 bg-bg-tertiary rounded-full mb-2"></div>
                        <div className="flex gap-1"><div className="w-1.5 h-1.5 bg-bg-tertiary rounded-full"></div><div className="w-1.5 h-1.5 bg-bg-tertiary rounded-full"></div></div>
                      </div>
                    ))
                  ) : (viewMode === 'month' ? generateCalendarDays() : generateWeekDays()).map((day, i) => {
                    if (!day) return <div key={i} className="min-h-[100px] rounded-2xl bg-transparent" />;
                    const today = new Date();
                    const isSelected = selectedDate.getDate() === day.date && selectedDate.getMonth() === day.month && selectedDate.getFullYear() === day.year;
                    const isToday = today.getDate() === day.date && today.getMonth() === day.month && today.getFullYear() === day.year;
                    
                    const classesForDay = monthlyData.filter(cls => {
                      if (!cls) return false;
                      const dStr = cls.ngayHoc || cls.ngay || cls.date || cls.timeStart || cls.ngayBatDau || cls.start_time || cls.ngayHocDuKien;
                      if (dStr) {
                         if (typeof dStr === 'string') {
                            const str = dStr.split(' ')[0];
                            if (str.includes('/')) {
                               const p = str.split('/');
                               if (p.length === 3 && Number(p[0]) === day.date && Number(p[1]) === day.month + 1 && Number(p[2]) === day.year) return true;
                            }
                            if (str.includes('-')) {
                               const p = str.split('-');
                               if (p.length === 3 && Number(p[0]) === day.year && Number(p[1]) === day.month + 1 && Number(p[2]) === day.date) return true;
                               if (p.length === 3 && Number(p[2]) === day.year && Number(p[1]) === day.month + 1 && Number(p[0]) === day.date) return true;
                            }
                         }
                         const d = new Date(dStr);
                         if (!isNaN(d.getTime()) && d.getDate() === day.date && d.getMonth() === day.month && d.getFullYear() === day.year) return true;
                      }
                      
                      const clsStr = JSON.stringify(cls);
                      const dd = String(day.date).padStart(2, '0');
                      const mm = String(day.month + 1).padStart(2, '0');
                      const yyyy = day.year;
                      return clsStr.includes(`"${dd}/${mm}/${yyyy}"`) || clsStr.includes(`"${yyyy}-${mm}-${dd}"`) || clsStr.includes(`"${yyyy}/${mm}/${dd}"`);
                    });
                    
                    return (
                      <div 
                        key={i} 
                        onClick={() => setSelectedDate(new Date(day.year, day.month, day.date))}
                        className={`min-h-[110px] flex flex-col items-center justify-center p-3 rounded-2xl cursor-pointer transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-bg-primary border border-border-color hover:border-border-strong'} relative`}
                      >
                        <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-text-secondary'}`}>{day.date}</span>
                        {isToday && !isSelected && <span className="mt-1 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
                        {classesForDay.length > 0 && (
                          <div className="absolute -top-2 -right-2 flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-bold shadow-sm border-2 z-10 bg-red-500 text-white border-white">
                            {classesForDay.length}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lịch ngày */}
              <div className="w-full xl:w-[400px] bg-bg-primary p-6 rounded-2xl shadow-sm border border-border-color flex flex-col">
                <h3 className="text-xl font-bold text-text-primary mb-2">Lịch học ngày {selectedDate.getDate()}/{selectedDate.getMonth() + 1}</h3>
                <p className="text-sm text-text-tertiary mb-6">Bạn có {dailyData.length} tiết học hôm nay.</p>
                
                <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {loadingDaily ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex flex-col gap-3 p-5 rounded-2xl bg-bg-primary border border-border-strong shadow-sm border-l-[6px] border-l-slate-300 animate-pulse">
                        <div className="h-5 bg-bg-tertiary rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-bg-tertiary rounded w-1/2"></div>
                        <div className="h-4 bg-bg-tertiary rounded w-2/3 mt-1"></div>
                      </div>
                    ))
                  ) : dailyData.map((cls, idx) => (
                    <div key={idx} className="group flex flex-col gap-3 p-5 rounded-2xl bg-bg-primary border border-border-strong shadow-sm hover:shadow-md transition-all border-l-[6px] border-l-blue-600">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-bold text-text-primary text-[15px] leading-snug">{cls.tenMonHoc}</h4>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 cursor-pointer hover:bg-blue-100 transition-colors">
                          <BookOpen width={16} height={16} />
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 mt-1">
                        <div className="flex items-center gap-2 text-sm text-text-secondary font-medium">
                          <Clock width={15} height={15} className="text-text-tertiary shrink-0" />
                          <span>{cls.timeToDisplay}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-secondary font-medium">
                          <GeoPin width={15} height={15} className="text-text-tertiary shrink-0" />
                          <span className="truncate">{cls.tenPhong}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!loadingDaily && dailyData.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-tertiary gap-2 my-10">
                      <Calendar width={48} height={48} />
                      <p>Không có lịch học</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Moodle Events */}
            <div className="mb-8 p-6 bg-bg-primary rounded-2xl border border-border-color shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <span>📚 Deadlines Moodle</span>
                  {loadingMoodle && <span className="text-sm font-medium text-blue-500 animate-pulse">Đang tải...</span>}
                </h3>
                
                <div className="flex items-center gap-1 bg-bg-tertiary p-1 rounded-xl w-fit">
                  {[{id: '1', label: '1 ngày'}, {id: '7', label: '7 ngày'}, {id: '30', label: '30 ngày'}, {id: 'all', label: 'Tất cả'}].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDeadlineFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${deadlineFilter === tab.id ? 'bg-bg-primary text-blue-600 shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                {(() => {
                  if (loadingMoodle) {
                    return Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-border-color bg-bg-secondary animate-pulse">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-bg-tertiary"></div>
                        <div className="flex-1">
                          <div className="h-5 bg-bg-tertiary rounded w-2/3 mb-2"></div>
                          <div className="h-4 bg-bg-tertiary rounded w-1/3 mb-2"></div>
                          <div className="h-4 bg-bg-tertiary rounded w-1/2"></div>
                        </div>
                      </div>
                    ));
                  }
                  if (!moodleEvents || !Array.isArray(moodleEvents) || !moodleEvents[0]?.data?.events) {
                    return <div className="text-center py-6 text-text-tertiary">Không có dữ liệu deadline</div>;
                  }
                  
                  const allEvents = moodleEvents[0].data.events;
                  const now = Date.now() / 1000;
                  const filteredEvents = allEvents.filter((event: any) => {
                    if (deadlineFilter === 'all') return true;
                    const days = parseInt(deadlineFilter, 10);
                    // For 1, 7, 30 days: show upcoming events and events missed within the last 24h
                    return event.timesort >= now - (24 * 60 * 60) && event.timesort <= now + (days * 24 * 60 * 60);
                  });

                  if (filteredEvents.length === 0) {
                    return (
                      <div className="text-center py-6 text-text-tertiary font-medium bg-bg-secondary rounded-xl border border-border-color border-dashed">
                        🎉 Tuyệt vời! Bạn không có deadline nào trong {deadlineFilter === 'all' ? 'thời gian tới' : `${deadlineFilter} ngày tới`}.
                      </div>
                    );
                  }

                  return filteredEvents.map((event: any) => {
                    const dueDate = new Date(event.timesort * 1000);
                    const isOverdue = event.timesort < now;
                    
                    return (
                      <div key={event.id} className="flex items-start gap-4 p-4 rounded-xl border border-border-color bg-bg-secondary hover:bg-bg-tertiary transition-colors">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          {isOverdue ? '⚠️' : '⏰'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <a href={event.url} target="_blank" rel="noreferrer" className="block font-bold text-text-primary text-base hover:text-blue-600 transition-colors break-words">
                            {event.name}
                          </a>
                          <p className="text-sm text-text-secondary mt-1 font-medium">{event.course?.fullname || "Không rõ môn"}</p>
                          <p className={`text-sm mt-1 flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : 'text-text-tertiary'}`}>
                            <span className="font-semibold">Hạn nộp:</span> {dueDate.toLocaleString('vi-VN')}
                            {isOverdue && " (Đã quá hạn)"}
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Academic Stats */}
            <AcademicStats token={token || ""} callApi={callApi} />

            {/* Khóa học Moodle */}
            <div id="tour-courses" className="mb-8 bg-bg-primary rounded-2xl border border-border-color shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border-color">
                <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                  <span>🎓 Khóa học của tôi</span>
                  {loadingMoodle && <span className="text-sm font-medium text-blue-500 animate-pulse">Đang tải...</span>}
                </h3>
                
                <div className="flex flex-col md:flex-row gap-3">
                  <select 
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-border-strong bg-bg-primary text-sm text-text-secondary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-full md:w-56"
                  >
                    <option value="all">Tất cả (All)</option>
                    <option value="inprogress">Đang diễn ra (In progress)</option>
                    <option value="future">Tương lai (Future)</option>
                    <option value="past">Đã qua (Past)</option>
                    <option value="starred">Đã đánh dấu (Starred)</option>
                    <option value="hidden">Đã ẩn (Removed from view)</option>
                  </select>

                  <input 
                    type="text"
                    placeholder="Tìm kiếm khóa học..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="h-10 px-3 flex-1 rounded-lg border border-border-strong bg-bg-primary text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  
                  <select 
                    value={courseSort}
                    onChange={(e) => setCourseSort(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-border-strong bg-bg-primary text-sm text-text-secondary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-full md:w-64"
                  >
                    <option value="lastaccessed">Truy cập gần đây nhất</option>
                    <option value="fullname">Tên khóa học</option>
                  </select>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {(() => {
                  if (loadingMoodle) {
                    return Array(8).fill(0).map((_, i) => (
                      <div key={i} className="flex flex-col gap-4 p-5 rounded-2xl bg-bg-primary border border-border-color shadow-sm animate-pulse">
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 bg-bg-tertiary rounded-xl"></div>
                          <div className="w-6 h-6 bg-bg-tertiary rounded-full"></div>
                        </div>
                        <div>
                          <div className="h-5 bg-bg-tertiary rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-bg-tertiary rounded w-1/2"></div>
                        </div>
                        <div className="mt-auto">
                          <div className="flex justify-between mb-2">
                            <div className="h-3 bg-bg-tertiary rounded w-1/4"></div>
                            <div className="h-3 bg-bg-tertiary rounded w-1/4"></div>
                          </div>
                          <div className="h-2 w-full bg-bg-tertiary rounded-full"></div>
                        </div>
                      </div>
                    ));
                  }

                  let moodleCourses = moodleEvents && Array.isArray(moodleEvents) && moodleEvents.length > 1 ? moodleEvents[1]?.data?.courses : null;
                  
                  if (!moodleCourses) {
                    return <div className="col-span-full text-center py-8 text-text-tertiary">Không có dữ liệu khóa học</div>;
                  }
                  
                  if (moodleCourses.length === 0) {
                    return (
                      <div className="col-span-full text-center py-8 text-text-tertiary font-medium">
                        Bạn chưa ghi danh vào khóa học nào.
                      </div>
                    );
                  }

                  // Preserve original order for 'lastaccessed' sorting since backend already sorts it
                  moodleCourses = moodleCourses.map((c: any, i: number) => ({ ...c, _originalIndex: c._originalIndex ?? i }));

                  // Filter by classification
                  if (courseFilter !== 'all') {
                    const now = Date.now() / 1000;
                    moodleCourses = moodleCourses.filter((c: any) => {
                      if (courseFilter === 'inprogress') {
                         return (!c.enddate || c.enddate > now) && (!c.startdate || c.startdate <= now);
                      }
                      if (courseFilter === 'past') {
                         return c.enddate && c.enddate < now;
                      }
                      if (courseFilter === 'future') {
                         return c.startdate && c.startdate > now;
                      }
                      if (courseFilter === 'starred') {
                         return c.isfavourite;
                      }
                      if (courseFilter === 'hidden') {
                         return c.hidden;
                      }
                      return true;
                    });
                  }

                  // Search by name
                  if (courseSearch.trim()) {
                    moodleCourses = moodleCourses.filter((c: any) => c.fullname.toLowerCase().includes(courseSearch.toLowerCase()));
                  }

                  // Sort
                  moodleCourses = [...moodleCourses].sort((a: any, b: any) => {
                    if (courseSort === 'fullname') {
                      return a.fullname.localeCompare(b.fullname);
                    }
                    return (a._originalIndex || 0) - (b._originalIndex || 0);
                  });

                  const totalCourses = moodleCourses.length;
                  const totalPages = courseLimit === 0 ? 1 : Math.ceil(totalCourses / courseLimit);
                  const displayCourses = courseLimit === 0 ? moodleCourses : moodleCourses.slice((coursePage - 1) * courseLimit, coursePage * courseLimit);

                  if (moodleCourses.length === 0) {
                    return (
                      <div className="col-span-full text-center py-8 text-text-tertiary font-medium">
                        Không tìm thấy khóa học nào phù hợp với bộ lọc.
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      {displayCourses.map((course: any) => (
                        <a 
                          key={course.id} 
                          href={course.viewurl} 
                          onClick={(e) => handleCourseClick(e, course)}
                          className="group flex flex-col rounded-2xl border border-border-strong overflow-hidden hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-300 transition-all bg-bg-primary cursor-pointer"
                        >
                          <div className="h-36 w-full relative overflow-hidden bg-bg-tertiary">
                            <img 
                              src={course.courseimage} 
                              alt={course.fullname} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              onError={(e) => { (e.target as any).src = 'https://courses.ut.edu.vn/theme/image.php/edly/theme/1784408404/pattern' }}
                            />
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                          <div className="p-5 flex flex-col flex-1">
                            <h4 className="font-bold text-text-primary text-sm mb-3 group-hover:text-blue-600 transition-colors break-words" title={course.fullname}>
                              {course.fullname}
                            </h4>
                            <div className="mt-auto">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Tiến độ</span>
                                <span className="text-xs font-bold text-blue-600">{course.progress !== null ? `${course.progress}%` : '0%'}</span>
                              </div>
                              <div className="w-full bg-bg-tertiary rounded-full h-2.5 overflow-hidden">
                                <div 
                                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                                  style={{ width: `${course.progress || 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </a>
                      ))}

                      {/* Pagination Controls */}
                      <div className="col-span-full mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border-color pt-6">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-text-tertiary">Hiển thị</span>
                          <select 
                            value={courseLimit}
                            onChange={(e) => setCourseLimit(Number(e.target.value))}
                            className="h-9 px-3 rounded-xl border border-border-strong bg-bg-primary text-sm font-semibold text-text-secondary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value={12}>12</option>
                            <option value={24}>24</option>
                            <option value={48}>48</option>
                            <option value={0}>Tất cả</option>
                          </select>
                          <span className="text-sm font-medium text-text-tertiary">khóa học</span>
                        </div>
                        
                        {totalPages > 1 && (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => setCoursePage(p => Math.max(1, p - 1))}
                              disabled={coursePage === 1}
                              className="h-9 w-9 flex items-center justify-center rounded-xl border border-border-strong bg-bg-primary text-text-secondary font-bold hover:bg-bg-secondary hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-bg-primary transition-colors"
                            >
                              {"<"}
                            </button>
                            
                            {Array.from({ length: totalPages }).map((_, i) => (
                              <button 
                                key={i}
                                onClick={() => setCoursePage(i + 1)}
                                className={`h-9 min-w-9 px-3 flex items-center justify-center rounded-xl border text-sm font-bold transition-all ${coursePage === i + 1 ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : 'border-border-strong bg-bg-primary text-text-secondary hover:bg-bg-secondary hover:text-blue-600'}`}
                              >
                                {i + 1}
                              </button>
                            ))}
                            
                            <button 
                              onClick={() => setCoursePage(p => Math.min(totalPages, p + 1))}
                              disabled={coursePage === totalPages}
                              className="h-9 w-9 flex items-center justify-center rounded-xl border border-border-strong bg-bg-primary text-text-secondary font-bold hover:bg-bg-secondary hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-bg-primary transition-colors"
                            >
                              {">"}
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </>
        } />

        <Route path="utilities" element={<UtilitiesPage dailyData={dailyData} selectedDate={selectedDate} onDateChange={setSelectedDate} monthlyData={monthlyData} />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="notifications" element={<NotificationPage />} />
        <Route path="course/:id" element={<CourseDetail />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
          </div>
        </main>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-[90] flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl"
          aria-label="Cuộn lên đầu trang"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m18 15-6-6-6 6"/>
          </svg>
        </button>
      )}

      {/* Global Toast for Browser Opening */}
      {openingRoute && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl bg-slate-800 px-5 py-3.5 text-white shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
          <svg className="h-5 w-5 animate-spin text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-semibold tracking-wide">Đang mở trình duyệt...</span>
        </div>
      )}

      {/* Global Error Toast */}
      {errorToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex max-w-sm w-[90vw] items-start gap-3 rounded-2xl bg-red-600 px-5 py-4 text-white shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
          <svg className="h-5 w-5 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex flex-col gap-1 overflow-hidden">
            <span className="text-sm font-bold tracking-wide">Đã xảy ra lỗi hệ thống</span>
            <span className="text-xs font-medium text-red-100 line-clamp-3">{errorToast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
