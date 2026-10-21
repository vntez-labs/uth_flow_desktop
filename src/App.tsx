"use client";

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { IconEye, IconEyeOff, IconArrowLeft } from "@tabler/icons-react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { getVersion } from "@tauri-apps/api/app";

import { useUserStore } from "./stores/user.store";
import type { Account, Profile } from "./interfaces";
import Dashboard from "./components/Dashboard";

// Updater imports
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

import Changelog from "./pages/Changelog";

// Map API profile to our Profile interface
import { mapProfile, getGradient } from './utils';

export default function App() {
  const { user, isLoggedIn, setAuth, clearAuth } = useUserStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedMssv, setSelectedMssv] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();

  // Updater states
  const [updateReady, setUpdateReady] = useState(false);

  // Force Light Mode: Warm soothing palette
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);

  // Kiểm tra cập nhật khi khởi động
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update) {
          await update.downloadAndInstall((_event: any) => {
            // progress tracking
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
          setAuth("offline-token", savedProfile);
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch (offlineErr) {
        console.error("Offline fallback failed", offlineErr);
      }
      
      setSelectedMssv(mssv);
      navigate("/accounts", { replace: true });
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
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
  }, []);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-bg-secondary gap-5">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-primary border border-border-color shadow-lg shadow-teal-500/10">
          <svg className="h-8 w-8 animate-spin text-[#008689]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-xl font-bold text-text-primary tracking-tight">UTH Flow</h2>
          <p className="text-sm font-medium text-text-tertiary">Đang đồng bộ dữ liệu hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    {updateReady && (
      <div 
        className="fixed top-0 left-0 w-full z-[9999] bg-[#008689] text-white px-4 py-2.5 text-center text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity shadow-md"
        onClick={async () => {
          try {
            await relaunch();
          } catch (e) {
            console.error("Lỗi khi khởi động lại:", e);
          }
        }}
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

      {/* ACCOUNTS SELECTION SCREEN */}
      <Route path="/accounts" element={
        <div className="relative min-h-screen w-full flex items-center justify-center bg-bg-secondary p-4 overflow-hidden">
          <div className="relative z-10 w-full max-w-[400px] rounded-3xl bg-bg-primary border border-border-color shadow-sm p-6 sm:p-7 flex flex-col gap-5">
            <div className="text-center flex flex-col items-center">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-[#008689] to-[#005E60] p-2 shadow-md shadow-teal-500/20 mb-3 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="UTH Flow"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-text-primary font-heading">
                UTH Flow
              </h1>
              <p className="mt-0.5 text-xs font-semibold text-[#008689]">
                Dự án mã nguồn mở hỗ trợ xem lịch học
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[11px] font-medium text-text-primary">
                <span>Mã nguồn mở • Hỗ trợ sinh viên UTH</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-0.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  Tài khoản đã lưu ({accounts.length})
                </h2>
              </div>

              <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                {accounts.map(acc => (
                  <div 
                    key={acc.mssv}
                    className="group relative flex items-center justify-between gap-3 rounded-2xl border border-border-color bg-bg-secondary p-3 transition-all hover:border-[#008689]/40 hover:shadow-xs"
                  >
                    <div 
                      className="flex flex-1 cursor-pointer items-center gap-3 min-w-0"
                      onClick={() => { setIsInitializing(true); autoLogin(acc.mssv); }}
                    >
                      <div 
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-xs"
                        style={{ background: getGradient(acc.full_name) }}
                      >
                        {acc.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate font-bold text-xs text-text-primary">{acc.full_name}</p>
                        <p className="truncate text-[11px] text-text-tertiary font-mono">{acc.mssv}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Bạn có chắc chắn muốn xoá tài khoản ${acc.full_name}?`)) {
                          await invoke("remove_account", { mssv: acc.mssv });
                          const updatedAccounts = await invoke<Account[]>("get_accounts");
                          setAccounts(updatedAccounts);
                          if (updatedAccounts.length === 0) navigate("/login", { replace: true });
                        }
                      }}
                      className="rounded-lg px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      Xoá
                    </button>
                  </div>
                ))}
              </div>

              <button 
                type="button"
                onClick={() => {
                  setSelectedMssv("");
                  navigate("/login");
                }}
                className="mt-1 w-full rounded-xl border border-border-strong bg-bg-secondary p-2.5 text-xs font-bold text-text-primary transition-all hover:bg-bg-tertiary active:scale-[0.98] cursor-pointer"
              >
                + Đăng nhập tài khoản khác
              </button>
            </div>
          </div>
        </div>
      } />

      {/* LOGIN SCREEN */}
      <Route path="/login" element={
        <div className="relative min-h-screen w-full flex items-center justify-center bg-bg-secondary p-4 overflow-hidden">
          <div className="relative z-10 w-full max-w-[400px] rounded-3xl bg-bg-primary border border-border-color shadow-sm p-6 sm:p-7 flex flex-col gap-5">
            {/* Branding matching mobile */}
            <div className="text-center flex flex-col items-center">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-[#008689] to-[#005E60] p-2 shadow-md shadow-teal-500/20 mb-3 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="UTH Flow"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-text-primary font-heading">
                UTH Flow
              </h1>
              <p className="mt-0.5 text-xs font-semibold text-[#008689]">
                Dự án mã nguồn mở hỗ trợ xem lịch học
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[11px] font-medium text-text-primary">
                <span>Mã nguồn mở • Hỗ trợ sinh viên UTH</span>
              </div>
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

            <p className="text-[11px] text-center text-text-tertiary">
              🔒 Thông tin đăng nhập được mã hóa an toàn cục bộ trên máy tính
            </p>
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

      const fullName = (profile.ho_dem && profile.ten) 
        ? `${profile.ho_dem} ${profile.ten}` 
        : username;

      // 3. Save account logic in Rust (with password stored securely)
      await invoke("add_account", { 
        mssv: username, 
        fullName: fullName, 
        password 
      });

      // 4. Save profile
      await invoke("create_profile", { profile, token: typeof token === 'string' ? token : token.token });

      // 5. Fetch fully hydrated profile from DB
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
    <form onSubmit={handleLogin} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            Mã số sinh viên
          </label>
          <input
            type="text"
            placeholder="VD: 2251120042"
            value={username}
            onChange={(e) => {
              const val = e.target.value;
              if (val.startsWith(" ")) return;
              setUsername(val);
            }}
            required
            className="w-full rounded-xl border border-border-strong bg-bg-secondary px-3.5 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-all focus:border-[#008689] focus:ring-2 focus:ring-[#008689]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            Mật khẩu Portal
          </label>
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu tài khoản sinh viên"
              value={password}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith(" ")) return;
                setPassword(val);
              }}
              required
              className="w-full rounded-xl border border-border-strong bg-bg-secondary px-3.5 py-3 pr-11 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-all focus:border-[#008689] focus:ring-2 focus:ring-[#008689]/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
            >
              {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-500/10 p-3 text-center text-xs font-medium text-red-500 border border-red-500/20">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-[#008689] hover:bg-[#006f72] p-3 text-sm font-bold text-white shadow-md shadow-teal-500/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? "Đang xác thực..." : "Đăng nhập"}
        </button>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-border-color bg-bg-secondary p-2.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <IconArrowLeft size={15} /> Quay lại danh sách tài khoản
          </button>
        )}
      </div>
    </form>
  );
}
