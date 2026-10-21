import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { openUrl } from "@tauri-apps/plugin-opener";

export default function MarkdownNote({ content }: { content: string }) {
  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]} 
      rehypePlugins={[rehypeRaw]}
      components={{
        a: ({node, ...props}) => (
          <a 
            {...props} 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (props.href) {
                let finalUrl = props.href;
                if (!finalUrl.startsWith('http')) {
                  finalUrl = finalUrl.startsWith('/') ? `https://portal.ut.edu.vn${finalUrl}` : `https://portal.ut.edu.vn/${finalUrl}`;
                }
                openUrl(finalUrl).catch(console.error);
              }
            }}
            className="text-[#008689] dark:text-[#2DD4BF] hover:underline font-medium cursor-pointer" 
          />
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
