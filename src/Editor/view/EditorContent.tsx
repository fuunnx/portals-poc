import { Symbol, Destination, BoundingRect } from 'src/lang'
import { CleanContext } from 'src/lang/parse/cleanupContent'
import { RenderPortalInstance } from './RenderPortalInstance'
import { Selection } from 'monaco-editor'
import { Buffer } from './Buffer'

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

  const destinations = content.map(line => {
    return line.filter(
      x => x.type === 'destination' && portals[x.for],
    ) as Destination[]
  })

  const children = destinations.map(line => {
    return line.map((element: Destination, index) => {
      return EditorChild(element, index)
    })
  })

  const holes = destinations.map(line => {
    return line.map(
      (element: Destination): BoundingRect => {
        const portalBounds = portals[element.for].boundingRect
        const portalHeight = portalBounds.lineEnd - portalBounds.lineStart
        return {
          ...portalBounds,
          lineStart: element.position.line,
          lineEnd: element.position.line + portalHeight,
        }
      },
    )
  })
  console.log(holes)

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

  function EditorChild(symbol: Destination, index: number) {
    return RenderPortalInstance(index, symbol, {
      ...portals[symbol.for],
      movable,
      namespace,
      buffer,
      portals,
      targetted,
      selection,
    })
  }
}
