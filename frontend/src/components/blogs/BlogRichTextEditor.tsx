import { useMemo, useRef, useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import Underline from '@tiptap/extension-underline'
import { StarterKit } from '@tiptap/starter-kit'
import { hasMeaningfulContent } from '@/utils/string'
import { RichTextToolbar } from './RichTextToolbar'

export interface BlogRichTextEditorProps {
  initialHtml: string
  onChange: (html: string) => void
  /** Used so a parent modal can disable Escape-to-close while a nested dialog (e.g. link) is open. */
  onNestedModalOpenChange?: (open: boolean) => void
}

export function BlogRichTextEditor({
  initialHtml,
  onChange,
  onNestedModalOpenChange,
}: BlogRichTextEditorProps) {
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        strike: false,
        horizontalRule: false,
        heading: { levels: [1, 2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: 'noopener noreferrer',
            target: '_blank',
          },
        },
      }),
      Underline,
    ],
    []
  )

  const editor = useEditor(
    {
      extensions,
      content: initialHtml,
      editorProps: {
        attributes: {
          id: 'blog-content-editor',
          class:
            'tiptap blog-tiptap-editor min-h-[200px] w-full rounded-b-lg px-3 py-2 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1',
          role: 'textbox',
          'aria-multiline': 'true',
          tabIndex: '0',
        },
      },
      onUpdate: ({ editor: ed }) => {
        const html = ed.getHTML()
        onChangeRef.current(hasMeaningfulContent(html) ? html : '')
      },
    },
    [initialHtml]
  )

  return (
    <div className="rounded-lg border border-slate-200">
      <RichTextToolbar
        editor={editor}
        onLinkModalOpenChange={onNestedModalOpenChange}
      />
      {editor ? (
        <EditorContent editor={editor} className="blog-tiptap-root" />
      ) : (
        <div className="min-h-[200px] rounded-b-lg bg-slate-50" aria-hidden />
      )}
    </div>
  )
}
