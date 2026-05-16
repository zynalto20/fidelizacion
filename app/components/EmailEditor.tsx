'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { useEffect, useState } from 'react'
import PlantillasModal from './EmailTemplates'

interface Props {
  content: string
  onChange: (html: string) => void
  fondo: string
  texto: string
  borde: string
  primario: string
  negocio?: string
}

// ── SVG Icons ─────────────────────────────────────────────────────────
const icons = {
  bold:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>,
  italic:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>,
  underline:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>,
  strike:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><path d="M16 6C16 6 14.5 4 12 4C9.5 4 7 5.5 7 8C7 10.5 9.5 11.5 12 12"/><path d="M8 18C8 18 9.5 20 12 20C14.5 20 17 18.5 17 16C17 13.5 14.5 12.5 12 12"/></svg>,
  alignLeft:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>,
  alignCenter: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>,
  alignRight:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>,
  h1:          <span className="text-xs font-bold leading-none">H1</span>,
  h2:          <span className="text-xs font-bold leading-none">H2</span>,
  bullet:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>,
  ordered:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4" strokeWidth="1.5"/><path d="M4 10h2" strokeWidth="1.5"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" strokeWidth="1.5"/></svg>,
  link:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  unlink:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71"/><path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71"/><line x1="8" y1="2" x2="8" y2="5"/><line x1="2" y1="8" x2="5" y2="8"/><line x1="16" y1="19" x2="16" y2="22"/><line x1="19" y1="16" x2="22" y2="16"/></svg>,
  undo:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>,
  redo:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>,
}

function Divider({ borde }: { borde: string }) {
  return <div style={{ width: 1, height: 20, background: borde, margin: '0 2px', flexShrink: 0 }} />
}

export default function EmailEditor({ content, onChange, fondo, texto, borde, primario, negocio = '' }: Props) {
  const [linkUrl, setLinkUrl] = useState('')
  const [showLink, setShowLink] = useState(false)
  const [showPlantillas, setShowPlantillas] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) editor.commands.setContent(content)
  }, [content])

  if (!editor) return null

  function Btn({ active, onClick, children, title, disabled }: { active?: boolean; onClick: () => void; children: React.ReactNode; title?: string; disabled?: boolean }) {
    return (
      <button type="button" title={title} onClick={onClick} disabled={disabled}
        className="flex items-center justify-center w-7 h-7 rounded-lg transition-all disabled:opacity-30 flex-shrink-0"
        style={{
          background: active ? primario : 'transparent',
          color: active ? '#fff' : texto,
          border: `1px solid ${active ? primario : 'transparent'}`,
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = borde }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
        {children}
      </button>
    )
  }

  function applyLink() {
    if (!linkUrl.trim()) { editor.chain().focus().unsetLink().run(); setShowLink(false); return }
    const href = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`
    editor.chain().focus().setLink({ href }).run()
    setLinkUrl('')
    setShowLink(false)
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${borde}` }}>

      {/* ── Toolbar ── */}
      <div className="px-2 py-1.5 flex items-center flex-wrap gap-0.5"
        style={{ borderBottom: `1px solid ${borde}`, background: fondo }}>

        {/* Deshacer / Rehacer */}
        <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Deshacer">{icons.undo}</Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rehacer">{icons.redo}</Btn>

        <Divider borde={borde} />

        {/* Formato de texto */}
        <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita">{icons.bold}</Btn>
        <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva">{icons.italic}</Btn>
        <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Subrayado">{icons.underline}</Btn>
        <Btn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado">{icons.strike}</Btn>

        <Divider borde={borde} />

        {/* Alineación */}
        <Btn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Alinear izquierda">{icons.alignLeft}</Btn>
        <Btn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centrar">{icons.alignCenter}</Btn>
        <Btn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Alinear derecha">{icons.alignRight}</Btn>

        <Divider borde={borde} />

        {/* Encabezados y listas */}
        <Btn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Título">{icons.h1}</Btn>
        <Btn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Subtítulo">{icons.h2}</Btn>
        <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">{icons.bullet}</Btn>
        <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">{icons.ordered}</Btn>

        <Divider borde={borde} />

        {/* Link */}
        <Btn active={editor.isActive('link') || showLink} onClick={() => { setShowLink(v => !v); setLinkUrl(editor.getAttributes('link').href || '') }} title="Enlace">{icons.link}</Btn>
        {editor.isActive('link') && (
          <Btn onClick={() => editor.chain().focus().unsetLink().run()} title="Quitar enlace">{icons.unlink}</Btn>
        )}

        {/* Color */}
        <label className="flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer transition-all flex-shrink-0"
          title="Color de texto"
          style={{ border: `1px solid transparent` }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = borde}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
          <span className="relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={texto} strokeWidth="2">
              <path d="M4 20h4l10.5-10.5a2.121 2.121 0 0 0-3-3L5 17v3z"/>
              <line x1="13.5" y1="6.5" x2="17.5" y2="10.5"/>
            </svg>
          </span>
          <input type="color" className="absolute opacity-0 w-0 h-0"
            defaultValue="#000000"
            onChange={e => editor.chain().focus().setColor(e.target.value).run()} />
        </label>

        <Divider borde={borde} />

        {/* Plantillas */}
        <button type="button" title="Plantillas de email"
          onClick={() => setShowPlantillas(true)}
          className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
          style={{ background: primario + '18', color: primario, border: `1px solid ${primario}30` }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = primario + '28'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = primario + '18'}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          Plantillas
        </button>
      </div>

      {/* ── Link input ── */}
      {showLink && (
        <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${borde}`, background: fondo }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={texto} strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <input
            autoFocus
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setShowLink(false) }}
            placeholder="https://..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: texto }}
          />
          <button type="button" onClick={applyLink}
            className="text-xs font-semibold px-3 py-1 rounded-lg"
            style={{ background: primario, color: '#fff' }}>
            Aplicar
          </button>
          <button type="button" onClick={() => setShowLink(false)}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ color: texto, border: `1px solid ${borde}` }}>
            ✕
          </button>
        </div>
      )}

      {/* ── Área de edición ── */}
      <div className="px-4 py-3 min-h-44" style={{ background: fondo }}>
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .ProseMirror { outline: none; min-height: 140px; font-size: 14px; line-height: 1.6; color: ${texto}; }
        .ProseMirror p { margin: 0 0 10px 0; }
        .ProseMirror p:last-child { margin-bottom: 0; }
        .ProseMirror h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 10px 0; line-height: 1.3; }
        .ProseMirror h2 { font-size: 1.2rem; font-weight: 600; margin: 0 0 10px 0; line-height: 1.3; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 22px; margin: 0 0 10px 0; }
        .ProseMirror li { margin-bottom: 4px; }
        .ProseMirror a { color: ${primario}; text-decoration: underline; cursor: pointer; }
        .ProseMirror strong { font-weight: 700; }
        .ProseMirror em { font-style: italic; }
        .ProseMirror u { text-decoration: underline; }
        .ProseMirror s { text-decoration: line-through; }
        .ProseMirror .ProseMirror-selectednode { outline: 2px solid ${primario}; }
      `}</style>

      {showPlantillas && (
        <PlantillasModal
          primario={primario}
          negocio={negocio}
          borde={borde}
          texto={texto}
          textoSec={borde}
          fondoClaro={true}
          onSeleccionar={html => { editor.commands.setContent(html); onChange(editor.getHTML()) }}
          onCerrar={() => setShowPlantillas(false)}
        />
      )}
    </div>
  )
}
