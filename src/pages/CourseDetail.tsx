import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useUserStore } from "../stores/user.store";
import { ArrowLeft } from "@gravity-ui/icons";
import { 
  FileText, Link, FileCheck, Video, HelpCircle, FileBox, Presentation, Users, Folder, LayoutGrid, CalendarCheck
} from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";

// Helper for mapping plugins to icons
const getPluginIcon = (plugin: string) => {
  switch (plugin) {
    case 'mod_resource': return <FileText className="text-blue-500 w-5 h-5" />;
    case 'mod_url': return <Link className="text-green-500 w-5 h-5" />;
    case 'mod_assign': return <FileCheck className="text-orange-500 w-5 h-5" />;
    case 'mod_quiz': return <HelpCircle className="text-purple-500 w-5 h-5" />;
    case 'mod_folder': return <Folder className="text-yellow-500 w-5 h-5" />;
    case 'mod_label': return <FileBox className="text-gray-500 w-5 h-5" />;
    case 'mod_googlemeet': return <Video className="text-red-500 w-5 h-5" />;
    case 'mod_lesson': return <Presentation className="text-indigo-500 w-5 h-5" />;
    case 'mod_forum': return <Users className="text-teal-500 w-5 h-5" />;
    case 'mod_attendance': return <CalendarCheck className="text-pink-500 w-5 h-5" />;
    default: return <FileText className="text-gray-400 w-5 h-5" />;
  }
};

