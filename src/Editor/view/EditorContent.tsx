import { flatten } from 'ramda'
import { Symbol } from 'src/lang'
import { TextNode } from './TextNode'
import { CleanContext } from 'src/lang/parse/cleanupContent'
import { RenderPortalInstance } from './RenderPortalInstance'

const OFFSET = 20

type EditorContentProps = CleanContext & {
  buffer: string
  left?: number
  movable: boolean
  namespace: string[]
  targetted?: string
}

export function EditorContent(props: EditorContentProps) {
  const {
    content,
    portals,
    buffer,
    left: parentLeft = 0,
    movable,
    namespace,
    targetted,
  } = props

  const children = content.map(line => {
    return <div className="editor-line">{line.map(EditorChild)}</div>
  })

  return <div className="editor">{children}</div>

  function EditorChild(symbol: Symbol) {
    if (symbol.type === 'text') {
      return TextNode({
        ...symbol,
        left: parentLeft,
        movable,
        namespace,
        buffer,
      })
    }

    const matchingPortal = portals[symbol.for]
    const left = Math.max(
      0,
      Math.min(symbol.left, matchingPortal.left) - OFFSET,
    )
    const width =
      Math.max(symbol.right, matchingPortal.right) - left + 1 + 2 * OFFSET

    if (symbol.type === 'opening' || symbol.type === 'ending') {
      return TextNode({ ...symbol, left, width, movable, namespace, buffer })
    }

    if (symbol.type === 'destination') {
      if (matchingPortal) {
        return RenderPortalInstance(symbol, {
          ...matchingPortal,
          left,
          width,
          movable,
          namespace,
          buffer,
          portals,
          targetted,
        })
      }

      return TextNode({ ...symbol, left, width, movable, namespace, buffer })
    }

    return null
  }
}
