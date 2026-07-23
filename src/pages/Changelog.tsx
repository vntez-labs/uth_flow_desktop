import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { getVersion } from "@tauri-apps/api/app";

export default function Changelog() {
  const [markdown, setMarkdown] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [version, setVersion] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy version hiện tại để hiển thị
    getVersion().then(v => setVersion(v)).catch(console.error);

    // Fetch markdown từ Github (thêm query param để tránh bị cache)
    const CHANGELOG_URL = `https://raw.githubusercontent.com/hnamhocit/uth-sync/main/CHANGELOG.md?v=${Date.now()}`;
    
    fetch(CHANGELOG_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.text();
      })
      .then((text) => {
        setMarkdown(text);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi khi tải changelog:", err);
        setMarkdown("Không thể tải thông tin bản cập nhật. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.");
        setIsLoading(false);
      });
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-screen w-full flex-col bg-bg-secondary text-text-primary overflow-hidden"
    >
      <div className="flex items-center gap-4 p-6 border-b border-white/5 bg-bg-primary z-10 shadow-sm">
        <Button 
          isIconOnly
          variant="ghost" 
          onPress={() => navigate("/dashboard", { replace: true })}
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Có gì mới?</h1>
          <p className="text-sm text-text-tertiary">
            {version ? `Phiên bản hiện tại: v${version}` : "Thông tin bản cập nhật mới nhất"}
          </p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto bg-bg-primary rounded-2xl p-8 shadow-xl shadow-black/5 border border-white/5"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
              <p className="text-text-secondary font-medium">Đang tải thông tin bản cập nhật...</p>
            </div>
          ) : (
            <article className="prose prose-invert prose-blue max-w-none prose-headings:font-bold prose-a:text-blue-400 prose-img:rounded-xl">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdown}
              </ReactMarkdown>
            </article>
          )}
        </motion.div>
      </div>
      
      <div className="p-6 border-t border-white/5 bg-bg-primary flex justify-center z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Button 
          variant="primary" 
          size="lg"
          className="w-full max-w-md font-bold shadow-lg shadow-blue-500/20"
          onPress={() => navigate("/dashboard", { replace: true })}
        >
          Bắt đầu sử dụng
        </Button>
      </div>
    </motion.div>
  );
}
