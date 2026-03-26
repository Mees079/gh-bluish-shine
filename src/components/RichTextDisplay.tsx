import ReactMarkdown from "react-markdown";

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export const RichTextDisplay = ({ content, className = "" }: RichTextDisplayProps) => {
  if (!content) return null;

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-foreground mt-4 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-foreground mt-3 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-foreground mt-2 mb-1">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-muted-foreground mb-2 leading-relaxed">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          del: ({ children }) => (
            <del className="line-through text-muted-foreground/70">{children}</del>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground mb-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-muted-foreground">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground my-2">{children}</blockquote>
          ),
          hr: () => (
            <hr className="border-border my-4" />
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>
          ),
          code: ({ children }) => (
            <code className="bg-secondary px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
          ),
        }}
        allowedElements={undefined}
        unwrapDisallowed={false}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
