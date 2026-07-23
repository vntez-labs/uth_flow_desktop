import { useEffect, useState } from 'react';

export default function ScrollToTopButton({ containerId }: { containerId: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const handleScroll = () => {
      setShow(container.scrollTop > 300);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerId]);

  const scrollToTop = () => {
    document.getElementById(containerId)?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!show) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-24 right-6 z-[90] flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl"
      aria-label="Cuộn lên đầu trang"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m18 15-6-6-6 6"/>
      </svg>
    </button>
  );
}
