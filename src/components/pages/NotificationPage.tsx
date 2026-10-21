import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { IconBell, IconChevronLeft, IconChevronRight, IconFileText, IconFilter } from '@tabler/icons-react';
import { Modal, Button } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import MarkdownNote from '../MarkdownNote';
import { useUserStore } from '../../stores/user.store';

interface Category {
  id: number;
  tenDanhMuc: string;
}

interface Notification {
  id: number;
  tieuDe: string;
  hinhDaiDien: string | null;
  ngayHienThi: string;
}

export default function NotificationPage() {
  const { token } = useUserStore();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const handleViewNotification = async (notifId: number) => {
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const res: any = await invoke('fetch_portal_get', { 
        token, 
        endpoint: `notification/${notifId}` 
      });
      if (res?.success && res?.body) {
        const body = res.body;
        const match = body.noiDung?.match(/href=['"](.*?)['"]/);
        if (match && match[1]) {
          let finalUrl = match[1];
          const eventMatch = finalUrl.match(/\/event\/(\d+)/);
          
          setIsModalOpen(false); // Close the notification modal
          
          if (eventMatch && eventMatch[1]) {
            navigate(`/dashboard/event/${eventMatch[1]}`);
          } else {
            if (!finalUrl.startsWith('http')) {
              finalUrl = finalUrl.startsWith('/') ? `https://portal.ut.edu.vn${finalUrl}` : `https://portal.ut.edu.vn/${finalUrl}`;
            }
            import('@tauri-apps/plugin-opener').then(({ openUrl }) => {
               openUrl(finalUrl).catch(console.error);
            });
          }
        } else {
          setSelectedNotification(body);
        }
      } else {
        console.error("Failed to fetch notification details:", res);
        setSelectedNotification(null);
      }
    } catch (err) {
      console.error(err);
      setSelectedNotification(null);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res: any = await invoke('fetch_portal_get', { 
        token, 
        endpoint: 'notification/category' 
      });
      if (res?.success && res.body) {
        setCategories(res.body);
      }
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const fetchNotifications = async (catId: number | null, pageNum: number, size: number) => {
    setLoading(true);
    try {
      let endpoint = `notification?page=${pageNum + 1}&size=${size}`;
      if (catId !== null) {
        endpoint = `notification?categoryId=${catId}&page=${pageNum + 1}&size=${size}`;
      }
      const res: any = await invoke('fetch_portal_get', { 
        token, 
        endpoint
      });
      if (res?.success && res.body) {
        setNotifications(res.body.content || []);
        setTotalPages(res.body.totalPages || 1);
        setTotalElements(res.body.totalElements || 0);
      }
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchNotifications(selectedCategory, page, pageSize);
  }, [selectedCategory, page, pageSize]);

  const handleCategorySelect = (id: number | null) => {
    setSelectedCategory(id);
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col gap-6 mt-4 md:mt-8 mb-10 max-w-5xl mx-auto px-2">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar - Categories */}
        <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">
          <div className="bg-bg-primary rounded-3xl p-6 border border-border-color shadow-sm">
            <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <IconFilter size={20} className="text-[#008689] dark:text-[#2DD4BF]" />
              Danh mục
            </h3>
            <div className="flex flex-col gap-1.5">
              <button 
                onClick={() => handleCategorySelect(null)}
                className={`text-left px-4 py-3 rounded-2xl transition-all font-semibold text-sm cursor-pointer ${selectedCategory === null ? 'bg-[#008689] text-white shadow-xs' : 'text-text-secondary hover:bg-bg-secondary'}`}
              >
                Tất cả thông báo
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`text-left px-4 py-3 rounded-2xl transition-all font-semibold text-sm cursor-pointer ${selectedCategory === cat.id ? 'bg-[#008689] text-white shadow-xs' : 'text-text-secondary hover:bg-bg-secondary'}`}
                >
                  {cat.tenDanhMuc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Notifications List */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-bg-primary rounded-3xl p-6 md:p-8 border border-border-color shadow-sm min-h-[500px] flex flex-col">
            <div className="flex flex-col gap-4 border-b border-border-color pb-4 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                  <IconBell size={24} className="text-[#008689] dark:text-[#2DD4BF]" />
                  Thông báo
                </h2>
                <span className="text-text-tertiary text-sm font-medium">Tổng cộng {totalElements}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary font-medium">Hiển thị:</span>
                  <select 
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(0);
                    }}
                    className="bg-bg-secondary border border-border-strong text-text-primary text-sm rounded-xl focus:ring-2 focus:ring-[#008689]/20 focus:border-[#008689] block px-3 py-1.5 outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                
                {/* Pagination */}
                {!loading && totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center border border-border-color bg-bg-primary text-text-secondary hover:bg-bg-secondary hover:text-[#008689] dark:hover:text-[#2DD4BF] disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <IconChevronLeft size={16} />
                    </button>
                    <span className="px-2 text-sm font-bold text-text-primary">
                      {page + 1} / {totalPages}
                    </span>
                    <button 
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center border border-border-color bg-bg-primary text-text-secondary hover:bg-bg-secondary hover:text-[#008689] dark:hover:text-[#2DD4BF] disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <IconChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl border border-border-color animate-pulse bg-bg-secondary/50">
                    <div className="w-12 h-12 rounded-xl bg-bg-tertiary shrink-0"></div>
                    <div className="flex flex-col gap-2 flex-1 justify-center">
                      <div className="h-4 bg-bg-tertiary rounded w-3/4"></div>
                      <div className="h-3 bg-bg-tertiary rounded w-1/4"></div>
                    </div>
                  </div>
                ))
              ) : notifications.length > 0 ? (
                notifications.map(notif => (
                  <a 
                    key={notif.id}
                    href={`https://portal.ut.edu.vn/thong-bao/${notif.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewNotification(notif.id);
                    }}
                    target="_blank"
                    rel="noreferrer"
                    className="flex gap-4 p-5 rounded-2xl border border-border-color bg-bg-primary hover:bg-bg-secondary hover:border-teal-500/40 transition-all group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-[#008689] dark:text-[#2DD4BF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <IconFileText size={22} />
                    </div>
                    <div className="flex flex-col flex-1 justify-center">
                      <h4 className="text-base font-bold text-text-primary mb-1 group-hover:text-[#008689] dark:group-hover:text-[#2DD4BF] transition-colors line-clamp-2 leading-relaxed">
                        {notif.tieuDe}
                      </h4>
                      <span className="text-sm text-text-tertiary font-medium">
                        {formatDate(notif.ngayHienThi)}
                      </span>
                    </div>
                  </a>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-text-tertiary">
                  <IconBell size={48} className="mb-4 opacity-20" />
                  <p>Không có thông báo nào</p>
                </div>
              )}
            </div>


          </div>
        </div>

      </div>

      <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading className="font-bold text-lg leading-tight pr-4">
                  {modalLoading ? "Đang tải..." : (selectedNotification?.tieuDe || "Chi tiết thông báo")}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="py-4 overflow-y-auto max-h-[70vh]">
                {modalLoading ? (
                  <div className="flex flex-col gap-3">
                    <div className="h-4 bg-bg-tertiary rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-bg-tertiary rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-bg-tertiary rounded w-4/6 animate-pulse"></div>
                  </div>
                ) : selectedNotification ? (
                  <div className="text-sm text-text-primary prose prose-blue max-w-none break-words">
                    <MarkdownNote content={selectedNotification.noiDung} />
                  </div>
                ) : (
                  <div className="text-center text-text-tertiary py-8">
                    Không thể tải chi tiết thông báo.
                  </div>
                )}
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                {selectedNotification?.id && (
                  <Button variant="ghost" onPress={() => window.open(`https://portal.ut.edu.vn/thong-bao/${selectedNotification.id}`, '_blank')}>
                    Mở trong Portal
                  </Button>
                )}
                <Button className="bg-[#008689] hover:bg-[#006f72] text-white font-semibold rounded-xl" onPress={() => setIsModalOpen(false)}>
                  Đóng
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

    </div>
  );
}
