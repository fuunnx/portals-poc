import { Symbol } from 'src/lang'
import { TextNode } from './TextNode'
import { CleanContext } from 'src/lang/parse/cleanupContent'
import { RenderPortalInstance } from './RenderPortalInstance'
import { Selection } from 'monaco-editor'

const OFFSET = 0

type EditorContentProps = CleanContext & {
  buffer: string
  left?: number
  movable: boolean
  namespace: string[]
  targetted?: string
  selection?: Selection
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
    selection,
  } = props

  const children = content.map(line => {
    const children = line.map(EditorChild)
    const thisLine = children.map(child => child.thisLine)
    const nextLine = children.map(child => child.nextLine).filter(Boolean)
    if (nextLine.length) {
      return [Line(thisLine), Line(nextLine)]
    }

    return Line(thisLine)
  })

  return <div className="editor">{children}</div>

  function Line(children: (JSX.Element | null | undefined)[]) {
    return <div className="editor-line">{children}</div>
  }

  function EditorChild(
    symbol: Symbol,
    index: number,
  ): { thisLine?: JSX.Element | null; nextLine?: JSX.Element } {
    if (symbol.type === 'text') {
      return {
        thisLine: TextNode({
          ...symbol,
          left: parentLeft,
          movable,
          namespace,
          buffer,
          selection,
        }),
      }
    }

    const matchingPortal = portals[symbol.for]
    const left = Math.max(
      0,
      Math.min(symbol.left, matchingPortal.left) - OFFSET,
    )
    const width =
      Math.max(symbol.right, matchingPortal.right) - left + 1 + 2 * OFFSET

    if (symbol.type === 'opening' || symbol.type === 'ending') {
      return {
        thisLine: TextNode({
          ...symbol,
          left,
          width,
          movable,
          namespace,
          buffer,
          selection,
        }),
      }
    }

    if (symbol.type === 'destination') {
      const destinationLine = TextNode({
        ...symbol,
        left,
        width,
        movable,
        namespace,
        buffer,
        selection,
      })

      if (matchingPortal) {
        return {
          thisLine: destinationLine,
          nextLine: RenderPortalInstance(index, symbol, {
            ...matchingPortal,
            left,
            width,
            movable,
            namespace,
            buffer,
            portals,
            targetted,
            selection,
          }),
        }
      }

      return {
        thisLine: destinationLine,
      }
    }

    return {
      thisLine: null,
    }
  }
}
