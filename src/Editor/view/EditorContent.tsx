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
}

export function EditorContent(props: EditorContentProps) {
  const {
    content,
    portals,
    buffer,
    left: parentLeft = 0,
    movable,
    namespace,
  } = props

  const children = flatten(content).map(EditorChildFromLine)

  return <div className="editor">{children}</div>

  function EditorChildFromLine(line: Symbol) {
    if (line.type === 'text') {
      return TextNode({ ...line, left: parentLeft, movable, namespace, buffer })
    }

    const matchingPortal = portals[line.for]
    const left = Math.max(0, Math.min(line.left, matchingPortal.left) - OFFSET)
    const width =
      Math.max(line.right, matchingPortal.right) - left + 1 + 2 * OFFSET

    if (line.type === 'opening' || line.type === 'ending') {
      return TextNode({ ...line, left, width, movable, namespace, buffer })
    }

    if (line.type === 'destination') {
      if (matchingPortal) {
        return RenderPortalInstance(line, {
          ...matchingPortal,
          left,
          width,
          movable,
          namespace,
          buffer,
          portals,
        })
      }
      return TextNode({ ...line, left, width, movable, namespace, buffer })
    }

    return null
  }
}
