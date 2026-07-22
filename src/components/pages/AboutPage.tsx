import { Button } from '@heroui/react';
import { Rocket, CheckCircle2, ShieldAlert, Heart, Copy } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-8 mt-4 md:mt-8 mb-10 max-w-5xl mx-auto px-2">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 h-[320px] flex items-center justify-center text-center px-6 shadow-xl">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-30 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">Về UTH Sync</h2>
          <p className="text-slate-200 text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed">Nền tảng đồng bộ hóa thời gian biểu và học tập thông minh, thiết kế tối ưu dành riêng cho sinh viên Đại học Giao thông Vận tải TP.HCM.</p>
        </div>
      </div>

      {/* Core Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-primary p-8 rounded-3xl border border-border-color shadow-sm text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Rocket width={32} height={32} />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-3">Sứ mệnh</h3>
          <p className="text-text-tertiary leading-relaxed">Đơn giản hóa việc quản lý lịch học và deadline, giúp sinh viên có thêm nhiều thời gian hơn cho sự nghiệp và cuộc sống cá nhân.</p>
        </div>
        <div className="bg-bg-primary p-8 rounded-3xl border border-border-color shadow-sm text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 width={32} height={32} />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-3">Tầm nhìn</h3>
          <p className="text-text-tertiary leading-relaxed">Xây dựng hệ sinh thái tiện ích toàn diện, trở thành công cụ không thể thiếu trong balo kỹ thuật số của mọi sinh viên.</p>
        </div>
        <div className="bg-bg-primary p-8 rounded-3xl border border-border-color shadow-sm text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShieldAlert width={32} height={32} />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-3">Bảo mật</h3>
          <p className="text-text-tertiary leading-relaxed">Dữ liệu cá nhân được mã hóa chuẩn quốc tế và lưu trữ hoàn toàn tại máy tính cá nhân của bạn. Riêng tư và an toàn tuyệt đối.</p>
        </div>
      </div>

      {/* Donate Section */}
      <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-10 md:p-14 text-white shadow-xl text-center mt-4">
        <Heart width={56} height={56} className="mx-auto mb-6 animate-bounce text-pink-200 drop-shadow-md" />
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Ủng hộ UTH Sync</h2>
        <p className="text-pink-100 font-medium text-lg max-w-xl mx-auto leading-relaxed">Sự đóng góp của bạn giúp duy trì máy chủ hoạt động ổn định và là động lực để phát triển thêm các tính năng tuyệt vời hơn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {/* Bank Transfer */}
        <div className="bg-bg-primary rounded-3xl p-8 border border-border-color shadow-sm text-center flex flex-col items-center">
          <h3 className="text-2xl font-bold text-text-primary mb-2">Chuyển khoản Ngân hàng</h3>
          <p className="text-text-tertiary text-sm mb-8">Sử dụng ứng dụng ngân hàng để quét mã QR</p>
          
          <div className="w-56 h-96 rounded-3xl mb-8 overflow-hidden bg-cover bg-center bg-ncentero-reapeat"
                style={{
              backgroundImage: 'url(/qr.jpg)'
            }}
          >
          </div>
          
          <div className="w-full bg-bg-secondary rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-tertiary">Ngân hàng</span>
              <span className="font-bold text-text-primary">MBBank</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-tertiary">Chủ tài khoản</span>
              <span className="font-bold text-text-primary">NGUYEN HOANG NAM</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-border-strong mt-1">
              <span className="text-text-tertiary">Số tài khoản</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg text-blue-600">0335574737</span>
                <button 
                  className="text-text-tertiary hover:text-text-primary" 
                  title="Copy"
                  onClick={() => {
                    navigator.clipboard.writeText('0335574737');
                    alert('Đã copy số tài khoản!');
                  }}
                ><Copy width={16} height={16}/></button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tiers */}
        <div className="flex flex-col justify-center gap-4">
          <h3 className="font-bold text-text-primary text-lg mb-2 px-2">Các mức ủng hộ đề xuất:</h3>
          
          <div className="bg-bg-primary rounded-2xl p-6 border border-border-color shadow-sm flex items-center gap-5 cursor-pointer hover:border-pink-300 hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center text-3xl shrink-0">☕</div>
            <div>
              <h4 className="font-bold text-text-primary text-lg">Cà phê 1 ly</h4>
              <p className="text-text-tertiary">20.000 VNĐ - Giúp dev có năng lượng code đêm.</p>
            </div>
          </div>
          
          <div className="bg-bg-primary rounded-2xl p-6 border border-border-color shadow-sm flex items-center gap-5 cursor-pointer hover:border-pink-300 hover:shadow-md hover:-translate-y-1 transition-all border-l-4 border-l-pink-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-pink-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">PHỔ BIẾN</div>
            <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center text-3xl shrink-0">🍕</div>
            <div>
              <h4 className="font-bold text-text-primary text-lg">Bữa ăn nhẹ</h4>
              <p className="text-text-tertiary">50.000 VNĐ - Hỗ trợ một phần chi phí server.</p>
            </div>
          </div>
          
          <div className="bg-bg-primary rounded-2xl p-6 border border-border-color shadow-sm flex items-center gap-5 cursor-pointer hover:border-pink-300 hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-3xl shrink-0">🚀</div>
            <div>
              <h4 className="font-bold text-text-primary text-lg">Nhà tài trợ</h4>
              <p className="text-text-tertiary">100.000+ VNĐ - Chung tay phát triển thêm nhiều tính năng mới.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-bg-primary rounded-3xl border border-border-color p-8 md:p-10 shadow-sm mt-4">
        <div className="flex items-center justify-between mb-8 border-b border-border-color pb-5">
          <div>
            <h3 className="text-2xl font-bold text-text-primary">Đội ngũ phát triển</h3>
            <p className="text-text-tertiary mt-1">Những người đứng sau dự án này</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 text-center sm:text-left">
          <div className="w-32 h-32 rounded-full bg-bg-tertiary overflow-hidden flex-shrink-0 border-4 border-blue-50 shadow-inner">
            <img src="https://ui-avatars.com/api/?name=hnamhocit&background=0D8ABC&color=fff&size=256" alt="Author" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h4 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">hnamhocit</h4>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg w-fit mx-auto sm:mx-0">Founder & Lead Developer</span>
            </div>
            <p className="text-text-secondary leading-relaxed max-w-2xl mb-4">
              "Tôi mong muốn tạo ra một sản phẩm giúp các bạn sinh viên giải quyết được bài toán hóc búa về việc theo dõi hàng tá deadline và lịch học thay đổi liên tục, từ đó nâng cao hiệu suất học tập."
            </p>
            <div className="flex gap-3 justify-center sm:justify-start">
              <Button 
                variant="ghost" 
                size="sm" 
                className="font-semibold text-text-secondary bg-bg-tertiary hover:bg-bg-tertiary"
                onPress={() => window.open('https://github.com/hnamhocit', '_blank')}
              >
                GitHub
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100"
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
