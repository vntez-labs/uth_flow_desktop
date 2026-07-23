"use client";

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Eye, EyeSlash } from "@gravity-ui/icons";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { getVersion } from "@tauri-apps/api/app";

import { useUserStore } from "./stores/user.store";
import type { Account, Profile } from "./interfaces";
import Dashboard from "./components/Dashboard";

// Updater imports
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
// no unused imports

import Changelog from "./pages/Changelog";

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
  const [updateReady, setUpdateReady] = useState(false);

  // Kiểm tra cập nhật khi khởi động
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update) {
          // Tải xuống ngầm
          await update.downloadAndInstall((event: any) => {
            // Có thể track log ở đây nếu muốn
          });
          setUpdateReady(true);
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra cập nhật:", err);
      }
    };
    checkForUpdates();
  }, []);

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
      
      try {
        const currentVersion = await getVersion();
        const lastVersion = localStorage.getItem("appVersion");
        if (lastVersion && lastVersion !== currentVersion) {
          localStorage.setItem("appVersion", currentVersion);
          navigate("/changelog", { replace: true });
        } else {
          localStorage.setItem("appVersion", currentVersion);
          navigate("/dashboard", { replace: true });
        }
      } catch (e) {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Auto login fail, trying offline mode", err);
      try {
        const savedProfile = await invoke<Profile>("get_profile_by_mssv", { mssv });
        if (savedProfile) {
          // Offline mode
          setAuth("offline-token", savedProfile);
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch (offlineErr) {
        console.error("Offline fallback failed", offlineErr);
      }
      
      // Tự động rớt về account selection nếu không thể offline
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
    {updateReady && (
      <div 
        className="fixed top-0 left-0 w-full z-[9999] bg-yellow-400 text-black px-4 py-2.5 text-center text-sm font-bold cursor-pointer hover:bg-yellow-500 transition-colors shadow-md"
        onClick={() => relaunch()}
      >
        ✨ Đã tải xong bản cập nhật mới! Nhấn vào đây để khởi động lại ngay.
      </div>
    )}
    <Routes>
      <Route path="/changelog" element={<Changelog />} />
      <Route path="/dashboard/*" element={
        (isLoggedIn && user) ? (
          <Dashboard 
            getGradient={getGradient}
            onLogout={async () => {
              clearAuth();
              setIsInitializing(true);
              if (user?.mssv) {
                try {
                  await invoke("logout_account", { mssv: user.mssv });
                } catch (e) {
                  console.error(e);
                }
              }
              const accs = await invoke<Account[]>("get_accounts");
              setAccounts(accs);
              setIsInitializing(false);
              navigate("/accounts", { replace: true });
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
              onSuccess={async (t, p) => { 
                setAuth(t, p); 
                try {
                  const currentVersion = await getVersion();
                  const lastVersion = localStorage.getItem("appVersion");
                  if (lastVersion && lastVersion !== currentVersion) {
                    localStorage.setItem("appVersion", currentVersion);
                    navigate("/changelog", { replace: true });
                  } else {
                    localStorage.setItem("appVersion", currentVersion);
                    navigate("/dashboard", { replace: true });
                  }
                } catch (e) {
                  navigate("/dashboard", { replace: true });
                }
              }}
              onBack={accounts.length > 0 ? () => navigate("/accounts") : undefined}
            />
          </div>
        </div>
      } />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
    </Routes>
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
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

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
      setErrorMsg("Đăng nhập thất bại. Kiểm tra lại kết nối mạng hoặc mật khẩu.");
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

      {errorMsg && (
        <div className="rounded-xl bg-red-500/10 p-3 text-center text-sm font-medium text-red-500 border border-red-500/20">
          {errorMsg}
        </div>
      )}

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
