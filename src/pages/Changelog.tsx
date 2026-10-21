import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@heroui/react";
import { IconArrowLeft } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { getVersion } from "@tauri-apps/api/app";

const MotionDiv = motion.div as any;

export default function Changelog() {
  const [markdown, setMarkdown] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [version, setVersion] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    getVersion().then(v => setVersion(v)).catch(console.error);

    const CHANGELOG_URL = `https://raw.githubusercontent.com/vntez-labs/uth_flow_desktop/main/CHANGELOG.md?v=${Date.now()}`;
    
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
    <MotionDiv 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-screen w-full flex-col bg-bg-secondary text-text-primary overflow-hidden"
    >
      <div className="flex items-center gap-4 p-5 sm:p-6 border-b border-border-color bg-bg-primary z-10 shadow-xs">
        <Button 
          isIconOnly
          variant="ghost" 
          className="rounded-xl cursor-pointer"
          onPress={() => navigate("/dashboard", { replace: true })}
        >
          <IconArrowLeft className="w-5 h-5 text-text-secondary" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">Có gì mới?</h1>
          <p className="text-xs sm:text-sm text-text-tertiary">
            {version ? `Phiên bản hiện tại: v${version}` : "Thông tin bản cập nhật mới nhất"}
          </p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 custom-scrollbar">
        <MotionDiv 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto bg-bg-primary rounded-3xl p-6 sm:p-10 shadow-sm border border-border-color"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-[#008689] border-t-transparent animate-spin"></div>
              <p className="text-text-tertiary font-medium text-sm">Đang tải thông tin bản cập nhật...</p>
            </div>
          ) : (
            <article className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-[#008689] dark:prose-a:text-[#2DD4BF] prose-img:rounded-2xl">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdown}
              </ReactMarkdown>
            </article>
          )}
        </MotionDiv>
      </div>
      
      <div className="p-4 sm:p-6 border-t border-border-color bg-bg-primary flex justify-center z-10 shadow-xs">
        <Button 
          size="lg"
          className="w-full max-w-md font-bold bg-[#008689] hover:bg-[#006f72] text-white shadow-md shadow-teal-500/20 rounded-xl cursor-pointer"
          onPress={() => navigate("/dashboard", { replace: true })}
        >
          Bắt đầu sử dụng
        </Button>
      </div>
    </MotionDiv>
  );
}
