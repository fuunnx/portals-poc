import { Symbol } from 'src/lang'
import { TextNode } from './TextNode'
import { CleanContext } from 'src/lang/parse/cleanupContent'
import { RenderPortalInstance } from './RenderPortalInstance'
import { Selection } from 'monaco-editor'
import { Buffer } from './Buffer'

const OFFSET = 4

type EditorContentProps = CleanContext & {
  buffer: string
  start: number
  end: number
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
    start,
    end,
    movable,
    namespace,
    targetted,
    selection,
  } = props

  const children = content.map(line => {
    let x = 0
    let y = 0
    return line.map((element, index) => {
      const { width, portal } = EditorChild(x, element, index)
      x += width
      return portal
    })
  })

  return (
    <div className="editor">
      <Buffer
        className={'-editor'}
        value={buffer}
        start={start}
        end={end}
        movable={false}
        namespace={namespace}
        selection={selection}
      />
      {children}
    </div>
  )

  function EditorChild(offsetLeft: number, symbol: Symbol, index: number) {
    if (symbol.type !== 'destination') {
      return { width: 0 }
    }

    const matchingPortal = portals[symbol.for]
    if (!matchingPortal) {
      return { width: 0 }
    }

    const left = Math.max(
      0,
      Math.min(
        symbol.boundingRect.columnStart,
        matchingPortal.boundingRect.columnStart,
      ) - OFFSET,
    )
    const width =
      Math.max(
        symbol.boundingRect.columnEnd,
        matchingPortal.boundingRect.columnEnd,
      ) -
      left +
      OFFSET

    return {
      width,
      portal: RenderPortalInstance(index, symbol, {
        ...matchingPortal,
        // left: left + offsetLeft,
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
}
