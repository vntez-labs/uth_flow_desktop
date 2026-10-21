// @ts-nocheck
import { useEffect, useState, lazy, Suspense } from "react";
import { invoke } from "@tauri-apps/api/core";
import { NavLink, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { openUrl } from "@tauri-apps/plugin-opener";
import CourseDetail from "../pages/CourseDetail";
import { useUserStore } from "../stores/user.store";
import { Dropdown, Label, Button, Accordion, Drawer, Modal } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconHome,
  IconBell,
  IconRocket,
  IconUser,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconCreditCard,
  IconPencil,
  IconTarget,
  IconHeadphones,
  IconBook2,
  IconFileText,
  IconSchool,
  IconCopy,
  IconSearch,
  IconMenu2,
  IconX,
  IconSun,
  IconMoon,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconAlertTriangle,
  IconLock,
  IconShieldLock,
  IconExternalLink,
  IconCircleCheck,
  IconDeviceLaptop,
  IconHierarchy2,
  IconWallet,
  IconUserCheck,
  IconChecklist,
  IconHeart,
  IconRefresh,
  IconSettings,
  IconLogout,
  IconCategory
} from '@tabler/icons-react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useDashboardData } from "../hooks/useDashboardData";
import { getStudentYear } from "../utils";

const MarkdownNote = lazy(() => import('./MarkdownNote'));
import UtilitiesPage from "./pages/UtilitiesPage";
import ServicesPage from "./pages/ServicesPage";
import AboutPage from "./pages/AboutPage";
import NotificationPage from "./pages/NotificationPage";
import SettingsPage from "./pages/SettingsPage";
import AcademicStats from "./AcademicStats";
import EventPage from "./pages/EventPage";

