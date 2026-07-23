import type { Profile } from "../interfaces";

// Generate a gradient based on full name
export function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color1 = `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
  const color2 = `hsl(${(Math.abs(hash) + 40) % 360}, 70%, 50%)`;
  return `linear-gradient(135deg, ${color1}, ${color2})`;
}

// Map API profile to our Profile interface
export function mapProfile(data: any, fallbackMssv: string): Profile {
  const mssv = data?.mssv || data?.maSinhVien || data?.maSV || data?.userName || fallbackMssv;
  return {
    mssv,
    ho_dem: data?.hoDem || data?.ho_dem || null,
    ten: data?.ten || null,
    avatar: null, // Will be fetched & saved in Rust
    email: data?.email || null,
    so_dien_thoai: data?.soDienThoai || data?.so_dien_thoai || null,
    ngay_sinh: data?.ngaySinh || data?.ngaySinh2 || data?.ngay_sinh || null,
    noi_sinh: data?.noiSinh || data?.noiSinhTinh || data?.noi_sinh || null,
    gioi_tinh: data?.gioiTinh ?? data?.gioi_tinh ?? null,
    khoa: data?.khoa || null,
    khoa_hoc: data?.khoaHoc || data?.khoa_hoc || null,
    nganh: data?.nganh || null,
    chuyen_nganh: data?.chuyenNganh || data?.chuyen_nganh || null,
    he_dao_tao: data?.heDaoTao || data?.he_dao_tao || null,
    loai_hinh_dt: data?.loaiHinhDt || data?.loaiHinhDT || data?.loai_hinh_dt || null,
  };
}

export function getStudentYear(khoaHoc?: string) {
  if (!khoaHoc) return "";
  const year = parseInt(khoaHoc, 10);
  if (isNaN(year)) return "";
  const currentYear = new Date().getFullYear();
  const studentYear = currentYear - year + 1;
  return studentYear > 0 ? `Sinh viên năm ${studentYear}` : "Tân sinh viên";
}
