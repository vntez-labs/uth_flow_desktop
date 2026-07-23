import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export default function MarkdownNote({ content }: { content: string }) {
  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]} 
      rehypePlugins={[rehypeRaw]}
      components={{
        a: ({node, ...props}) => <a {...props} onClick={(e) => e.preventDefault()} className="text-blue-600 font-medium" />
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
