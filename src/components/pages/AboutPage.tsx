import { Button } from '@heroui/react';
import { IconRocket, IconCircleCheck, IconShieldCheck, IconHeart, IconCopy } from '@tabler/icons-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-6 mt-4 md:mt-6 mb-12 max-w-5xl mx-auto px-2">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-bg-primary border border-border-color p-8 sm:p-12 shadow-sm flex flex-col sm:flex-row items-center gap-8">
        <div className="size-20 sm:size-24 rounded-3xl bg-gradient-to-br from-[#008689] to-[#005E60] p-3.5 shadow-xl shadow-teal-500/20 flex items-center justify-center shrink-0">
          <img src="/logo.png" alt="UTH Flow Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-semibold text-[#008689] dark:text-[#2DD4BF] mb-3">
            Mã nguồn mở • Phiên bản Desktop
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Về UTH Flow
          </h2>
          <p className="mt-2 text-text-tertiary text-sm sm:text-base leading-relaxed max-w-2xl">
            Đồng bộ thời khóa biểu tức thì, một chạm vào thẳng lớp học LMS Courses không cần đăng nhập lại, theo dõi GPA chi tiết và hỗ trợ học tập toàn diện cho sinh viên Đại học Giao thông Vận tải TP.HCM.
          </p>
        </div>
      </div>

      {/* Core Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-bg-primary p-7 rounded-3xl border border-border-color shadow-xs hover:border-teal-500/30 transition-all">
          <div className="w-12 h-12 bg-teal-500/10 text-[#008689] dark:text-[#2DD4BF] rounded-2xl flex items-center justify-center mb-4">
            <IconRocket size={24} />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">Sứ mệnh</h3>
          <p className="text-text-tertiary text-sm leading-relaxed">
            Đơn giản hóa việc quản lý lịch học và deadline, giúp sinh viên có thêm thời gian tập trung vào nâng cao kiến thức và phát triển bản thân.
          </p>
        </div>

        <div className="bg-bg-primary p-7 rounded-3xl border border-border-color shadow-xs hover:border-teal-500/30 transition-all">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4">
            <IconCircleCheck size={24} />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">Tầm nhìn</h3>
          <p className="text-text-tertiary text-sm leading-relaxed">
            Xây dựng hệ sinh thái tiện ích hiện đại, tối giản và mượt mà, trở thành người bạn đồng hành tin cậy của mọi sinh viên UTH.
          </p>
        </div>

        <div className="bg-bg-primary p-7 rounded-3xl border border-border-color shadow-xs hover:border-teal-500/30 transition-all">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-4">
            <IconShieldCheck size={24} />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">Bảo mật</h3>
          <p className="text-text-tertiary text-sm leading-relaxed">
            Dữ liệu cá nhân và mật khẩu được lưu trữ an toàn, cục bộ trên máy tính của bạn. Không lưu trữ thông tin đăng nhập trên bất kỳ máy chủ trung gian nào.
          </p>
        </div>
      </div>

      {/* Donate & QR Code */}
      <div className="bg-bg-primary rounded-3xl border border-border-color p-8 sm:p-10 shadow-sm mt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-color pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#008689] dark:text-[#2DD4BF] mb-1">
              <IconHeart size={14} className="fill-[#008689] dark:fill-[#2DD4BF]" />
              Đóng góp cộng đồng
            </div>
            <h3 className="text-2xl font-bold text-text-primary">Ủng hộ phát triển dự án</h3>
            <p className="text-text-tertiary text-sm mt-1">
              Sự hỗ trợ của bạn giúp duy trì máy chủ cập nhật và tạo động lực hoàn thiện ứng dụng.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Bank Transfer info */}
          <div className="bg-bg-secondary rounded-2xl p-6 border border-border-color flex flex-col items-center text-center">
            <div className="w-48 h-72 rounded-2xl mb-5 overflow-hidden bg-cover bg-center border border-border-color shadow-xs"
              style={{ backgroundImage: 'url(/qr.jpg)' }}
            />
            
            <div className="w-full bg-bg-primary rounded-xl p-4 flex flex-col gap-2 border border-border-color text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-tertiary font-medium">Ngân hàng</span>
                <span className="font-bold text-text-primary">MBBank</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-tertiary font-medium">Chủ tài khoản</span>
                <span className="font-bold text-text-primary">NGUYEN HOANG NAM</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-border-color mt-1">
                <span className="text-text-tertiary font-medium">Số tài khoản</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#008689] dark:text-[#2DD4BF]">0335574737</span>
                  <button 
                    type="button"
                    className="text-text-tertiary hover:text-text-primary transition-colors cursor-pointer" 
                    title="Sao chép"
                    onClick={() => {
                      navigator.clipboard.writeText('0335574737');
                      alert('Đã sao chép số tài khoản!');
                    }}
                  >
                    <IconCopy size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Tiers */}
          <div className="flex flex-col gap-3.5">
            <h4 className="font-bold text-text-primary text-sm mb-1">Mức đóng góp gợi ý:</h4>
            
            <div className="bg-bg-secondary rounded-2xl p-4 border border-border-color flex items-center gap-4 hover:border-teal-500/40 transition-all">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-2xl shrink-0">
                ☕
              </div>
              <div>
                <h5 className="font-bold text-text-primary text-sm">1 ly cà phê</h5>
                <p className="text-text-tertiary text-xs">20.000 VNĐ - Tiếp thêm năng lượng cho đội ngũ lập trình.</p>
              </div>
            </div>
            
            <div className="bg-bg-secondary rounded-2xl p-4 border border-teal-500/30 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#008689] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg">
                PHỔ BIẾN
              </div>
              <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center text-2xl shrink-0">
                🍕
              </div>
              <div>
                <h5 className="font-bold text-text-primary text-sm">Bữa ăn nhẹ</h5>
                <p className="text-text-tertiary text-xs">50.000 VNĐ - Hỗ trợ một phần chi phí hạ tầng máy chủ.</p>
              </div>
            </div>
            
            <div className="bg-bg-secondary rounded-2xl p-4 border border-border-color flex items-center gap-4 hover:border-teal-500/40 transition-all">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-2xl shrink-0">
                🚀
              </div>
              <div>
                <h5 className="font-bold text-text-primary text-sm">Đồng hành phát triển</h5>
                <p className="text-text-tertiary text-xs">100.000+ VNĐ - Chung tay duy trì và phát triển thêm tiện ích mới.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Author Section */}
      <div className="bg-bg-primary rounded-3xl border border-border-color p-8 sm:p-10 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="size-20 rounded-2xl bg-gradient-to-br from-[#008689] to-[#005E60] flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0">
            H
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h4 className="text-xl font-bold text-text-primary">hnamhocit</h4>
              <span className="bg-teal-500/10 text-[#008689] dark:text-[#2DD4BF] border border-teal-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-full w-fit mx-auto sm:mx-0">
                Tác giả & Nhà phát triển
              </span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed max-w-2xl mb-4">
              "Mong muốn tạo ra công cụ mã nguồn mở hữu ích, giúp sinh viên UTH theo dõi lịch học, deadline nhanh chóng và tiện lợi nhất trên máy tính và điện thoại."
            </p>
            <div className="flex gap-2.5 justify-center sm:justify-start">
              <Button 
                variant="ghost" 
                size="sm" 
                className="font-semibold text-text-secondary bg-bg-secondary hover:bg-bg-tertiary rounded-xl"
                onPress={() => window.open('https://github.com/hnamhocit', '_blank')}
              >
                GitHub
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="font-semibold text-[#008689] dark:text-[#2DD4BF] bg-teal-500/10 hover:bg-teal-500/20 rounded-xl"
                onPress={() => window.open('https://facebook.com/hnamhocit', '_blank')}
              >
                Liên hệ Facebook
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
