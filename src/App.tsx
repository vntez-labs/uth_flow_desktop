"use client";

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Eye, EyeSlash } from "@gravity-ui/icons";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";

import { useUserStore } from "./stores/user.store";
import type { Account, Profile } from "./interfaces";
import Dashboard from "./components/Dashboard";

// Updater imports
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Progress } from "@heroui/react";

// Map API profile to our Profile interface
function mapProfile(data: any, fallbackMssv: string): Profile {
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

// Generate a gradient based on full name
function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color1 = `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
  const color2 = `hsl(${(Math.abs(hash) + 40) % 360}, 70%, 50%)`;
  return `linear-gradient(135deg, ${color1}, ${color2})`;
}

export default function App() {
  const { user, isLoggedIn, setAuth, clearAuth } = useUserStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedMssv, setSelectedMssv] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();

  // Updater states
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  // Kiểm tra cập nhật khi khởi động
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update) {
          setUpdateInfo(update);
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra cập nhật:", err);
      }
    };
    checkForUpdates();
  }, []);

  const handleUpdate = async () => {
    if (!updateInfo) return;
    setIsUpdating(true);
    let downloaded = 0;
    let contentLength = 0;
    try {
      await updateInfo.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setUpdateProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case 'Finished':
            setUpdateProgress(100);
            break;
        }
      });
      await relaunch();
    } catch (err) {
      console.error("Lỗi khi cài đặt bản cập nhật:", err);
      alert("Cập nhật thất bại. Vui lòng thử lại sau.");
      setIsUpdating(false);
    }
  };

  const autoLogin = async (mssv: string) => {
    setIsInitializing(true);
    try {
      const savedPass = await invoke<string>("get_saved_password", { mssv });
      const res: any = await invoke("login", { username: mssv, password: savedPass });
      const tk = res?.token || res?.body?.token || res;
      if (!tk) throw new Error("Lỗi API token");
      
      const savedProfile = await invoke<Profile>("get_profile_by_mssv", { mssv });
      if (!savedProfile) throw new Error("Lỗi Profile");

      await invoke("login_account", { username: mssv, password: savedPass });
      setAuth(typeof tk === 'string' ? tk : tk.token, savedProfile);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Auto login fail", err);
      // Tự động rớt về account selection nếu lỗi
      setSelectedMssv(mssv);
      navigate("/accounts", { replace: true });
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    // Always init on mount to renew token
    async function init() {
      try {
        const savedAccounts = await invoke<Account[]>("get_accounts");
        setAccounts(savedAccounts);
        
        const activeAccount = savedAccounts.find((acc: any) => acc.is_logged_in);
        if (activeAccount) {
          autoLogin(activeAccount.mssv);
        } else {
          setIsInitializing(false);
          if (savedAccounts.length > 0) {
            navigate("/accounts", { replace: true });
          } else {
            navigate("/login", { replace: true });
          }
        }
      } catch (err) {
        console.error("Failed to load accounts", err);
        setIsInitializing(false);
        navigate("/login", { replace: true });
      }
    }
    init();
  }, []); // Only on mount

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-bg-secondary gap-5">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-primary shadow-xl shadow-blue-500/10">
          <svg className="h-8 w-8 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-xl font-bold text-text-primary tracking-tight">UTH Sync</h2>
          <p className="text-sm font-medium text-text-tertiary">Đang đồng bộ dữ liệu hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <Routes>
      <Route path="/dashboard/*" element={
        (isLoggedIn && user) ? (
          <Dashboard 
            getGradient={getGradient}
            onLogout={() => {
              clearAuth();
              setIsInitializing(true);
              invoke<Account[]>("get_accounts").then(accs => {
                setAccounts(accs);
                setIsInitializing(false);
                navigate("/accounts", { replace: true });
              });
            }} 
          />
        ) : <Navigate to="/login" replace />
      } />

      <Route path="/accounts" element={
        <div
          className="relative flex h-screen w-full items-center justify-center bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(https://wallpaperaccess.com/full/5923908.jpg)" }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

          <div className="relative z-10 flex w-[400px] flex-col gap-8">
            <div className="text-center">
              <h1 className="bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-5xl font-extrabold tracking-tighter text-transparent drop-shadow-sm">
                UTH Sync<span className="text-blue-500">.</span>
              </h1>
              <p className="mt-3 text-sm font-medium tracking-wide text-white/70">
                Gọn gàng lịch học. Dứt điểm deadline.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <h2 className="mb-2 text-center text-lg font-semibold text-white">Chọn tài khoản</h2>
              {accounts.map(acc => (
                <div 
                  key={acc.mssv}
                  className="group relative flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 transition-all hover:border-white/30 hover:bg-black/40"
                >
                  <div 
                    className="flex flex-1 cursor-pointer items-center gap-4"
                    onClick={() => { setIsInitializing(true); autoLogin(acc.mssv); }}
                  >
                    <div 
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white shadow-inner"
                      style={{ background: getGradient(acc.full_name) }}
                    >
                      {acc.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-bold text-white">{acc.full_name}</p>
                      <p className="truncate text-sm text-white/60">{acc.mssv}</p>
                    </div>
                  </div>

                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm(`Bạn có chắc chắn muốn xoá tài khoản ${acc.full_name}?`)) {
                        await invoke("remove_account", { mssv: acc.mssv });
                        const updatedAccounts = await invoke<Account[]>("get_accounts");
                        setAccounts(updatedAccounts);
                        if (updatedAccounts.length === 0) navigate("/login", { replace: true });
                      }
                    }}
                    className="rounded-lg bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 opacity-0 transition-all hover:bg-red-500 hover:text-white group-hover:opacity-100"
                  >
                    Xoá
                  </button>
                </div>
              ))}
              <button 
                onClick={() => {
                  setSelectedMssv("");
                  navigate("/login");
                }}
                className="mt-2 w-full rounded-2xl bg-bg-primary/10 p-4 text-sm font-bold text-white transition-all hover:bg-bg-primary/20 active:scale-[0.98]"
              >
                + Đăng nhập tài khoản khác
              </button>
            </div>
          </div>
        </div>
      } />

      <Route path="/login" element={
        <div
          className="relative flex h-screen w-full items-center justify-center bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(https://wallpaperaccess.com/full/5923908.jpg)" }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
          <div className="relative z-10 flex w-[400px] flex-col gap-8">
            <div className="text-center">
              <h1 className="bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-5xl font-extrabold tracking-tighter text-transparent drop-shadow-sm">
                UTH Sync<span className="text-blue-500">.</span>
              </h1>
              <p className="mt-3 text-sm font-medium tracking-wide text-white/70">
                Gọn gàng lịch học. Dứt điểm deadline.
              </p>
            </div>
            <LoginForm 
              initialUsername={selectedMssv}
              onSuccess={(t, p) => { setAuth(t, p); navigate("/dashboard", { replace: true }); }}
              onBack={accounts.length > 0 ? () => navigate("/accounts") : undefined}
            />
          </div>
        </div>
      } />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
    </Routes>

    {/* Modal Cập Nhật */}
    <Modal isOpen={!!updateInfo} isDismissable={!isUpdating} isKeyboardDismissDisabled={isUpdating} hideCloseButton={isUpdating} onClose={() => setUpdateInfo(null)}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Bản cập nhật mới (v{updateInfo?.version})
            </ModalHeader>
            <ModalBody>
              {!isUpdating ? (
                <>
                  <p>Có một phiên bản mới của UTH Sync. Bạn có muốn tải xuống và cài đặt ngay không?</p>
                  {updateInfo?.body && (
                    <div className="mt-2 p-3 bg-bg-secondary rounded-lg text-sm text-text-secondary whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {updateInfo.body}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-4 py-4">
                  <p className="text-center font-medium">Đang tải và cài đặt cập nhật...</p>
                  <Progress 
                    aria-label="Đang tải..."
                    value={updateProgress}
                    color="primary"
                    showValueLabel={true}
                    className="max-w-md"
                  />
                  <p className="text-xs text-center text-text-tertiary mt-2">Vui lòng không tắt ứng dụng trong quá trình này.</p>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              {!isUpdating && (
                <>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Để sau
                  </Button>
                  <Button color="primary" onPress={handleUpdate}>
                    Cập nhật ngay
                  </Button>
                </>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
    </>
  );
}

function LoginForm({ 
  onSuccess, 
  onBack, 
  initialUsername = "" 
}: { 
  onSuccess: (t: string, p: Profile) => void;
  onBack?: () => void;
  initialUsername?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Get token from API
      const res: any = await invoke("login", { username, password });
      const token = res?.token || res?.body?.token || res;
      if (!token) throw new Error("Không nhận được token từ server");

      // 2. Get profile data from API
      const userRes: any = await invoke("get_summary_profile", { token: typeof token === 'string' ? token : token.token });
      const rawProfile = userRes?.body || userRes?.data || userRes;
      const profile = mapProfile(rawProfile, username);

      console.log(rawProfile)

      const fullName = (profile.ho_dem && profile.ten) 
        ? `${profile.ho_dem} ${profile.ten}` 
        : username;

      // 3. Save account logic in Rust (with password stored securely) - MUST BE DONE BEFORE create_profile because of FOREIGN KEY
      await invoke("add_account", { 
        mssv: username, 
        fullName: fullName, 
        password 
      });

      // 4. Save profile (and automatically fetch avatar bytes to save as BLOB in Rust)
      await invoke("create_profile", { profile, token: typeof token === 'string' ? token : token.token });

      // 5. Fetch fully hydrated profile from DB (now includes base64 avatar)
      const savedProfile = await invoke<Profile>("get_profile_by_mssv", { mssv: username });

      onSuccess(typeof token === 'string' ? token : token.token, savedProfile);
    } catch (e: any) {
      console.log("Login Error", e);
      alert("Đăng nhập thất bại: " + (typeof e === 'string' ? e : JSON.stringify(e)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Mã số sinh viên"
          value={username}
          onChange={(e) => {
            const val = e.target.value;
            if (val.startsWith(" ")) return;
            setUsername(val);
          }}
          required
          className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white placeholder-white/40 outline-none transition-all focus:border-white/30 focus:bg-black/30"
        />

        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => {
              const val = e.target.value;
              if (val.startsWith(" ")) return;
              setPassword(val);
            }}
            required
            className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 pr-12 text-sm text-white placeholder-white/40 outline-none transition-all focus:border-white/30 focus:bg-black/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white"
          >
            {showPassword ? <EyeSlash width={18} height={18} /> : <Eye width={18} height={18} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-bg-primary p-4 text-sm font-bold text-black transition-all hover:bg-gray-200 active:scale-[0.98] disabled:bg-bg-primary/50 disabled:active:scale-100"
        >
          {isLoading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
        
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="w-full rounded-2xl p-4 text-sm font-bold text-white/70 transition-all hover:bg-bg-primary/5 active:scale-[0.98]"
          >
            Quay lại chọn tài khoản
          </button>
        )}
      </div>
    </form>
  );
}
