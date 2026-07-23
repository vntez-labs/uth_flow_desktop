import { useState } from 'react';
import { Button } from '@heroui/react';
import { Settings, User, Bell, Shield, Moon, Sun, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
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
    <div className="flex flex-col gap-6 mt-4 md:mt-8 mb-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 flex items-center gap-3">
          <Settings width={32} height={32} /> Cài đặt ứng dụng
        </h2>
        <p className="text-slate-200 font-medium text-base sm:text-lg max-w-2xl">
          Tùy chỉnh giao diện, thông báo và quản lý tài khoản của bạn tại đây.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col gap-2">
          <Button variant="primary" className="justify-start font-bold bg-blue-100 text-blue-700 w-full" startContent={<Monitor width={18} />}>Giao diện</Button>
          <Button variant="ghost" className="justify-start font-medium text-text-secondary w-full" startContent={<User width={18} />}>Tài khoản</Button>
          <Button variant="ghost" className="justify-start font-medium text-text-secondary w-full" startContent={<Bell width={18} />}>Thông báo</Button>
          <Button variant="ghost" className="justify-start font-medium text-text-secondary w-full" startContent={<Shield width={18} />}>Bảo mật</Button>
        </div>
        
        <div className="md:col-span-2 bg-bg-primary rounded-3xl border border-border-color p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          <h3 className="text-xl font-bold text-text-primary border-b border-border-color pb-4">Giao diện (Theme)</h3>
          
          <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-2xl border border-border-color">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-800 shadow-sm">
                <Sun width={20} />
              </div>
              <div>
                <h4 className="font-bold text-text-primary">Chế độ Sáng (Light)</h4>
                <p className="text-sm text-text-tertiary">Giao diện sáng sủa, dễ nhìn ban ngày</p>
              </div>
            </div>
            <Button size="sm" variant={theme === 'light' ? 'primary' : 'ghost'} onPress={() => handleThemeChange('light')}>
              {theme === 'light' ? 'Đang dùng' : 'Chọn'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-800 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center text-slate-200 shadow-sm">
                <Moon width={20} />
              </div>
              <div>
                <h4 className="font-bold text-white">Chế độ Tối (Dark)</h4>
                <p className="text-sm text-slate-400">Bảo vệ mắt khi sử dụng vào ban đêm</p>
              </div>
            </div>
            <Button size="sm" variant={theme === 'dark' ? 'primary' : 'ghost'} className={theme !== 'dark' ? 'text-white border-slate-600' : ''} onPress={() => handleThemeChange('dark')}>
              {theme === 'dark' ? 'Đang dùng' : 'Chọn'}
            </Button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-2xl text-sm font-medium border border-blue-100 dark:border-blue-900/40">
            💡 Gợi ý: Bạn có thể chuyển đổi nhanh chế độ Sáng/Tối bằng nút Mặt trời/Mặt trăng ở góc trên cùng bên phải màn hình.
          </div>
          
          <h3 className="text-xl font-bold text-text-primary border-b border-border-color pb-4 mt-6">Phiên bản Ứng dụng</h3>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-text-primary">UTH Sync</h4>
              <p className="text-sm text-text-tertiary">v0.1.4</p>
            </div>
            <Button size="sm" variant="ghost">Kiểm tra cập nhật</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
