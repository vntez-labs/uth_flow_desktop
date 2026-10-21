import { useState, useMemo } from 'react';
import { 
  IconBook2, 
  IconSchool, 
  IconCalendar, 
  IconCreditCard, 
  IconUserCheck, 
  IconExternalLink, 
  IconSearch, 
  IconDeviceLaptop, 
  IconFileText, 
  IconTarget, 
  IconHierarchy2, 
  IconSparkles,
  IconRocket
} from '@tabler/icons-react';
import AcademicStats from '../AcademicStats';

interface ServiceItem {
  id: number;
  name: string;
  route?: string;
  icon?: any;
}

interface ServiceCategory {
  id: number;
  name: string;
  children?: ServiceItem[];
}

export default function ServicesPage({
  token,
  callApi,
  sideMenu = [],
  loadingSideMenu = false,
  handleOpenRoute
}: {
  token: string;
  callApi: (command: string, args: any) => Promise<any>;
  sideMenu?: ServiceCategory[];
  loadingSideMenu?: boolean;
  handleOpenRoute: (route?: string, name?: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Common quick portals requested by user
  const coreServices = [
    {
      name: "Đào tạo trực tuyến LMS",
      desc: "Vào hệ thống courses.ut.edu.vn học trực tuyến và làm bài tập",
      route: "https://courses.ut.edu.vn",
      icon: IconDeviceLaptop,
      badge: "Moodle LMS",
      color: "bg-teal-500/10 text-[#008689] border-teal-500/20"
    },
    {
      name: "Đăng ký học phần",
      desc: "Cổng đăng ký tín chỉ, chọn môn học theo thời khóa biểu học kỳ",
      route: "/dkmh/dangkyhocphan",
      icon: IconTarget,
      badge: "Cổng DKMH",
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20"
    },
    {
      name: "Tra cứu Lịch thi",
      desc: "Xem lịch thi kết thúc học phần, phòng thi và ca thi chi tiết",
      route: "/lichthi/sinhvien",
      icon: IconCalendar,
      badge: "Khảo thí",
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20"
    },
    {
      name: "Học phí & Công nợ",
      desc: "Kiểm tra học phí từng học kỳ, hóa đơn điện tử và các khoản thanh toán",
      route: "/hocphi/congno",
      icon: IconCreditCard,
      badge: "Tài chính",
      color: "bg-rose-500/10 text-rose-600 border-rose-500/20"
    },
    {
      name: "Cổng khảo sát sinh viên",
      desc: "Đánh giá chất lượng giảng dạy, cơ sở vật chất và ý kiến sinh viên",
      route: "/survey",
      icon: IconFileText,
      badge: "Khảo sát",
      color: "bg-purple-500/10 text-purple-600 border-purple-500/20"
    },
    {
      name: "Cập nhật hồ sơ sinh viên",
      desc: "Quản lý thông tin liên hệ, giấy tờ tùy thân và bảo hiểm",
      route: "/profile",
      icon: IconUserCheck,
      badge: "Hồ sơ",
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    }
  ];

  // Helper to map category names to relevant Tabler icons
  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('học tập') || lower.includes('đào tạo') || lower.includes('điểm')) return IconSchool;
    if (lower.includes('đăng ký') || lower.includes('dkmh') || lower.includes('môn học')) return IconBook2;
    if (lower.includes('tài chính') || lower.includes('học phí') || lower.includes('công nợ')) return IconCreditCard;
    if (lower.includes('khảo sát') || lower.includes('đánh giá')) return IconFileText;
    if (lower.includes('lịch') || lower.includes('thời khóa biểu')) return IconCalendar;
    return IconHierarchy2;
  };

  // Filtered categories and services based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return sideMenu;
    const q = searchQuery.toLowerCase().trim();

    return sideMenu
      .map(cat => {
        const matchesCategory = cat.name.toLowerCase().includes(q);
        const matchingChildren = cat.children?.filter(child => 
          child.name.toLowerCase().includes(q) || (child.route && child.route.toLowerCase().includes(q))
        ) || [];

        if (matchesCategory) return cat;
        if (matchingChildren.length > 0) {
          return {
            ...cat,
            children: matchingChildren
          };
        }
        return null;
      })
      .filter(Boolean) as ServiceCategory[];
  }, [sideMenu, searchQuery]);

  return (
    <div className="flex flex-col gap-8 mb-16 max-w-7xl mx-auto">
      {/* PAGE HEADER HERO BANNER */}
      <div className="bg-bg-primary rounded-3xl border border-border-color p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-bold text-[#008689] mb-2.5">
            <IconSparkles size={14} /> Trung tâm Dịch vụ & Học tập
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-text-primary tracking-tight">
            Tiện ích Sinh viên UTH
          </h2>
          <p className="text-text-tertiary text-xs sm:text-sm mt-1 max-w-2xl font-medium">
            Tiến độ tích lũy GPA, Đào tạo trực tuyến LMS, Đăng ký học phần và toàn bộ cổng dịch vụ sinh viên UTH tại một nơi.
          </p>
        </div>

        {/* Search input for utilities */}
        <div className="relative min-w-[260px] sm:min-w-[320px]">
          <IconSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tiện ích, dịch vụ..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-color bg-bg-secondary text-text-primary placeholder:text-text-tertiary text-sm outline-none focus:border-[#008689] focus:ring-2 focus:ring-[#008689]/20 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-tertiary hover:text-text-primary px-1.5 py-0.5 rounded-md hover:bg-bg-tertiary cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: CÁC DỊCH VỤ TRỰC TUYẾN CHÍNH (QUICK ACCESS HUBS) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-teal-500/10 text-[#008689] flex items-center justify-center font-bold">
              <IconRocket size={18} stroke={1.8} />
            </div>
            <h3 className="text-lg font-bold text-text-primary font-heading">
              Cổng Dịch vụ Trực tuyến Phổ biến
            </h3>
          </div>
          <span className="text-xs text-text-tertiary font-medium">Một chạm mở trực tiếp</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreServices.map((svc, idx) => (
            <div
              key={idx}
              onClick={() => handleOpenRoute(svc.route, svc.name)}
              className="bg-bg-primary rounded-2xl border border-border-color p-5 hover:border-[#008689] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl border ${svc.color} group-hover:scale-105 transition-transform`}>
                    <svc.icon size={22} stroke={1.8} />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-bg-secondary text-text-tertiary border border-border-color">
                    {svc.badge}
                  </span>
                </div>
                <h4 className="font-bold text-base text-text-primary group-hover:text-[#008689] transition-colors leading-snug">
                  {svc.name}
                </h4>
                <p className="text-xs text-text-tertiary font-medium mt-1.5 line-clamp-2 leading-relaxed">
                  {svc.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border-color/60 flex items-center justify-between text-xs text-[#008689] font-bold">
                <span className="flex items-center gap-1 group-hover:underline">Truy cập ngay</span>
                <IconExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: TIẾN ĐỘ TÍCH LŨY GPA & KẾT QUẢ HỌC TẬP */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="size-8 rounded-xl bg-teal-500/10 text-[#008689] flex items-center justify-center font-bold">
            <IconSchool size={18} stroke={1.8} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary font-heading">
              Tiến độ Tích lũy & Điểm GPA Học kỳ
            </h3>
            <p className="text-xs text-text-tertiary font-medium">Theo dõi tín chỉ hoàn thành, điểm từng môn và xếp loại tốt nghiệp</p>
          </div>
        </div>

        {/* Academic Stats Component */}
        <AcademicStats token={token || ""} callApi={callApi} />
      </div>

      {/* SECTION 3: DANH MỤC TIỆN ÍCH UTH MỞ RỘNG (TỪ DRAWER SIDEMENU) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-teal-500/10 text-[#008689] flex items-center justify-center font-bold">
              <IconHierarchy2 size={18} stroke={1.8} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary font-heading">
                Tất cả Tiện ích Hệ thống Portal UTH
              </h3>
              <p className="text-xs text-text-tertiary font-medium">Toàn bộ tính năng từ danh mục tiện ích được sắp xếp theo từng phân hệ</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-500/10 text-[#008689] border border-teal-500/20">
            {filteredCategories.length} Nhóm tiện ích
          </span>
        </div>

        {loadingSideMenu ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-bg-primary rounded-2xl border border-border-color p-5 animate-pulse flex flex-col gap-3">
                <div className="h-5 bg-bg-tertiary rounded w-1/2" />
                <div className="h-4 bg-bg-tertiary rounded w-3/4" />
                <div className="h-4 bg-bg-tertiary rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-bg-primary rounded-2xl border border-border-color p-12 text-center flex flex-col items-center justify-center gap-2.5">
            <IconSearch size={36} className="text-text-tertiary opacity-40" />
            <p className="text-sm font-bold text-text-primary">Không tìm thấy tiện ích phù hợp</p>
            <p className="text-xs text-text-tertiary">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc tìm kiếm.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCategories.map(cat => {
              const CatIcon = getCategoryIcon(cat.name);
              return (
                <div 
                  key={cat.id} 
                  className="bg-bg-primary rounded-2xl border border-border-color shadow-sm p-5 sm:p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center gap-3 pb-3 mb-3 border-b border-border-color">
                      <div className="size-8 rounded-xl bg-teal-500/10 text-[#008689] flex items-center justify-center shrink-0">
                        <CatIcon size={18} stroke={1.8} />
                      </div>
                      <h4 className="font-extrabold text-sm uppercase tracking-wider text-text-primary font-heading line-clamp-1" title={cat.name}>
                        {cat.name}
                      </h4>
                    </div>

                    <div className="flex flex-col gap-1">
                      {cat.children && cat.children.length > 0 ? (
                        cat.children.map(child => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => handleOpenRoute(child.route, child.name)}
                            className="group/item flex items-center justify-between p-2 rounded-xl hover:bg-bg-secondary text-left transition-colors cursor-pointer outline-none"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <span className="size-1.5 rounded-full bg-slate-300 group-hover/item:bg-[#008689] group-hover/item:scale-125 transition-all shrink-0" />
                              <span className="text-xs sm:text-sm font-medium text-text-secondary group-hover/item:text-[#008689] transition-colors truncate">
                                {child.name}
                              </span>
                            </div>
                            <IconExternalLink size={13} className="text-text-tertiary opacity-0 group-hover/item:opacity-100 group-hover/item:text-[#008689] transition-all shrink-0" />
                          </button>
                        ))
                      ) : (
                        <span className="text-xs text-text-tertiary italic py-2">Không có tiện ích con</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border-color/60 text-right">
                    <span className="text-[11px] font-bold text-text-tertiary">
                      {cat.children?.length || 0} chức năng
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}