const stripColors = (html: string) => {
  if (!html) return "";
  // Xóa bỏ các thuộc tính color, background-color inline hoặc thẻ font color do giáo viên Moodle set cứng
  return html
    .replace(/color\s*:\s*[^;"]+;?/gi, "")
    .replace(/background-color\s*:\s*[^;"]+;?/gi, "")
    .replace(/color\s*=\s*"[^"]+"/gi, "");
};

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();
  
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchCourseDetails() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const username = user?.mssv || (user as any)?.username;
        const res: any = await invoke("get_moodle_course_contents", { username, courseId: Number(id) });
        if (ignore) return;
        
        let parsed = res;
        // Moodle core_courseformat_get_state returns an array where the first item has { error, data: "stringified json" }
        if (Array.isArray(res) && res.length > 0) {
          const item = res[0];
          if (item.error) {
             throw item.exception || item.error;
          }
          if (item.data) {
             parsed = typeof item.data === "string" ? JSON.parse(item.data) : item.data;
          }
        } else if (res?.data) {
          parsed = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
        }
        
        setCourseData(parsed);
      } catch (err: any) {
        if (ignore) return;
        console.error("Course detail error:", err);
        setError(typeof err === "object" ? JSON.stringify(err, null, 2) : String(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchCourseDetails();
    return () => { ignore = true; };
  }, [id, user]);

  const [openingModule, setOpeningModule] = useState<string | null>(null);
  const [updatingActivity, setUpdatingActivity] = useState<string | null>(null);

  const handleToggleCompletion = async (e: React.MouseEvent, cmInfo: any) => {
    e.stopPropagation();
    try {
      setUpdatingActivity(cmInfo.id);
      const username = user?.mssv || (user as any)?.username;
      
      const isCurrentlyDone = cmInfo.completionstate === 1 || cmInfo.completionstate === 2 || cmInfo.iscomplete;
      const newStatus = !isCurrentlyDone;
      
      await invoke("mark_moodle_activity_done", {
        username,
        cmid: Number(cmInfo.id),
        completed: newStatus
      });
      
      setCourseData((prev: any) => {
        if (!prev) return prev;
        const newData = JSON.parse(JSON.stringify(prev));
        const cm = newData.cm.find((c: any) => c.id === cmInfo.id);
        if (cm) {
            cm.completionstate = newStatus ? 1 : 0;
            cm.iscomplete = newStatus;
        }
        return newData;
      });
      
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingActivity(null);
    }
  };

  const handleOpenModule = async (module: any) => {
    if (!module.url) return;
    
    try {
      setOpeningModule(module.id);
      const username = user?.mssv || (user as any)?.username;
      
      // Giải mã link thật (bypass trang view.php của Moodle)
      const resolvedUrl: string = await invoke("resolve_moodle_link", { username, url: module.url });
      
      // Bỏ forcedownload=1 để trình duyệt nhúng có thể xem trực tiếp PDF thay vì tải về (Tauri thường chặn tải về)
      const cleanUrl = resolvedUrl.replace("forcedownload=1", "");

      // Nếu là link ngoài (Google Meet, Zalo, Drive...) -> Mở bằng trình duyệt hệ thống
      if (!cleanUrl.includes("courses.ut.edu.vn")) {
        await openUrl(cleanUrl);
        return;
      }


      // Nếu là link nội bộ (Moodle) -> Mở bằng WebviewWindow và tự động điền form đăng nhập nếu bị văng ra
      await invoke("create_auto_login_webview", { 
        url: cleanUrl, 
        username,
        title: module.name ? stripColors(module.name) : "UTH Moodle"
      });
      
    } catch (err) {
      console.error("Lỗi resolve link:", err);
      if (module.url) openUrl(module.url); // Fallback
    } finally {
      setOpeningModule(null);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-secondary overflow-auto">
      <div className="flex items-center gap-4 p-4 border-b border-border-color bg-bg-primary">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-bg-secondary transition-colors"
        >
          <ArrowLeft width={24} height={24} className="text-text-primary" />
        </button>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-blue-500" /> Chi tiết khóa học
        </h1>
      </div>
      
      <div className="flex-1 p-4 md:p-8 w-full max-w-5xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-text-tertiary font-medium">Đang đồng bộ dữ liệu khóa học...</p>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 bg-red-500/10 rounded-xl whitespace-pre-wrap font-mono text-sm border border-red-500/20 shadow-sm">
            Lỗi tải dữ liệu: {error}
          </div>
        ) : !courseData?.section ? (
           <div className="text-text-secondary text-center p-8 bg-bg-secondary rounded-2xl border border-border-color border-dashed">
             <LayoutGrid className="w-8 h-8 text-text-tertiary mx-auto mb-2 opacity-50" />
             <p>Không có dữ liệu khóa học.</p>
           </div>
        ) : (
          <div className="flex flex-col gap-10 pb-10">
            {courseData.section.map((sec: any, index: number) => {
              if (index !== 0 && (!sec.cmlist || sec.cmlist.length === 0)) return null;

              return (
                <div key={index.toString()} className="flex flex-col gap-4">
                  {/* Tiêu đề Section */}
                  <div className="flex flex-col gap-1">
                    <h2 
                      className="text-2xl font-bold text-text-primary"
                      dangerouslySetInnerHTML={{ __html: sec.title || (index === 0 ? "Thông tin chung" : `Tuần ${index}`) }}
                    />
                    {sec.summary && (
                      <div 
                        className="text-sm text-text-secondary mt-1 prose prose-sm dark:prose-invert max-w-none" 
                        dangerouslySetInnerHTML={{ __html: sec.summary }} 
                      />
                    )}
                  </div>

                  {/* Danh sách items (Course Modules) */}
                  <div className="flex flex-col gap-3">
                    {sec.cmlist && sec.cmlist.length > 0 ? (
                      sec.cmlist.map((cmId: string) => {
                        const cmInfo = courseData.cm.find((c: any) => c.id === cmId);
                        if (!cmInfo) return null;

                        // Helper function to safely extract label content
                        const getLabelContent = (cm: any) => {
                          if (cm.description && cm.description.trim() !== '') return cm.description;
                          if (cm.purpose && cm.purpose.trim() !== '') return cm.purpose;
                          if (cm.content && cm.content.trim() !== '') return cm.content;
                          if (cm.customdata && cm.customdata.trim() !== '') {
                             try {
                               const parsed = JSON.parse(cm.customdata);
                               if (parsed.text) return parsed.text;
                               if (parsed.content) return parsed.content;
                               if (parsed.description) return parsed.description;
                               if (parsed.summary) return parsed.summary;
                               // If it's a JSON but has no known text field, don't return the raw JSON string
                             } catch (e) {
                               // Not JSON, return as string
                               return cm.customdata;
                             }
                          }
                          return cm.name; // Fallback to name which might be truncated
                        };

                        // Mod_label là một đoạn text / thông báo, ko phải là thẻ click
                        if (cmInfo.plugin === 'mod_label') {
                          return (
                            <div key={cmId} className="p-4 bg-bg-primary rounded-2xl border border-border-color mt-2 mb-1 overflow-hidden shadow-sm">
                               <div 
                                 className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-text-primary break-words whitespace-pre-wrap"
                                 dangerouslySetInnerHTML={{ __html: stripColors(getLabelContent(cmInfo)) }} 
                               />
                            </div>
                          );
                        }
                        
                        // Các item thông thường (bài tập, slide, link...)
                        return (
                          <div 
                            key={cmId}
                            onClick={() => handleOpenModule(cmInfo)}
                            className="group flex items-center gap-4 p-4 rounded-2xl bg-bg-primary border border-border-color shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
                          >
                            <div className="flex-shrink-0 bg-bg-primary p-3 rounded-xl shadow-inner group-hover:scale-105 transition-transform duration-300">
                              {getPluginIcon(cmInfo.plugin)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p 
                                className="text-base font-semibold text-text-primary group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" 
                                dangerouslySetInnerHTML={{ __html: stripColors(cmInfo.name) }}
                              />
                              <p className="text-xs text-text-tertiary mt-1 font-medium tracking-wide uppercase">
                                {cmInfo.plugin.replace('mod_', '')}
                              </p>
                            </div>
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                               {openingModule === cmId ? (
                                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                  </div>
                               ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <ArrowLeft className="w-4 h-4 text-blue-500 rotate-135 transform" style={{ transform: "rotate(135deg)" }} />
                                  </div>
                               )}
                            </div>
                            
                            {/* Trạng thái hoàn thành (Completion Status) */}
                            {(cmInfo.hascompletion || cmInfo.completion > 0 || cmInfo.completionstate !== undefined) && (
                              <div 
                                className="flex-shrink-0 flex items-center pl-2 border-l border-border-color/50 ml-2"
                                onClick={(e) => {
                                  // Nếu là tự động (isautomatic), không cho click
                                  if (cmInfo.isautomatic) return;
                                  handleToggleCompletion(e, cmInfo);
                                }}
                              >
                                {updatingActivity === cmInfo.id ? (
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                  </div>
                                ) : (cmInfo.completionstate === 1 || cmInfo.completionstate === 2 || cmInfo.iscomplete) ? (
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${!cmInfo.isautomatic ? 'cursor-pointer hover:bg-green-500/30 bg-green-500/20 text-green-500' : 'bg-green-500/20 text-green-500'}`} title={!cmInfo.isautomatic ? "Đánh dấu chưa hoàn thành" : "Đã hoàn thành"}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                  </div>
                                ) : (cmInfo.completionstate === 3 || cmInfo.isfail) ? (
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${!cmInfo.isautomatic ? 'cursor-pointer hover:bg-red-500/30 bg-red-500/20 text-red-500' : 'bg-red-500/20 text-red-500'}`} title={!cmInfo.isautomatic ? "Đánh dấu hoàn thành" : "Không đạt"}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                  </div>
                                ) : (
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${!cmInfo.isautomatic ? 'cursor-pointer hover:bg-red-500/10 border-2 border-dashed border-red-400 text-red-400' : 'border-2 border-dashed border-gray-400/50 text-gray-400'}`} title={!cmInfo.isautomatic ? "Đánh dấu hoàn thành" : "Chưa hoàn thành"}>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 bg-bg-secondary/50 rounded-2xl border border-dashed border-border-color flex items-center gap-2 text-text-tertiary text-sm">
                        <Folder className="w-4 h-4" />
                        Chưa có tài liệu hoặc hoạt động nào trong phần này.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
