'use client';

import { useEffect, useRef, useState } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import gjsTailwind from '@grapesjs/tailwind';
import 'grapesjs/dist/css/grapes.min.css';
import { Button } from './Button';
import { Save, ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface HTMLEditorProps {
  initialHTML: string;
  onSave: (html: string) => void;
  isSaving?: boolean;
}

export function HTMLEditor({ initialHTML, onSave, isSaving }: HTMLEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const gjsEditor = grapesjs.init({
      container: editorRef.current,
      fromElement: false,
      height: 'calc(100vh - 160px)',
      width: 'auto',
      storageManager: false,
      plugins: [gjsTailwind],
      pluginsOpts: {
        [gjsTailwind]: {
          /* options */
        },
      },
      canvas: {
        styles: [
          'https://cdn.tailwindcss.com',
        ],
      },
    });

    gjsEditor.setComponents(initialHTML);
    setEditor(gjsEditor);

    return () => {
      gjsEditor.destroy();
    };
  }, []);

  const handleSave = () => {
    if (editor) {
      const html = editor.getHtml();
      const css = editor.getCss();
      // Combine HTML and CSS for full document (or as needed)
      const fullHTML = `
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>${css}</style>
          </head>
          <body>${html}</body>
        </html>
      `;
      onSave(fullHTML);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] rounded-xl overflow-hidden border border-surface-border">
      <div className="flex justify-between items-center p-4 bg-surface/80 backdrop-blur-md border-b border-surface-border">
        <div className="flex items-center gap-4">
          <Link href="/student/ai-files">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Geri Dön
            </Button>
          </Link>
          <h2 className="text-lg font-semibold text-white">HTML Görsel Düzenleyici</h2>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="shadow-lg shadow-primary/20">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Değişiklikleri Kaydet
        </Button>
      </div>
      
      <div className="flex-1 gjs-custom-editor">
        <div ref={editorRef} />
      </div>

      <style jsx global>{`
        .gjs-cv-canvas {
          background-color: #0f172a;
        }
        .gjs-one-bg {
          background-color: #1e293b;
        }
        .gjs-two-bg {
          background-color: #334155;
        }
        .gjs-three-bg {
          background-color: #475569;
        }
        .gjs-four-bg {
          background-color: #64748b;
        }
        .gjs-font-main {
          font-family: inherit;
        }
        .gjs-border-color {
          border-color: #334155;
        }
      `}</style>
    </div>
  );
}
