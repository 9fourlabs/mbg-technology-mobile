"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  id?: string;
}

/**
 * Tailwind-styled TipTap editor for the CMS richtext field.
 * Stores HTML; the mobile app already has an HTML/Markdown renderer.
 */
export function RichTextEditor({ value, onChange, disabled, id }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
    ],
    content: value || "",
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        id: id ?? "",
        class:
          "prose prose-sm max-w-none min-h-[200px] px-3 py-2 focus:outline-none",
      },
    },
  });

  // Keep the editor in sync if the parent updates `value` externally
  // (e.g., loading an existing record into edit mode).
  useEffect(() => {
    if (!editor) return;
    if (value === editor.getHTML()) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      <Toolbar editor={editor} disabled={disabled} />
      <EditorContent editor={editor} />
    </div>
  );
}

interface ToolbarProps {
  editor: ReturnType<typeof useEditor>;
  disabled?: boolean;
}

function Toolbar({ editor, disabled }: ToolbarProps) {
  if (!editor) return null;

  const btn = (active: boolean) =>
    `px-2 py-1 text-xs rounded hover:bg-gray-200 disabled:opacity-50 ${
      active ? "bg-gray-200 font-semibold" : ""
    }`;

  const insertLink = () => {
    const url = window.prompt("Enter URL");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1">
      <button
        type="button"
        disabled={disabled}
        className={btn(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        disabled={disabled}
        className={btn(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </button>
      <button
        type="button"
        disabled={disabled}
        className={btn(editor.isActive("strike"))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </button>
      <span className="border-l border-gray-300 mx-1" />
      <button
        type="button"
        disabled={disabled}
        className={btn(editor.isActive("heading", { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </button>
      <button
        type="button"
        disabled={disabled}
        className={btn(editor.isActive("heading", { level: 3 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </button>
      <span className="border-l border-gray-300 mx-1" />
      <button
        type="button"
        disabled={disabled}
        className={btn(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </button>
      <button
        type="button"
        disabled={disabled}
        className={btn(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </button>
      <button
        type="button"
        disabled={disabled}
        className={btn(editor.isActive("blockquote"))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        ❝
      </button>
      <span className="border-l border-gray-300 mx-1" />
      <button
        type="button"
        disabled={disabled}
        className={btn(editor.isActive("link"))}
        onClick={insertLink}
      >
        Link
      </button>
      <button
        type="button"
        disabled={disabled}
        className={btn(false)}
        onClick={() => editor.chain().focus().undo().run()}
      >
        ↶
      </button>
      <button
        type="button"
        disabled={disabled}
        className={btn(false)}
        onClick={() => editor.chain().focus().redo().run()}
      >
        ↷
      </button>
    </div>
  );
}
