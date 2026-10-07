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

function formatAsciiMathToLatex(str) {
  if (!str || typeof str !== "string") return str;

  // Already standard LaTeX delimiters present
  if (str.includes("$")) {
    return str;
  }

  function formatFormulaExpr(expr) {
    let s = expr.trim();

    // 1. Greek symbols & common constants
    s = s.replace(/\bpi\b/gi, "\\pi ");
    s = s.replace(/\btheta\b/gi, "\\theta ");
    s = s.replace(/\bomega\b/gi, "\\omega ");
    s = s.replace(/\balpha\b/gi, "\\alpha ");
    s = s.replace(/\bbeta\b/gi, "\\beta ");
    s = s.replace(/\blambda\b/gi, "\\lambda ");
    s = s.replace(/\bmu\b/gi, "\\mu ");
    s = s.replace(/\bsigma\b/gi, "\\sigma ");
    s = s.replace(/\bphi\b/gi, "\\phi ");
    s = s.replace(/\bDelta\b/g, "\\Delta ");
    s = s.replace(/\bdelta\b/g, "\\delta ");
    s = s.replace(/\binfinity\b|\binf\b/gi, "\\infty ");

    // 2. Square roots: sqrt(...) -> \sqrt{...}
    let maxIter = 5;
    while (/sqrt\s*\(([^()]+)\)/i.test(s) && maxIter-- > 0) {
      s = s.replace(/sqrt\s*\(([^()]+)\)/gi, (m, inner) => {
        let cleanInner = inner.trim();
        if (cleanInner.includes("/")) {
          const parts = cleanInner.split("/").map((p) => p.trim());
          if (parts.length === 2) {
            cleanInner = `\\frac{${formatFormulaExpr(parts[0])}}{${formatFormulaExpr(parts[1])}}`;
          }
        } else {
          cleanInner = formatFormulaExpr(cleanInner);
        }
        return `\\sqrt{${cleanInner}}`;
      });
    }

    // 3. Multiplication * -> \cdot
    s = s.replace(/\s*\*\s*/g, " \\cdot ");

    // 4. Fractions: 1 / (...) or A / B
    s = s.replace(/([0-9a-zA-Z_\\{}]+)\s*\/\s*\(([^()]+)\)/g, (m, num, den) => {
      return `\\frac{${num}}{${formatFormulaExpr(den)}}`;
    });
    s = s.replace(/([0-9a-zA-Z_\\{}]+)\s*\/\s*([0-9a-zA-Z_\\{}]+)/g, "\\frac{$1}{$2}");

    // 5. Subscripts: X_abc -> \text{X}_{abc}
    s = s.replace(/([a-zA-Z0-9]+)_([a-zA-Z0-9]+)/g, (m, base, sub) => {
      const baseFormatted = base.length > 2 && !base.startsWith("\\") ? `\\text{${base}}` : base;
      const subFormatted = sub.length > 1 && !sub.startsWith("\\") ? `\\text{${sub}}` : sub;
      return `${baseFormatted}_{${subFormatted}}`;
    });

    // 6. Superscripts: X^2 -> X^{2}
    s = s.replace(/\^([a-zA-Z0-9\-+]+)/g, "^{$1}");

    return s;
  }

  // Detect pure formula/expression (like Option text: h_r = ..., or A / B, or math symbols)
  const isPureFormula =
    /^[a-zA-Z0-9_().\s\/*+\-=^\\\[\]]+$/.test(str) &&
    (/[=]/.test(str) || /sqrt|pi|omega|theta|\^|_|\/|\*/.test(str));

  if (isPureFormula) {
    return `$${formatFormulaExpr(str)}$`;
  }

  // For mixed prose with math terms like (MVAr_C) or inline variable_names
  let res = str.replace(/\(([a-zA-Z0-9_]+)\)/g, (m, inner) => {
    if (inner.includes("_") || inner.includes("^")) {
      return `$${formatFormulaExpr(inner)}$`;
    }
    return m;
  });

  return res;
}

export function MathText({ content }) {
  let processedContent = content || "";

  // Replace common LaTeX delimiters with markdown-compatible ones
  processedContent = processedContent.replace(/\\\((.*?)\\\)/g, "$$$1$$");
  processedContent = processedContent.replace(/\\\[(.*?)\\\]/g, "$$$$$1$$$$");

  // Format ASCII math formulas & raw equations into KaTeX
  processedContent = formatAsciiMathToLatex(processedContent);

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
    <div className="math-text prose prose-sm dark:prose-invert max-w-none">
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
