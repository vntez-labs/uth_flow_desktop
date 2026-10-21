import { useState } from 'react';
import { Button } from '@heroui/react';
import { IconSettings, IconUser, IconBell, IconShield, IconMoon, IconSun, IconDeviceDesktop, IconInfoCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [activeTab, setActiveTab] = useState<'theme' | 'account' | 'notifications' | 'security'>('theme');
  const navigate = useNavigate();
  
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="flex flex-col gap-6 mt-4 md:mt-6 mb-12 max-w-4xl mx-auto px-2">
      {/* Settings Header */}
      <div className="bg-bg-primary rounded-3xl border border-border-color p-7 sm:p-9 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-[#008689] dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
              <IconSettings size={22} />
            </div>
            Cài đặt ứng dụng
          </h2>
          <p className="text-text-tertiary text-sm mt-1.5">
            Tùy chỉnh giao diện hiển thị, cấu hình dữ liệu và phiên bản ứng dụng UTH Flow.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 flex flex-col gap-1.5 bg-bg-primary p-3 rounded-3xl border border-border-color shadow-xs h-fit">
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all text-left cursor-pointer ${
              activeTab === 'theme' 
                ? 'bg-teal-500/10 text-[#008689] dark:text-[#2DD4BF] border border-teal-500/20' 
                : 'text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            <IconDeviceDesktop size={18} /> Giao diện
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all text-left cursor-pointer ${
              activeTab === 'account' 
                ? 'bg-teal-500/10 text-[#008689] dark:text-[#2DD4BF] border border-teal-500/20' 
                : 'text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            <IconUser size={18} /> Tài khoản
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all text-left cursor-pointer ${
              activeTab === 'notifications' 
                ? 'bg-teal-500/10 text-[#008689] dark:text-[#2DD4BF] border border-teal-500/20' 
                : 'text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            <IconBell size={18} /> Thông báo
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all text-left cursor-pointer ${
              activeTab === 'security' 
                ? 'bg-teal-500/10 text-[#008689] dark:text-[#2DD4BF] border border-teal-500/20' 
                : 'text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            <IconShield size={18} /> Bảo mật
          </button>
        </div>
        
        {/* Main Content Area */}
        <div className="md:col-span-2 bg-bg-primary rounded-3xl border border-border-color p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          {activeTab === 'theme' && (
            <>
              <div>
                <h3 className="text-xl font-bold text-text-primary">Giao diện (Theme)</h3>
                <p className="text-xs text-text-tertiary mt-1">Chọn chủ đề màu sắc phù hợp với bạn.</p>
              </div>
              
              <div 
                onClick={() => handleThemeChange('light')}
                className={`flex items-center justify-between p-4.5 rounded-2xl border transition-all cursor-pointer ${
                  theme === 'light' 
                    ? 'border-[#008689] bg-teal-500/5 shadow-xs' 
                    : 'border-border-color bg-bg-secondary hover:border-border-strong'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#FAF9F5] border border-[#E8E5DD] rounded-xl flex items-center justify-center text-[#1F1E1D] shadow-xs">
                    <IconSun size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary text-sm">Chế độ Sáng (Warm Parchment)</h4>
                    <p className="text-xs text-text-tertiary mt-0.5">Tông màu kem ấm Claude dịu mắt, dễ đọc</p>
                  </div>
                </div>
                <div className={`size-5 rounded-full border flex items-center justify-center ${theme === 'light' ? 'border-[#008689] bg-[#008689]' : 'border-border-strong'}`}>
                  {theme === 'light' && <div className="size-2 rounded-full bg-white" />}
                </div>
              </div>

              <div 
                onClick={() => handleThemeChange('dark')}
                className={`flex items-center justify-between p-4.5 rounded-2xl border transition-all cursor-pointer ${
                  theme === 'dark' 
                    ? 'border-[#2DD4BF] bg-teal-500/5 shadow-xs' 
                    : 'border-border-color bg-bg-secondary hover:border-border-strong'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#1F1E1D] border border-[#383530] rounded-xl flex items-center justify-center text-[#ECEAE2] shadow-xs">
                    <IconMoon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary text-sm">Chế độ Tối (Deep Charcoal)</h4>
                    <p className="text-xs text-text-tertiary mt-0.5">Màu xám than ấm sâu lắng, giảm mỏi mắt ban đêm</p>
                  </div>
                </div>
                <div className={`size-5 rounded-full border flex items-center justify-center ${theme === 'dark' ? 'border-[#2DD4BF] bg-[#2DD4BF]' : 'border-border-strong'}`}>
                  {theme === 'dark' && <div className="size-2 rounded-full bg-black" />}
                </div>
              </div>

              <div className="p-4 bg-teal-500/10 text-text-secondary rounded-2xl text-xs font-medium border border-teal-500/20 flex items-start gap-3">
                <IconInfoCircle size={18} className="text-[#008689] dark:text-[#2DD4BF] shrink-0 mt-0.5" />
                <span>
                  Gợi ý: Bạn có thể nhanh chóng chuyển đổi giao diện Sáng / Tối bất kỳ lúc nào bằng nút biểu tượng Mặt trời / Mặt trăng trên thanh công cụ góc trên bên phải.
                </span>
              </div>
            </>
          )}

          {activeTab === 'account' && (
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-bold text-text-primary">Quản lý Tài khoản</h3>
              <p className="text-sm text-text-tertiary leading-relaxed">
                Ứng dụng hỗ trợ đăng nhập nhiều tài khoản sinh viên cùng lúc. Bạn có thể chuyển đổi tài khoản bất cứ lúc nào qua menu trên thanh điều hướng.
              </p>
              <Button 
                variant="ghost" 
                className="w-fit rounded-xl border border-border-color font-semibold text-text-primary bg-bg-secondary hover:bg-bg-tertiary"
                onPress={() => navigate('/accounts')}
              >
                Quản lý danh sách tài khoản
              </Button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-bold text-text-primary">Cấu hình Thông báo</h3>
              <p className="text-sm text-text-tertiary leading-relaxed">
                Nhận cảnh báo hạn nộp bài tập Moodle sắp tới và thông báo quan trọng từ Cổng thông tin đào tạo UTH.
              </p>
              <div className="p-4 bg-bg-secondary rounded-2xl border border-border-color text-xs text-text-secondary">
                Hệ thống tự động đồng bộ deadline từ khóa học của bạn theo chu kỳ 15 phút.
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-bold text-text-primary">Bảo mật & Quyền riêng tư</h3>
              <p className="text-sm text-text-tertiary leading-relaxed">
                Mật khẩu và phiên đăng nhập được lưu mã hóa trực tiếp trong hệ thống lưu trữ an toàn của hệ điều hành. Mọi yêu cầu API đều kết nối thẳng tới máy chủ chính thức của trường ĐH Giao thông Vận tải TP.HCM.
              </p>
            </div>
          )}

          {/* App Version Info */}
          <div className="border-t border-border-color pt-6 mt-2 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-text-primary text-sm">Phiên bản UTH Flow</h4>
              <p className="text-xs text-text-tertiary font-mono mt-0.5">v0.2.7 (Desktop Build)</p>
            </div>
            <Button 
              size="sm" 
              className="bg-[#008689] hover:bg-[#006f72] text-white text-xs font-semibold rounded-xl"
              onPress={() => navigate('/changelog')}
            >
              Xem Changelog
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