export default function Dashboard({ onLogout, getGradient }: { onLogout: () => void, getGradient: (name: string) => string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useUserStore();
  const [openingRoute, setOpeningRoute] = useState<string | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [selectedHeaderNote, setSelectedHeaderNote] = useState<any>(null);
  const [isLoadingHeaderNote, setIsLoadingHeaderNote] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  
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

  // Month Calendar states
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDayScheduleModalOpen, setIsDayScheduleModalOpen] = useState(false);


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
          { element: '#tour-quick-actions', popover: { title: 'Truy cập nhanh', description: 'Lối tắt truy cập nhanh vào LMS, Đăng ký môn, Học phí...', side: "bottom", align: 'start' }},
          { element: '#tour-calendar', popover: { title: 'Lịch học & Deadline', description: 'Xem lịch học chi tiết và tất cả các bài tập Moodle sắp tới.', side: "top", align: 'start' }},
          { element: '#tour-courses', popover: { title: 'Khóa học của tôi', description: 'Danh sách khóa học Moodle, hỗ trợ tìm kiếm, phân trang và xem tiến trình.', side: "top", align: 'start' }},
        ],
        onDestroyed: () => {
          localStorage.setItem('uth_tour_completed', 'true');
        }
      });
      
      setTimeout(() => {
        driverObj.drive();
      }, 2500);
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
    if (openingRoute) return;

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

  const {
    surveyInfo,
    notes,
    popups,
    isPopupModalOpen, setIsPopupModalOpen,
    isSurveyModalOpen, setIsSurveyModalOpen,
    credit, fetchCredit, isFetchingCredit,
    monthlyData, loadingMonthly,
    weeklyData, loadingWeekly,
    dailyData, loadingDaily,
    moodleEvents, loadingMoodle,
    sideMenu, loadingSideMenu,
    mainMenu,
    debugError, errorToast, callApi
  } = useDashboardData({
    user, token, currentMonth, selectedDate, onLogout
  });

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Shift so Monday is 0 index
    const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;
    
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: i, month, year });
    }
    
    const totalCells = days.length <= 35 ? 35 : 42;
    while (days.length < totalCells) {
      days.push(null);
    }
    return days;
  };

  if (!user) return null;

  const currentHour = new Date().getHours();
  const isAfternoon = currentHour >= 12 && currentHour < 18;
  const isEvening = currentHour >= 18;
  const GreetingIcon = isEvening ? IconMoon : IconSun;
  const greetingText = isEvening ? "Chào buổi tối" : (isAfternoon ? "Chào buổi chiều" : "Chào buổi sáng");
  const firstName = user.ten?.split(' ').pop() || user.mssv;



  return (
    <div className="flex h-screen w-full flex-col bg-bg-secondary text-text-secondary">
      {/* COMPACT CLEAN HEADER */}
      <header className="sticky top-0 z-50 w-full bg-bg-primary border-b border-border-color shadow-2xs h-15 shrink-0">
        <div className="container mx-auto max-w-7xl flex h-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6 h-full">
            <div className="flex items-center gap-2.5 cursor-pointer transition-opacity hover:opacity-85 shrink-0" onClick={() => navigate("/dashboard")}>
              <img src="/logo.png" alt="UTH Flow Logo" className="size-8.5 shrink-0 object-contain drop-shadow-xs rounded-lg" />
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold font-heading tracking-tight text-text-primary hidden sm:block">
                  UTH Flow
                </h1>
                <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full bg-teal-500/10 text-[#008689] text-xs font-bold uppercase tracking-wider">
                  Desktop
                </span>
              </div>
            </div>
            
            {/* Header Navigation */}
            <nav id="tour-nav" className="hidden md:flex items-center gap-1.5 h-full">
              {[
                { id: "", name: "Trang chủ", icon: IconHome },
                { id: "schedule", name: "Thời khóa biểu tuần", icon: IconCalendar },
                { id: "utilities", name: "Tiện ích", icon: IconCategory },
                { id: "about", name: "Ủng hộ & Tác giả", icon: IconHeart },
              ].map(tab => (
                <NavLink
                  key={tab.name}
                  to={tab.id === "" ? "/dashboard" : `/dashboard/${tab.id}`}
                  end={tab.id === ""}
                  className={({ isActive }) => `relative flex items-center gap-2 px-3.5 mx-0.5 h-full transition-all border-b-2 text-sm font-semibold ${isActive ? 'text-[#008689] font-bold border-[#008689]' : 'text-text-tertiary border-transparent hover:text-text-primary hover:border-border-strong'}`}
                >
                  {({ isActive }) => (
                    <>
                      <tab.icon size={19} stroke={1.8} className={`shrink-0 ${isActive ? "text-[#008689]" : "text-text-tertiary"}`} />
                      <span className="whitespace-nowrap">{tab.name}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-2.5">
            {/* Notifications Dropdown (Bên phải Navbar, kế bên Avatar) */}
            <Dropdown>
              <Dropdown.Trigger id="tour-notifications">
                <button 
                  type="button"
                  className="relative flex items-center justify-center size-9 text-text-secondary hover:text-text-primary rounded-xl hover:bg-bg-tertiary transition-colors cursor-pointer outline-none"
                  title="Thông báo"
                >
                  <IconBell size={20} stroke={1.8} />
                  {notes.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white border-2 border-white shadow-xs">
                      {notes.length > 99 ? '99+' : notes.length}
                    </span>
                  )}
                </button>
              </Dropdown.Trigger>
              <Dropdown.Popover placement="bottom end">
                <div className="w-84 sm:w-92 bg-bg-primary rounded-2xl shadow-xl border border-border-color overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-color bg-bg-secondary/40">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-text-primary font-heading flex items-center gap-2">
                      <IconBell size={16} className="text-[#008689]" />
                      Thông báo {notes.length > 0 ? `(${notes.length})` : ''}
                    </span>
                    <button 
                      type="button"
                      onClick={() => navigate('/dashboard/notifications')}
                      className="text-xs font-bold text-[#008689] hover:underline cursor-pointer"
                    >
                      Xem tất cả
                    </button>
                  </div>
                  <Dropdown.Menu aria-label="Notifications" className="p-0 max-h-80 overflow-y-auto">
                    {notes.length === 0 ? (
                      <Dropdown.Item className="py-6 text-center text-text-tertiary pointer-events-none text-sm font-medium" textValue="Không có thông báo">
                        Không có thông báo mới
                      </Dropdown.Item>
                    ) : (
                      notes.slice(0, 15).map((note, idx) => (
                        <Dropdown.Item 
                          key={note.id ? `note-${note.id}` : `note-idx-${idx}`} 
                          textValue={note.tieuDe}
                          className="!h-auto !py-3 border-b border-border-color/60 hover:bg-bg-secondary rounded-none !whitespace-normal cursor-pointer"
                          style={{ height: 'auto', minHeight: 'fit-content' }}
                          onPress={async () => {
                            const match = note.noiDung?.match(/href=['"](.*?)['"]/);
                            if (match && match[1]) {
                              let finalUrl = match[1];
                              const eventMatch = finalUrl.match(/\/event\/(\d+)/);
                              if (eventMatch && eventMatch[1]) {
                                navigate(`/dashboard/event/${eventMatch[1]}`);
                                return;
                              }
                              if (!finalUrl.startsWith('http')) {
                                finalUrl = finalUrl.startsWith('/') ? `https://portal.ut.edu.vn${finalUrl}` : `https://portal.ut.edu.vn/${finalUrl}`;
                              }
                              openUrl(finalUrl).catch(console.error);
                              return;
                            }

                            setSelectedHeaderNote(note);
                            setIsNoteModalOpen(true);
                            if (note.id) {
                              setIsLoadingHeaderNote(true);
                              try {
                                const detail = await callApi("fetch_portal_get", { token: token || "", endpoint: `notification/${note.id}` });
                                if (detail?.success && detail.body) {
                                  setSelectedHeaderNote(detail.body);
                                }
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setIsLoadingHeaderNote(false);
                              }
                            }
                          }}
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-sm text-text-primary leading-snug line-clamp-2">{note.tieuDe}</span>
                            <div className="text-xs text-text-tertiary line-clamp-2 prose prose-sm max-w-none pointer-events-none">
                              {note.noiDung ? note.noiDung.replace(/<[^>]+>/g, '') : ""}
                            </div>
                          </div>
                        </Dropdown.Item>
                      ))
                    )}
                  </Dropdown.Menu>
                  <div className="p-2.5 border-t border-border-color bg-bg-secondary/40 text-center">
                    <button 
                      type="button"
                      onClick={() => navigate('/dashboard/notifications')}
                      className="text-xs font-bold text-[#008689] hover:underline cursor-pointer"
                    >
                      Mở trang thông báo chi tiết &rarr;
                    </button>
                  </div>
                </div>
              </Dropdown.Popover>
            </Dropdown>

            {/* Profile Dropdown */}
            <Dropdown>
              <Dropdown.Trigger id="tour-profile">
                <div className="flex cursor-pointer items-center gap-2.5 rounded-full pl-2 pr-1.5 py-1 hover:bg-bg-tertiary transition-colors">
                  <div className="hidden sm:flex flex-col items-end leading-none">
                    <span className="text-sm font-bold text-text-primary">{firstName}</span>
                    <span className="text-xs text-text-tertiary font-medium">{user.mssv}</span>
                  </div>
                  {user.avatar ? (
                    <img src={user.avatar} className="size-8.5 rounded-full border border-border-color object-cover shadow-2xs" alt="avatar" />
                  ) : (
                    <div 
                      className="size-8.5 flex items-center justify-center rounded-full text-white text-xs font-bold border border-border-color shadow-2xs"
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
                  else if (key === 'settings') navigate('/dashboard/settings');
                }}>
                  <Dropdown.Item id="profile" textValue="Profile" className="h-auto py-2.5 gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <IconUser size={18} stroke={1.8} className="text-[#008689] shrink-0" />
                      <Label className="flex flex-col items-start">
                        <p className="font-medium text-xs text-text-tertiary">Đăng nhập với</p>
                        <p className="font-bold text-sm text-text-primary truncate">{user.email || user.mssv}</p>
                      </Label>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item id="settings" textValue="Cài đặt" className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <IconSettings size={18} stroke={1.8} className="text-text-secondary shrink-0" />
                      <Label className="text-sm font-semibold text-text-primary">Cài đặt</Label>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item id="logout" textValue="Đăng xuất" variant="danger" className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <IconLogout size={18} stroke={1.8} className="text-rose-600 shrink-0" />
                      <Label className="text-sm font-bold text-rose-600">Đăng xuất</Label>
                    </div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>

            {/* Drawer Trigger */}
            <button 
              id="tour-drawer"
              type="button"
              onClick={openDrawer}
              className="flex items-center justify-center size-9 text-text-secondary hover:text-text-primary rounded-xl hover:bg-bg-tertiary transition-colors cursor-pointer outline-none"
              title="Danh mục tiện ích"
            >
              {isDrawerOpen ? <IconX size={20} stroke={1.8} /> : <IconMenu2 size={20} stroke={1.8} />}
            </button>
            
            {/* UTILITIES RIGHT DRAWER */}
            <Drawer isOpen={isDrawerOpen} onOpenChange={onDrawerOpenChange}>
              <Drawer.Backdrop>
                <Drawer.Content placement="right">
                  <Drawer.Dialog>
                    <Drawer.Header className="border-b border-border-color p-4 flex items-center justify-between">
                      <Drawer.Heading className="font-extrabold text-base text-text-primary uppercase tracking-wider font-heading">Danh mục Tiện ích</Drawer.Heading>
                      <button 
                        type="button" 
                        onClick={() => setIsDrawerOpen(false)}
                        className="size-8 flex items-center justify-center rounded-xl hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                        title="Đóng"
                      >
                        <IconX size={18} stroke={1.8} />
                      </button>
                    </Drawer.Header>
                    <Drawer.Body className="p-3 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      <Accordion>
                        {loadingSideMenu ? (
                           Array(5).fill(0).map((_, i) => (
                             <div key={i} className="p-3 border-b border-border-color last:border-0 flex items-center justify-between">
                               <div className="h-4 w-1/2 bg-bg-tertiary rounded animate-pulse"></div>
                               <div className="h-4 w-4 bg-bg-tertiary rounded animate-pulse"></div>
                             </div>
                           ))
                        ) : sideMenu.map(item => (
                          <Accordion.Item key={item.id}>
                            <Accordion.Heading>
                              <Accordion.Trigger className="flex justify-between items-center w-full p-3 hover:bg-bg-secondary font-bold uppercase text-xs sm:text-sm text-text-secondary group rounded-xl outline-none">
                                <span className="group-data-[open=true]:text-[#008689] transition-colors">{item.name}</span>
                                <IconChevronDown size={18} stroke={1.8} className="text-text-tertiary group-data-[open=true]:text-[#008689] group-data-[open=true]:rotate-180 transition-transform duration-200" />
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
                                    className="group/item flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-teal-500/10 hover:text-[#008689]"
                                  >
                                    <span className="size-2 rounded-full bg-slate-300 group-hover/item:bg-[#008689] transition-colors"></span>
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
                      <Drawer.Heading className="font-bold text-base text-text-primary pr-8 font-heading">
                        {selectedCourse?.fullname}
                      </Drawer.Heading>
                    </Drawer.Header>
                    <Drawer.Body className="p-4 sm:p-5 overflow-y-auto bg-bg-secondary [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {loadingCourse ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                          <div className="size-7 border-3 border-[#008689] border-t-transparent rounded-full animate-spin"></div>
                          <span className="font-medium text-xs text-text-tertiary">Đang tải nội dung môn học...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {courseContents?.map((section: any, idx: number) => (
                            <div key={idx} className="bg-bg-primary p-4 rounded-2xl border border-border-color shadow-xs">
                              <h3 className="font-bold text-sm text-text-primary mb-3" dangerouslySetInnerHTML={{__html: section.name}} />
                              {section.summary && (
                                <div className="text-xs text-text-secondary mb-3 prose prose-sm max-w-none" dangerouslySetInnerHTML={{__html: section.summary}} />
                              )}
                              <div className="flex flex-col gap-1.5">
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
                                    className="flex items-center gap-2.5 p-2.5 hover:bg-bg-secondary rounded-xl transition-colors border border-transparent hover:border-border-color group"
                                  >
                                    <img src={mod.modicon} alt={mod.modname} className="size-6 group-hover:scale-105 transition-transform" />
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className="font-medium text-xs text-[#008689] break-words whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: mod.modname === 'label' ? (mod.description || mod.customdata || mod.name) : mod.name}} />
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          ))}
                          
                          {(!courseContents || courseContents.length === 0) && !loadingCourse && (
                            <div className="text-center py-10 text-text-tertiary text-xs font-medium">
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

      {/* MAIN CONTAINER (FULL WIDTH, NO AWKWARD SIDEBAR SQUEEZING THE SCREEN) */}
      <div className="flex flex-1 overflow-hidden">
        <main 
          id="main-scroll-container"
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-7 sm:py-8 bg-bg-secondary scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {/* Survey Modal */}
          <Modal isOpen={isSurveyModalOpen} onOpenChange={setIsSurveyModalOpen}>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog>
                  <Modal.Header>
                    <Modal.Heading className="font-bold text-base font-heading">Khảo sát {surveyInfo?.haveForceSurvey ? "bắt buộc" : "không bắt buộc"}</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body className="py-3 text-xs text-text-secondary">
                    <p>Bạn có một khảo sát cần hoàn thành. Vui lòng truy cập trang Portal để thực hiện.</p>
                  </Modal.Body>
                  <Modal.Footer className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onPress={() => setIsSurveyModalOpen(false)}>
                      Đóng
                    </Button>
                    <Button size="sm" className="bg-[#008689] hover:bg-[#006f72] text-white font-semibold rounded-xl" onPress={() => {
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

          {/* Popup Modal */}
          <Modal isOpen={isPopupModalOpen} onOpenChange={setIsPopupModalOpen}>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog>
                  <Modal.Header>
                    <Modal.Heading className="font-bold text-base font-heading">
                      {popups.length === 1 ? popups[0].tieuDe : "Thông báo"}
                    </Modal.Heading>
                  </Modal.Header>
                  <Modal.Body className="py-3 max-h-[70vh] overflow-y-auto">
                    {popups.map((popup, idx) => (
                      <div key={idx} className="mb-3 last:mb-0">
                        {(popups.length > 1 || (popup.tieuDe.toLowerCase() !== "thông báo" && popups.length === 1)) && (
                          <h4 className="font-bold text-sm mb-2 text-text-primary">{popup.tieuDe}</h4>
                        )}
                        <div className="text-xs text-text-secondary prose prose-sm max-w-none break-words">
                          <Suspense fallback={<div className="animate-pulse h-4 bg-bg-tertiary rounded w-full mt-2"></div>}>
                            <MarkdownNote content={popup.noiDung} />
                          </Suspense>
                        </div>
                      </div>
                    ))}
                  </Modal.Body>
                  <Modal.Footer className="flex justify-end">
                    <Button size="sm" className="bg-[#008689] hover:bg-[#006f72] text-white font-semibold rounded-xl" onPress={() => setIsPopupModalOpen(false)}>
                      Đóng
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>

          {/* Day Schedule Modal */}
          <Modal isOpen={isDayScheduleModalOpen} onOpenChange={setIsDayScheduleModalOpen}>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog className="max-w-lg w-full">
                  <Modal.Header className="flex items-center justify-between border-b border-border-color pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-teal-500/10 text-[#008689] flex items-center justify-center shrink-0">
                        <IconCalendar size={20} stroke={1.8} />
                      </div>
                      <div>
                        <Modal.Heading className="text-base font-bold text-text-primary font-heading">
                          Lịch học ngày {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}
                        </Modal.Heading>
                        <p className="text-xs text-text-tertiary">
                          {dailyData.length > 0 ? `${dailyData.length} tiết / môn học trong ngày` : 'Chi tiết thời khóa biểu trong ngày'}
                        </p>
                      </div>
                    </div>
                  </Modal.Header>
                  <Modal.Body className="py-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {loadingDaily ? (
                      <div className="flex flex-col gap-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="p-3.5 rounded-xl border border-border-color bg-bg-secondary animate-pulse flex flex-col gap-2">
                            <div className="h-4 bg-bg-tertiary rounded w-3/4" />
                            <div className="h-3 bg-bg-tertiary rounded w-1/2" />
                          </div>
                        ))}
                      </div>
                    ) : dailyData.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {dailyData.map((cls, idx) => {
                          const courseUrl = cls.link || cls.url || cls.lmsUrl || cls.courseUrl;
                          return (
                            <div 
                              key={idx}
                              onClick={() => {
                                if (courseUrl) {
                                  openUrl(courseUrl).catch(console.error);
                                }
                              }}
                              className={`p-4 rounded-xl border border-border-color bg-bg-secondary/40 transition-all border-l-4 border-l-[#008689] ${
                                courseUrl ? 'hover:border-[#008689] hover:bg-white hover:shadow-xs cursor-pointer group' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={`font-bold text-sm text-text-primary leading-snug flex items-center gap-1.5 ${courseUrl ? 'group-hover:text-[#008689] transition-colors' : ''}`}>
                                  {cls.tenMonHoc}
                                  {courseUrl && (
                                    <IconExternalLink size={15} className="text-text-tertiary group-hover:text-[#008689] shrink-0 transition-colors" />
                                  )}
                                </h4>
                                <span className="text-xs font-semibold text-[#008689] bg-teal-500/10 px-2.5 py-0.5 rounded-md shrink-0">
                                  {cls.maHocPhan || cls.maMonHoc || "Lớp HP"}
                                </span>
                              </div>
                              <div className="flex flex-col gap-2 mt-2.5 text-sm text-text-secondary">
                                <div className="flex items-center gap-2">
                                  <IconClock size={16} stroke={1.8} className="text-text-tertiary shrink-0" />
                                  <span className="font-medium">{cls.timeToDisplay || (cls.tietBatDau ? `Tiết ${cls.tietBatDau} - ${cls.soTiet} tiết` : "Chưa có giờ")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <IconMapPin size={16} stroke={1.8} className="text-text-tertiary shrink-0" />
                                  <span className="font-medium truncate">{cls.tenPhong || "Chưa có phòng học"}</span>
                                </div>
                                {cls.tenGiangVien && (
                                  <div className="flex items-center gap-2">
                                    <IconUser size={16} stroke={1.8} className="text-text-tertiary shrink-0" />
                                    <span className="text-text-tertiary font-medium truncate">{cls.tenGiangVien}</span>
                                  </div>
                                )}
                              </div>
                              {courseUrl && (
                                <div className="mt-3 pt-2.5 border-t border-border-color/60 flex items-center justify-between text-xs">
                                  <span className="text-[#008689] font-bold flex items-center gap-1 group-hover:underline">
                                    Vào thẳng LMS Moodle &rarr;
                                  </span>
                                  <span className="text-text-tertiary text-[11px] font-medium">Một chạm (SSO Token)</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-10 flex flex-col items-center justify-center text-text-tertiary text-center gap-2.5">
                        <IconCalendar size={44} stroke={1.5} className="opacity-30" />
                        <p className="text-sm font-medium">Không có lịch học nào trong ngày này</p>
                      </div>
                    )}
                  </Modal.Body>
                  <Modal.Footer className="border-t border-border-color pt-3 flex justify-end">
                    <Button 
                      className="bg-[#008689] hover:bg-[#006f72] text-white font-semibold rounded-xl text-sm px-5 h-9"
                      onPress={() => setIsDayScheduleModalOpen(false)}
                    >
                      Đóng
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>

          <div className="container mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* GREETING BAR */}
                    <div className="mb-7 sm:mb-8">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-text-primary tracking-tight flex items-center gap-3">
                            <GreetingIcon size={30} className="text-amber-500 shrink-0" />
                            {greetingText}, {firstName}!
                          </h2>
                          <div className="mt-2 text-text-tertiary text-sm font-medium flex items-center gap-2.5 flex-wrap">
                            <span className="inline-block px-3 py-0.5 rounded-full bg-teal-500/10 text-[#008689] border border-teal-500/20 text-xs font-bold">
                              {getStudentYear((user as any).khoa_hoc) || "Sinh viên"}
                            </span>
                            {((user as any).chuyen_nganh || (user as any).nganh) && (
                              <span className="font-medium text-text-secondary">&bull; {((user as any).chuyen_nganh || (user as any).nganh)}</span>
                            )}
                            <span className="text-text-tertiary">&bull; MSSV: <strong className="text-text-primary font-bold">{user.mssv}</strong></span>
                          </div>
                        </div>
                      </div>

                      {debugError && (
                        <div className="mt-3.5 p-4 bg-rose-50 border border-rose-200/60 rounded-xl shadow-xs">
                          {(debugError.includes("401") || debugError.includes("JWT")) ? (
                            <div className="flex flex-col gap-2.5">
                              <div className="flex items-center gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                                  <IconShieldLock size={20} stroke={1.8} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm text-rose-800">Phiên đăng nhập đã hết hạn</h4>
                                  <p className="text-xs text-rose-700/80 mt-0.5 font-medium">Chỉ cần bấm vào nút bên dưới để tự động khôi phục phiên.</p>
                                </div>
                              </div>
                              <Button 
                                 size="sm"
                                 className="w-fit bg-rose-600 font-bold text-white shadow-xs mt-1 border-none hover:bg-rose-700 text-sm h-9 px-4 rounded-xl" 
                                 onPress={() => {
                                   setIsRenewing(true);
                                   window.location.reload();
                                 }}
                                 isDisabled={isRenewing}
                              >
                                Khôi phục phiên đăng nhập
                              </Button>
                            </div>
                          ) : (
                            <details>
                              <summary className="font-bold text-sm text-rose-800 cursor-pointer hover:text-rose-900 outline-none select-none">
                                Phát hiện lỗi đồng bộ (Nhấn để xem chi tiết)
                              </summary>
                              <div className="mt-2.5 flex items-center gap-2">
                                <Button 
                                  size="sm"
                                  className="bg-rose-200/50 text-rose-700 font-bold hover:bg-rose-200 border-none text-xs h-8 rounded-lg"
                                  onPress={() => {
                                    navigator.clipboard.writeText(debugError);
                                    alert("Đã copy mã lỗi vào clipboard!");
                                  }}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <IconCopy size={15} />
                                    <span>Copy mã lỗi</span>
                                  </div>
                                </Button>
                              </div>
                              <pre className="mt-2.5 p-3 bg-rose-900/10 rounded-xl whitespace-pre-wrap font-mono text-xs text-rose-900">
                                {debugError}
                              </pre>
                            </details>
                          )}
                        </div>
                      )}
                    </div>

                    {/* SIDE-BY-SIDE 2-COLUMN GRID: MONTH CALENDAR + DEADLINES MOODLE */}
                    <div id="tour-calendar" className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mb-8 sm:mb-10">
                      {/* Cột 1: Lịch tháng với chấm môn học */}
                      <div id="calendar-export-area" className="bg-bg-primary p-6 sm:p-7 rounded-2xl border border-border-color shadow-sm flex flex-col justify-between">
                        <div>
                          {/* Calendar Header with Navigation */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-xl bg-teal-500/10 text-[#008689] flex items-center justify-center shrink-0">
                                <IconCalendar size={20} stroke={1.8} />
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-text-primary font-heading">Lịch học theo tháng</h3>
                                <p className="text-xs text-text-tertiary">Chạm vào ngày để xem thời khóa biểu chi tiết</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 bg-[#F4F9F9] p-1 rounded-xl border border-border-color">
                              <button 
                                type="button"
                                className="size-8 flex items-center justify-center rounded-lg hover:bg-white text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                                title="Tháng trước"
                              >
                                <IconChevronLeft size={18} stroke={1.8} />
                              </button>
                              <span className="text-sm font-bold text-text-primary px-2.5 min-w-[120px] text-center font-heading">
                                Tháng {currentMonth.getMonth() + 1}/{currentMonth.getFullYear()}
                              </span>
                              <button 
                                type="button"
                                className="size-8 flex items-center justify-center rounded-lg hover:bg-white text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                                title="Tháng sau"
                              >
                                <IconChevronRight size={18} stroke={1.8} />
                              </button>
                            </div>
                          </div>

                          {/* Day-of-week headers */}
                          <div className="grid grid-cols-7 gap-1.5 mb-2">
                            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                              <div key={d} className="text-center font-bold text-text-tertiary text-xs py-1">
                                {d}
                              </div>
                            ))}
                          </div>

                          {/* Day Grid with Clean Borderless Cells (No Visual Clutter) */}
                          <div className="grid grid-cols-7 gap-1.5">
                            {loadingMonthly ? (
                              Array(35).fill(0).map((_, i) => (
                                <div key={i} className="h-12 sm:h-13 rounded-xl bg-bg-secondary animate-pulse" />
                              ))
                            ) : generateCalendarDays().map((day, i) => {
                              if (!day) return <div key={i} className="h-12 sm:h-13" />;
                              
                              const today = new Date();
                              const isSelected = selectedDate.getDate() === day.date && selectedDate.getMonth() === day.month && selectedDate.getFullYear() === day.year;
                              const isToday = today.getDate() === day.date && today.getMonth() === day.month && today.getFullYear() === day.year;

                              const classesForDay = monthlyData.filter(cls => {
                                if (!cls) return false;
                                const dStr = cls.ngayHoc || cls.ngay || cls.date || cls.timeStart || cls.ngayBatDau || cls.start_time || cls.ngayHocDuKien;
                                if (dStr && typeof dStr === 'string') {
                                   const clean = dStr.trim().split(' ')[0].split('T')[0];
                                   if (clean.includes('/')) {
                                      const p = clean.split('/').map(Number);
                                      if (p.length === 3) {
                                         if (p[0] > 1000) {
                                            if (p[0] === day.year && p[1] === day.month + 1 && p[2] === day.date) return true;
                                         } else {
                                            if (p[0] === day.date && p[1] === day.month + 1 && p[2] === day.year) return true;
                                         }
                                      }
                                   }
                                   if (clean.includes('-')) {
                                      const p = clean.split('-').map(Number);
                                      if (p.length === 3) {
                                         if (p[0] > 1000) {
                                            if (p[0] === day.year && p[1] === day.month + 1 && p[2] === day.date) return true;
                                         } else {
                                            if (p[0] === day.date && p[1] === day.month + 1 && p[2] === day.year) return true;
                                         }
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

                              const classCount = (() => {
                                let count = classesForDay.length;
                                classesForDay.forEach(cls => {
                                  if (cls.subjects && Array.isArray(cls.subjects)) {
                                    count = Math.max(count, cls.subjects.length);
                                  } else if (typeof cls.total === 'number') {
                                    count = Math.max(count, cls.total);
                                  }
                                });
                                return count;
                              })();

                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    setSelectedDate(new Date(day.year, day.month, day.date));
                                    setIsDayScheduleModalOpen(true);
                                  }}
                                  className={`h-12 sm:h-13 flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all relative outline-none ${
                                    isSelected 
                                      ? 'bg-[#008689] text-white shadow-sm font-bold' 
                                      : isToday 
                                        ? 'bg-teal-500/15 border border-teal-500/50 text-[#008689] font-bold hover:bg-teal-500/25' 
                                        : 'hover:bg-bg-secondary text-text-primary'
                                  }`}
                                >
                                  <span className={`text-sm font-bold leading-none ${isSelected ? 'text-white' : (isToday ? 'text-[#008689]' : 'text-text-primary')}`}>
                                    {day.date}
                                  </span>
                                  {classCount > 0 && (
                                    <div className="flex items-center justify-center gap-1 mt-1.5 flex-wrap max-w-[85%]">
                                      {Array.from({ length: Math.min(classCount, 4) }).map((_, dotIdx) => (
                                        <span 
                                          key={dotIdx} 
                                          className={`size-2 rounded-full ${isSelected ? 'bg-white' : 'bg-[#008689]'}`} 
                                        />
                                      ))}
                                      {classCount > 4 && (
                                        <span className={`text-[10px] font-bold leading-none ${isSelected ? 'text-white' : 'text-[#008689]'}`}>
                                          +{classCount - 4}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Calendar Bottom Legend */}
                        <div className="mt-5 pt-3.5 border-t border-border-color flex items-center justify-between text-xs text-text-tertiary">
                          <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full bg-[#008689]" />
                            <span className="font-medium text-text-secondary">1 chấm = 1 môn học</span>
                          </div>
                          <span className="text-[#008689] font-bold hover:underline cursor-pointer" onClick={() => navigate("/dashboard/schedule")}>
                            Mở TKB tuần chi tiết &rarr;
                          </span>
                        </div>
                      </div>

                      {/* Cột 2: Deadlines Moodle */}
                      <div className="bg-bg-primary p-6 sm:p-7 rounded-2xl border border-border-color shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-xl bg-teal-500/10 text-[#008689] flex items-center justify-center shrink-0">
                                <IconBook2 size={20} stroke={1.8} />
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-text-primary font-heading flex items-center gap-2">
                                  Deadlines Moodle
                                  {loadingMoodle && <span className="text-xs font-normal text-[#008689] animate-pulse">Đang tải...</span>}
                                </h3>
                                <p className="text-xs text-text-tertiary">Bài tập và hoạt động cần nộp trên LMS</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 bg-[#F4F9F9] p-1 rounded-xl border border-border-color">
                              {[
                                { id: '1', label: '1 ngày' },
                                { id: '7', label: '7 ngày' },
                                { id: '30', label: '30 ngày' },
                                { id: 'all', label: 'Tất cả' }
                              ].map(tab => (
                                <button
                                  key={tab.id}
                                  onClick={() => setDeadlineFilter(tab.id as any)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    deadlineFilter === tab.id 
                                      ? 'bg-white text-[#008689] shadow-xs border border-border-color' 
                                      : 'text-text-tertiary hover:text-text-secondary'
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="overflow-y-auto max-h-[325px] pr-1 space-y-2.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <AnimatePresence mode="wait">
                              {(() => {
                                if (loadingMoodle) {
                                  return (
                                    <div className="flex flex-col gap-2.5">
                                      {Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border border-border-color bg-[#F4F9F9] animate-pulse">
                                          <div className="size-9 shrink-0 rounded-lg bg-bg-tertiary"></div>
                                          <div className="flex-1">
                                            <div className="h-4 bg-bg-tertiary rounded w-2/3 mb-1.5"></div>
                                            <div className="h-3 bg-bg-tertiary rounded w-1/3 mb-1"></div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }
                                if (!moodleEvents || !Array.isArray(moodleEvents) || !moodleEvents[0]?.data?.events) {
                                  return (
                                    <div className="text-center py-10 text-text-tertiary text-sm font-medium">
                                      Không có dữ liệu deadline
                                    </div>
                                  );
                                }
                              
                                const allEvents = moodleEvents[0].data.events;
                                const now = Date.now() / 1000;
                                const filteredEvents = allEvents.filter((event: any) => {
                                  if (deadlineFilter === 'all') return true;
                                  const days = parseInt(deadlineFilter, 10);
                                  return event.timesort >= now - (24 * 60 * 60) && event.timesort <= now + (days * 24 * 60 * 60);
                                });

                                if (filteredEvents.length === 0) {
                                  return (
                                    <div className="text-center py-10 text-text-tertiary text-sm font-medium bg-[#F4F9F9] rounded-xl border border-border-color border-dashed">
                                      🎉 Tuyệt vời! Bạn không có deadline nào trong {deadlineFilter === 'all' ? 'thời gian tới' : `${deadlineFilter} ngày tới`}.
                                    </div>
                                  );
                                }

                                return (
                                  <div className="flex flex-col gap-2.5">
                                    {filteredEvents.map((event: any) => {
                                      const dueDate = new Date(event.timesort * 1000);
                                      const isOverdue = event.timesort < now;
                                      
                                      return (
                                        <div key={event.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-border-color bg-[#F4F9F9] hover:bg-white hover:border-[#008689] hover:shadow-xs transition-all">
                                          <div className={`size-9 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs ${isOverdue ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 'bg-teal-500/10 text-[#008689] border border-teal-500/20'}`}>
                                            {isOverdue ? <IconAlertTriangle size={18} stroke={1.8} /> : <IconClock size={18} stroke={1.8} />}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <a 
                                              href={event.url} 
                                              target="_blank" 
                                              rel="noreferrer" 
                                              className="block font-bold text-text-primary text-sm hover:text-[#008689] transition-colors truncate"
                                              title={event.name}
                                            >
                                              {event.name}
                                            </a>
                                            <p className="text-xs text-text-secondary truncate mt-0.5">{event.course?.fullname || "Không rõ môn"}</p>
                                            <p className={`text-xs mt-1 flex items-center gap-1.5 ${isOverdue ? 'text-rose-600 font-bold' : 'text-text-tertiary font-medium'}`}>
                                              <span>Hạn nộp: {dueDate.toLocaleString('vi-VN')}</span>
                                              {isOverdue && <span className="font-bold text-rose-600">(Đã quá hạn)</span>}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div className="mt-5 pt-3.5 border-t border-border-color flex items-center justify-between text-xs text-text-tertiary">
                          <span>Đồng bộ từ các khóa học LMS</span>
                          <span 
                            className="text-[#008689] font-bold hover:underline cursor-pointer flex items-center gap-1" 
                            onClick={() => openUrl("https://courses.ut.edu.vn")}
                          >
                            <span>Mở LMS Courses</span>
                            <IconExternalLink size={14} stroke={1.8} />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Khóa học Moodle */}
                    <div id="tour-courses" className="mb-10 bg-bg-primary rounded-2xl border border-border-color shadow-sm overflow-hidden">
                      <div className="p-5 sm:p-6 border-b border-border-color bg-[#F4F9F9]">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base sm:text-lg font-bold text-text-primary font-heading flex items-center gap-2.5">
                            <span>Khóa học của tôi</span>
                            {loadingMoodle && <span className="text-xs font-normal text-[#008689] animate-pulse">Đang tải...</span>}
                          </h3>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-3">
                          <div className="relative w-full md:w-56">
                            <select 
                              value={courseFilter}
                              onChange={(e) => setCourseFilter(e.target.value)}
                              className="w-full appearance-none h-10 pl-3.5 pr-8 rounded-xl border border-border-strong bg-white text-sm font-semibold text-text-secondary outline-none focus:border-[#008689] cursor-pointer shadow-2xs transition-all"
                            >
                              <option value="all">Tất cả (All)</option>
                              <option value="inprogress">Đang diễn ra (In progress)</option>
                              <option value="future">Tương lai (Future)</option>
                              <option value="past">Đã qua (Past)</option>
                              <option value="starred">Đã đánh dấu (Starred)</option>
                              <option value="hidden">Đã ẩn (Removed from view)</option>
                            </select>
                            <IconChevronDown size={16} stroke={1.8} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                          </div>

                          <div className="relative flex-1">
                            <IconSearch size={18} stroke={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                            <input 
                              type="text"
                              placeholder="Tìm kiếm khóa học..."
                              value={courseSearch}
                              onChange={(e) => setCourseSearch(e.target.value)}
                              className="h-10 pl-10 pr-3.5 w-full rounded-xl border border-border-strong bg-white text-sm outline-none focus:border-[#008689] text-text-primary shadow-2xs"
                            />
                          </div>
                          
                          <div className="relative w-full md:w-64">
                            <select 
                              value={courseSort}
                              onChange={(e) => setCourseSort(e.target.value)}
                              className="w-full appearance-none h-10 pl-3.5 pr-8 rounded-xl border border-border-strong bg-white text-sm font-semibold text-text-secondary outline-none focus:border-[#008689] cursor-pointer shadow-2xs transition-all"
                            >
                              <option value="lastaccessed">Truy cập gần đây nhất</option>
                              <option value="fullname">Tên khóa học</option>
                            </select>
                            <IconChevronDown size={16} stroke={1.8} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-5 sm:p-6">
                        <AnimatePresence mode="wait">
                          {(() => {
                            if (loadingMoodle) {
                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                  {Array(8).fill(0).map((_, i) => (
                                    <div key={i} className="flex flex-col gap-3 p-4 rounded-xl bg-[#F4F9F9] border border-border-color shadow-2xs animate-pulse">
                                      <div className="h-28 bg-bg-tertiary rounded-lg"></div>
                                      <div className="h-4 bg-bg-tertiary rounded w-3/4"></div>
                                      <div className="h-3 bg-bg-tertiary rounded w-1/2"></div>
                                    </div>
                                  ))}
                                </div>
                              );
                            }

                            let moodleCourses = moodleEvents && Array.isArray(moodleEvents) && moodleEvents.length > 1 ? moodleEvents[1]?.data?.courses : null;
                            
                            if (!moodleCourses) {
                              return <div className="col-span-full text-center py-10 text-text-tertiary text-sm font-medium">Không có dữ liệu khóa học</div>;
                            }
                          
                            if (moodleCourses.length === 0) {
                              return (
                                <div className="col-span-full text-center py-10 text-text-tertiary text-sm font-medium">
                                  Bạn chưa ghi danh vào khóa học nào.
                                </div>
                              );
                            }

                            moodleCourses = moodleCourses.map((c: any, i: number) => ({ ...c, _originalIndex: c._originalIndex ?? i }));

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

                            if (courseSearch.trim()) {
                              moodleCourses = moodleCourses.filter((c: any) => c.fullname.toLowerCase().includes(courseSearch.toLowerCase()));
                            }

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
                                <div className="col-span-full text-center py-10 text-text-tertiary text-sm font-medium">
                                  Không tìm thấy khóa học nào phù hợp với bộ lọc.
                                </div>
                              );
                            }
                            
                            return (
                              <div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                  {displayCourses.map((course: any) => (
                                    <a 
                                      key={course.id} 
                                      href={course.viewurl} 
                                      onClick={(e) => handleCourseClick(e, course)}
                                      className="group flex flex-col rounded-2xl border border-border-color overflow-hidden hover:shadow-md hover:border-[#008689] transition-all bg-[#F4F9F9] hover:bg-white cursor-pointer"
                                    >
                                      <div className="h-34 w-full relative overflow-hidden bg-bg-tertiary">
                                        <img 
                                          src={course.courseimage} 
                                          alt={course.fullname} 
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                          onError={(e) => { (e.target as any).src = 'https://courses.ut.edu.vn/theme/image.php/edly/theme/1784408404/pattern' }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                      </div>
                                      <div className="p-4 flex flex-col flex-1">
                                        <h4 className="font-bold text-text-primary text-sm mb-3 group-hover:text-[#008689] transition-colors break-words line-clamp-2 leading-snug" title={course.fullname}>
                                          {course.fullname}
                                        </h4>
                                        <div className="mt-auto">
                                          <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Tiến độ</span>
                                            <span className="text-xs font-bold text-[#008689]">{course.progress !== null ? `${course.progress}%` : '0%'}</span>
                                          </div>
                                          <div className="w-full bg-bg-tertiary rounded-full h-2 overflow-hidden">
                                            <div 
                                              className="bg-[#008689] h-2 rounded-full transition-all duration-700 ease-out" 
                                              style={{ width: `${course.progress || 0}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </a>
                                  ))}
                                </div>

                                {/* Pagination Controls */}
                                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border-color pt-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-text-tertiary">Hiển thị</span>
                                    <select 
                                      value={courseLimit}
                                      onChange={(e) => setCourseLimit(Number(e.target.value))}
                                      className="h-9 px-3 rounded-xl border border-border-strong bg-bg-secondary text-sm font-bold text-text-secondary outline-none focus:border-[#008689] cursor-pointer"
                                    >
                                      <option value={12}>12</option>
                                      <option value={24}>24</option>
                                      <option value={48}>48</option>
                                      <option value={0}>Tất cả</option>
                                    </select>
                                    <span className="text-sm font-medium text-text-tertiary">khóa học ({totalCourses})</span>
                                  </div>
                                  
                                  {totalPages > 1 && (
                                    <div className="flex items-center gap-1.5">
                                      <button 
                                        onClick={() => setCoursePage(p => Math.max(1, p - 1))}
                                        disabled={coursePage === 1}
                                        className="size-9 flex items-center justify-center rounded-xl border border-border-color bg-bg-primary text-text-secondary hover:bg-bg-secondary hover:text-[#008689] disabled:opacity-40 disabled:hover:bg-bg-primary transition-colors cursor-pointer"
                                      >
                                        <IconChevronLeft size={18} stroke={1.8} />
                                      </button>
                                      
                                      {Array.from({ length: totalPages }).map((_, i) => (
                                        <button 
                                          key={i}
                                          onClick={() => setCoursePage(i + 1)}
                                          className={`size-9 flex items-center justify-center rounded-xl border text-sm font-bold transition-all cursor-pointer ${coursePage === i + 1 ? 'border-[#008689] bg-[#008689] text-white shadow-2xs' : 'border-border-color bg-bg-primary text-text-secondary hover:border-[#008689] hover:text-[#008689]'}`}
                                        >
                                          {i + 1}
                                        </button>
                                      ))}
                                      
                                      <button 
                                        onClick={() => setCoursePage(p => Math.min(totalPages, p + 1))}
                                        disabled={coursePage === totalPages}
                                        className="size-9 flex items-center justify-center rounded-xl border border-border-color bg-bg-primary text-text-secondary hover:bg-bg-secondary hover:text-[#008689] disabled:opacity-40 disabled:hover:bg-bg-primary transition-colors cursor-pointer"
                                      >
                                        <IconChevronRight size={18} stroke={1.8} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                } />

                <Route path="schedule" element={
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="h-full">
                    <UtilitiesPage weeklyData={weeklyData} monthlyData={monthlyData} loadingWeekly={loadingWeekly} dailyData={dailyData} selectedDate={selectedDate} onDateChange={setSelectedDate} />
                  </motion.div>
                } />

                <Route path="utilities" element={
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="h-full">
                    <ServicesPage token={token || ""} callApi={callApi} sideMenu={sideMenu} loadingSideMenu={loadingSideMenu} handleOpenRoute={handleOpenRoute} />
                  </motion.div>
                } />

                <Route path="services" element={<Navigate to="/dashboard/utilities" replace />} />
                <Route path="about" element={
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="h-full">
                    <AboutPage />
                  </motion.div>
                } />
                <Route path="notifications" element={
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="h-full">
                    <NotificationPage />
                  </motion.div>
                } />
                <Route path="settings" element={
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="h-full">
                    <SettingsPage />
                  </motion.div>
                } />
                <Route path="course/:id" element={
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="h-full">
                    <CourseDetail />
                  </motion.div>
                } />
                <Route path="event/:id" element={
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="h-full">
                    <EventPage />
                  </motion.div>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </div>
        </main>
      </div>


      {/* Global Toast for Browser Opening */}
      {openingRoute && (
        <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-xl animate-in slide-in-from-bottom-3 fade-in duration-200">
          <svg className="size-4.5 animate-spin text-[#008689]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-semibold tracking-wide">Đang mở trình duyệt...</span>
        </div>
      )}

      {/* Global Error Toast */}
      {errorToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] flex max-w-md w-[92vw] items-start gap-3 rounded-2xl bg-rose-600 px-4 py-3.5 text-white shadow-xl animate-in slide-in-from-bottom-3 fade-in duration-200">
          <IconAlertTriangle size={20} stroke={1.8} className="shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="text-sm font-bold tracking-wide">Đã xảy ra lỗi hệ thống</span>
            <span className="text-xs font-medium text-rose-100 line-clamp-2">{errorToast}</span>
          </div>
        </div>
      )}

      {/* Note Details Modal */}
      <Modal isOpen={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-xl w-full">
              <Modal.Header className="pb-3 border-b border-border-color">
                <Modal.Heading className="font-bold text-base leading-snug pr-4 font-heading">
                  {selectedHeaderNote?.tieuDe || "Chi tiết thông báo"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="py-4 overflow-y-auto max-h-[70vh]">
                <AnimatePresence mode="wait">
                  {isLoadingHeaderNote ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-2.5">
                      <div className="animate-spin rounded-full size-7 border-b-2 border-[#008689]"></div>
                      <span className="text-sm font-medium text-text-secondary">Đang tải nội dung...</span>
                    </div>
                  ) : selectedHeaderNote ? (
                    <div className="text-sm text-text-primary prose prose-base max-w-none break-words">
                      <Suspense fallback={<div className="animate-pulse h-4 bg-bg-tertiary rounded w-full mt-2"></div>}>
                        <MarkdownNote content={selectedHeaderNote.noiDung} />
                      </Suspense>
                    </div>
                  ) : null}
                </AnimatePresence>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2.5 border-t border-border-color pt-3">
                {selectedHeaderNote?.id && (
                  <Button size="sm" variant="ghost" className="text-sm h-9 px-3.5 rounded-xl" onPress={() => window.open(`https://portal.ut.edu.vn/thong-bao/${selectedHeaderNote.id}`, '_blank')}>
                    Mở trong Portal
                  </Button>
                )}
                <Button size="sm" className="bg-[#008689] hover:bg-[#006f72] text-white font-semibold rounded-xl text-sm h-9 px-5" onPress={() => setIsNoteModalOpen(false)}>
                  Đóng
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
