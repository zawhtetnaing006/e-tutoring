import { useState } from 'react'
import type { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Underline,
  Undo2,
} from 'lucide-react'
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
  TiptapButton,
} from '@/components/tiptap-ui-primitive'
import { InsertLinkModal } from './InsertLinkModal'

interface RichTextToolbarProps {
  editor: Editor | null
  onLinkModalOpenChange?: (open: boolean) => void
}

const INACTIVE_TOOLBAR = {
  canUndo: false,
  canRedo: false,
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isBulletList: false,
  isOrderedList: false,
  isBlockquote: false,
} as const

export function RichTextToolbar({
  editor,
  onLinkModalOpenChange,
}: RichTextToolbarProps) {
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkModalNonce, setLinkModalNonce] = useState(0)
  const [linkInitialUrl, setLinkInitialUrl] = useState('')

  const state =
    useEditorState({
      editor,
      selector: ({ editor: ed }) => {
        if (!ed) {
          return { ...INACTIVE_TOOLBAR }
        }
        return {
          canUndo: ed.can().undo(),
          canRedo: ed.can().redo(),
          isBold: ed.isActive('bold'),
          isItalic: ed.isActive('italic'),
          isUnderline: ed.isActive('underline'),
          isBulletList: ed.isActive('bulletList'),
          isOrderedList: ed.isActive('orderedList'),
          isBlockquote: ed.isActive('blockquote'),
        }
      },
    }) ?? INACTIVE_TOOLBAR

  const openLinkModal = () => {
    if (!editor) return
    setLinkInitialUrl(String(editor.getAttributes('link').href ?? ''))
    setLinkModalNonce(n => n + 1)
    setLinkModalOpen(true)
    onLinkModalOpenChange?.(true)
  }

  const closeLinkModal = () => {
    setLinkModalOpen(false)
    onLinkModalOpenChange?.(false)
  }

  const handleLinkConfirm = (href: string) => {
    if (!editor) return
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
  }

  const handleClear = () => {
    if (!editor) return
    editor.chain().focus().unsetAllMarks().clearNodes().run()
  }

  return (
    <>
      <Toolbar variant="default" className="rounded-t-lg">
        <ToolbarGroup>
          <TiptapButton
            data-style="ghost"
            data-size="default"
            tooltip="Undo"
            shortcutKeys="Ctrl+Z"
            disabled={!editor || !state.canUndo}
            onClick={() => {
              if (!editor) return
              editor.chain().focus().undo().run()
            }}
          >
            <Undo2 className="tiptap-button-icon" strokeWidth={2} />
            <span className="tiptap-button-text">Undo</span>
          </TiptapButton>
          <TiptapButton
            data-style="ghost"
            data-size="default"
            tooltip="Redo"
            shortcutKeys="Ctrl+Shift+Z"
            disabled={!editor || !state.canRedo}
            onClick={() => {
              if (!editor) return
              editor.chain().focus().redo().run()
            }}
          >
            <Redo2 className="tiptap-button-icon" strokeWidth={2} />
            <span className="tiptap-button-text">Redo</span>
          </TiptapButton>
        </ToolbarGroup>

        <ToolbarSeparator orientation="vertical" />

        <ToolbarGroup>
          <TiptapButton
            data-style="ghost"
            data-size="default"
            data-active-state={state.isBold ? 'on' : 'off'}
            tooltip="Bold"
            shortcutKeys="Ctrl+B"
            disabled={!editor}
            onClick={() => {
              if (!editor) return
              editor.chain().focus().toggleBold().run()
            }}
          >
            <Bold className="tiptap-button-icon" strokeWidth={2} />
            <span className="tiptap-button-text">Bold</span>
          </TiptapButton>
          <TiptapButton
            data-style="ghost"
            data-size="default"
            data-active-state={state.isItalic ? 'on' : 'off'}
            tooltip="Italic"
            shortcutKeys="Ctrl+I"
            disabled={!editor}
            onClick={() => {
              if (!editor) return
              editor.chain().focus().toggleItalic().run()
            }}
          >
            <Italic className="tiptap-button-icon" strokeWidth={2} />
            <span className="tiptap-button-text">Italic</span>
          </TiptapButton>
          <TiptapButton
            data-style="ghost"
            data-size="default"
            data-active-state={state.isUnderline ? 'on' : 'off'}
            tooltip="Underline"
            shortcutKeys="Ctrl+U"
            disabled={!editor}
            onClick={() => {
              if (!editor) return
              editor.chain().focus().toggleUnderline().run()
            }}
          >
            <Underline className="tiptap-button-icon" strokeWidth={2} />
            <span className="tiptap-button-text">Underline</span>
          </TiptapButton>
        </ToolbarGroup>

        <ToolbarSeparator orientation="vertical" />

        <ToolbarGroup>
          <TiptapButton
            data-style="ghost"
            data-size="default"
            data-active-state={state.isBulletList ? 'on' : 'off'}
            tooltip="Bullet list"
            disabled={!editor}
            onClick={() => {
              if (!editor) return
              editor.chain().focus().toggleBulletList().run()
            }}
          >
            <List className="tiptap-button-icon" strokeWidth={2} />
            <span className="tiptap-button-text">Bullet list</span>
          </TiptapButton>
          <TiptapButton
            data-style="ghost"
            data-size="default"
            data-active-state={state.isOrderedList ? 'on' : 'off'}
            tooltip="Ordered list"
            disabled={!editor}
            onClick={() => {
              if (!editor) return
              editor.chain().focus().toggleOrderedList().run()
            }}
          >
            <ListOrdered className="tiptap-button-icon" strokeWidth={2} />
            <span className="tiptap-button-text">Ordered list</span>
          </TiptapButton>
          <TiptapButton
            data-style="ghost"
            data-size="default"
            data-active-state={state.isBlockquote ? 'on' : 'off'}
            tooltip="Blockquote"
            disabled={!editor}
            onClick={() => {
              if (!editor) return
              editor.chain().focus().toggleBlockquote().run()
            }}
          >
            <Quote className="tiptap-button-icon" strokeWidth={2} />
            <span className="tiptap-button-text">Blockquote</span>
          </TiptapButton>
        </ToolbarGroup>

        <ToolbarSeparator orientation="vertical" />

        <ToolbarGroup>
          <TiptapButton
            data-style="ghost"
            data-size="default"
            tooltip="Link"
            shortcutKeys="Ctrl+K"
            disabled={!editor}
            onClick={openLinkModal}
          >
            <Link2 className="tiptap-button-icon" strokeWidth={2} />
            <span className="tiptap-button-text">Link</span>
          </TiptapButton>
          <TiptapButton
            data-style="ghost"
            data-size="default"
            tooltip="Clear formatting"
            disabled={!editor}
            onClick={handleClear}
          >
            <RemoveFormatting className="tiptap-button-icon" strokeWidth={2} />
            <span className="tiptap-button-text">Clear formatting</span>
          </TiptapButton>
        </ToolbarGroup>
      </Toolbar>

      <InsertLinkModal
        key={linkModalNonce}
        isOpen={linkModalOpen}
        onClose={closeLinkModal}
        initialUrl={linkInitialUrl}
        onConfirm={handleLinkConfirm}
      />
    </>
  )
}
