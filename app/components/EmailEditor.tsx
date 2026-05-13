'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { useEffect } from 'react'

interface Props {
  content: string
  onChange: (html: string) => void
  fondo: string
  texto: string
  borde: string
  primario: string
}

export default function EmailEditor({ content, onChange, fondo, texto, borde, primario }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Image.configure({ inline: false, allowBase64: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content])

  if (!editor) return null

  const btn = (active: boolean, onClick: () => void, label: string) => (
    <button type="button" onClick={onClick}
      className="px-2 py-1 rounded text-xs font-medium transition-colors"
      style={{ background: active ? primario : 'transparent', color: active ? '#fff' : texto, border: `1px solid ${active ? primario : borde}` }}>
      {label}
    </button>
  )

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${borde}` }}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2" style={{ borderBottom: `1px solid ${borde}`, background: `${fondo}` }}>
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'B')}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'I')}
        {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'U')}
        {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'S̶')}
        <div style={{ width: '1px', background: borde, margin: '0 2px' }} />
        {btn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), '←')}
        {btn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), '↔')}
        {btn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), '→')}
        <div style={{ width: '1px', background: borde, margin: '0 2px' }} />
        {btn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'H1')}
        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2')}
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '•')}
        <div style={{ width: '1px', background: borde, margin: '0 2px' }} />
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: texto }}>Color:</span>
          <input type="color" defaultValue="#000000"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
        </div>
        <button type="button"
          onClick={() => {
            const url = prompt('URL de la imagen:')
            if (url) editor.chain().focus().setImage({ src: url }).run()
          }}
          className="px-2 py-1 rounded text-xs font-medium"
          style={{ color: texto, border: `1px solid ${borde}` }}>
          🖼
        </button>
        <button type="button"
          onClick={() => {
            const url = prompt('URL del enlace:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
          className="px-2 py-1 rounded text-xs font-medium"
          style={{ color: texto, border: `1px solid ${borde}` }}>
          🔗
        </button>
        <button type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          className="px-2 py-1 rounded text-xs font-medium"
          style={{ color: texto, border: `1px solid ${borde}` }}>
          ✂
        </button>
      </div>
      {/* Editor */}
      <div className="p-3 min-h-40" style={{ background: fondo }}>
        <EditorContent editor={editor} style={{ color: texto, outline: 'none' }} />
      </div>
      <style>{`
        .ProseMirror { outline: none; min-height: 120px; }
        .ProseMirror p { margin: 0 0 8px 0; }
        .ProseMirror h1 { font-size: 1.5rem; font-weight: bold; margin: 0 0 8px 0; }
        .ProseMirror h2 { font-size: 1.2rem; font-weight: bold; margin: 0 0 8px 0; }
        .ProseMirror ul { padding-left: 20px; margin: 0 0 8px 0; }
        .ProseMirror img { max-width: 100%; border-radius: 8px; }
        .ProseMirror a { color: ${primario}; text-decoration: underline; }
      `}</style>
    </div>
  )
}