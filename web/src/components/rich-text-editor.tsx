"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Bold, Link as LinkIcon, List, ListOrdered } from "lucide-react";

interface RichTextEditorProps {
  value: string; // Markdown string
  onChange: (markdown: string) => void;
  placeholder?: string;
  minHeight?: string;
  editorClassName?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  minHeight = "200px",
  editorClassName,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }, // Only H1, H2, H3
        paragraph: true,
        bold: true,
        hardBreak: true,
        bulletList: true,
        orderedList: true,
        listItem: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline dark:text-blue-400",
        },
      }),
      TextStyle,
      Placeholder.configure({
        placeholder,
      }),
      Markdown.configure({
        html: false,
        tightLists: false,
        tightListClass: 'tight',
        bulletListMarker: "-",
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: "prose prose-slate prose-lg max-w-none dark:prose-invert focus:outline-none px-4 py-3",
      },
    },
  });

  // Update editor content when value prop changes (for controlled component behavior)
  useEffect(() => {
    if (editor && value !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-editor">
      <EditorToolbar editor={editor} />
      <div
        className={cn(
          "rounded-b-xl border border-t-0 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950 overflow-auto",
          editorClassName
        )}
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

interface EditorToolbarProps {
  editor: Editor | null;
}

function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const getCurrentHeadingLevel = () => {
    if (editor.isActive("heading", { level: 1 })) return "1";
    if (editor.isActive("heading", { level: 2 })) return "2";
    if (editor.isActive("heading", { level: 3 })) return "3";
    return "p";
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-t-xl border border-b-0 border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
      {/* Text Type Dropdown */}
      <select
        onChange={(e) => {
          const level = e.target.value;
          if (level === "p") {
            editor.chain().focus().setParagraph().run();
          } else {
            editor
              .chain()
              .focus()
              .setHeading({ level: parseInt(level) as 1 | 2 | 3 })
              .run();
          }
        }}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
        value={getCurrentHeadingLevel()}
      >
        <option value="p">Normal</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>

      {/* Bold Button */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "rounded-lg p-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition",
          editor.isActive("bold") && "bg-slate-200 dark:bg-slate-700"
        )}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </button>

      {/* Bullet List Button */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "rounded-lg p-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition",
          editor.isActive("bulletList") && "bg-slate-200 dark:bg-slate-700"
        )}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>

      {/* Numbered List Button */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "rounded-lg p-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition",
          editor.isActive("orderedList") && "bg-slate-200 dark:bg-slate-700"
        )}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>

      {/* Link Button */}
      <button
        type="button"
        onClick={editor.isActive("link") ? removeLink : addLink}
        className={cn(
          "rounded-lg p-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition",
          editor.isActive("link") && "bg-slate-200 dark:bg-slate-700"
        )}
        title={editor.isActive("link") ? "Remove link" : "Add link"}
      >
        <LinkIcon className="h-4 w-4" />
      </button>

      {/* Divider */}
      <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />

      {/* Clear Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        className="rounded-lg px-3 py-1 text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        title="Clear formatting"
      >
        Clear Format
      </button>
    </div>
  );
}
