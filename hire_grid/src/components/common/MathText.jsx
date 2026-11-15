import React, { useEffect, useState, useId } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
});

function MermaidChart({ chart }) {
  const [svg, setSvg] = useState("");
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    let isMounted = true;
    mermaid
      .render(`mermaid-${id}`, chart)
      .then((res) => {
        if (isMounted) setSvg(res.svg);
      })
      .catch((e) => {
        console.error(e);
        if (isMounted)
          setSvg(
            `<div class="text-red-500 text-sm p-4 border border-red-200 rounded">Error rendering diagram: ${e.message}</div>`,
          );
      });
    return () => {
      isMounted = false;
    };
  }, [chart, id]);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: svg }}
      className="flex justify-center my-4 overflow-x-auto bg-white dark:bg-slate-800 p-4 rounded-xl"
    />
  );
}

/**
 * Preprocesses text content to ensure mathematical expressions, LaTeX syntax,
 * HTML formatting tags, and equations render properly across students and admins.
 */
function preprocessContent(content) {
  if (!content || typeof content !== "string") return "";
  let s = content;

  // 1. Unescape JSON-serialized double backslashes before LaTeX keywords (e.g. \\frac -> \frac)
  s = s.replace(/\\\\([a-zA-Z]+)/g, "\\$1");

  // 2. Preprocess common HTML formatting tags to Markdown equivalents so they don't render as raw text
  s = s.replace(/<\/?(b|strong)>/gi, "**");
  s = s.replace(/<\/?(i|em)>/gi, "*");
  s = s.replace(/<\/?u>/gi, "__");
  s = s.replace(/<br\s*\/?>/gi, "\n\n");
  s = s.replace(/<p>/gi, "\n\n").replace(/<\/p>/gi, "\n");

  // 3. Normalize LaTeX display brackets \[ ... \] and inline \( ... \)
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (m, inner) => `\n\n$$\n${inner.trim()}\n$$\n\n`);
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (m, inner) => `$${inner.trim()}$`);

  // 4. Split by code blocks to avoid altering intentional code snippets
  const codeBlockParts = s.split(/(```[\s\S]*?```|`[^`]+`)/g);

  for (let i = 0; i < codeBlockParts.length; i++) {
    // If inside a code block or inline code, leave strictly untouched
    if (codeBlockParts[i].startsWith("`")) continue;

    // Split by existing math blocks ($$...$$ and $...$)
    const mathParts = codeBlockParts[i].split(/(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g);
    for (let j = 0; j < mathParts.length; j++) {
      // If already enclosed in math delimiters, leave untouched
      if (mathParts[j].startsWith("$")) continue;

      let part = mathParts[j];

      // Auto-wrap unadorned standard LaTeX commands (e.g. \frac{a}{b}, \sqrt{x}, \alpha, \sum)
      part = part.replace(
        /(\\(?:frac\{[^{}]+\}\{[^{}]+\}|sqrt(?:\[[^\]]*\])?\{[^{}]+\}|sum|int|prod|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|tau|phi|omega|Delta|Sigma|Omega|infty|times|div|pm|leq|geq|neq|approx|to|rightarrow|partial|cdot)(?:[^{}\s$]+|\{[^{}]+\})*)/g,
        (match) => `$${match.trim()}$`,
      );

      // Check for standalone formulas / MCQ options like "x^2 + y^2 = z^2" or "V_out / V_in"
      const trimmed = part.trim();
      const isEnglishSentence = /\b(the|is|are|was|were|and|or|of|which|what|where|when|find|calculate|following|in|at|on|for|with)\b/i.test(trimmed);
      const isMathExpression =
        /^[a-zA-Z0-9_().\s\/*+\-=^\\\[\]]+$/.test(trimmed) &&
        (/[=]/.test(trimmed) || /\^|_|\/|\*/.test(trimmed)) &&
        !isEnglishSentence;

      if (isMathExpression && trimmed.length > 1) {
        part = `$${trimmed}$`;
      }

      mathParts[j] = part;
    }
    codeBlockParts[i] = mathParts.join("");
  }

  return codeBlockParts.join("");
}

export function MathText({ content }) {
  const processedContent = preprocessContent(content);

  const components = {
    code(props) {
      const { children, className, node, ...rest } = props;
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";

      if (language === "mermaid") {
        return <MermaidChart chart={String(children).replace(/\n$/, "")} />;
      }

      return (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className="math-text prose prose-sm dark:prose-invert max-w-none overflow-x-auto break-words">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
export default MathText;
