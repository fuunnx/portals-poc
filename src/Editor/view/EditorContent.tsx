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

  const voids = destinations
    .map(line => {
      const voidsInLine = line.map(
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
      return fold((max, bound) => {
        return {
          columnStart: Math.min(max.columnStart, bound.columnStart),
          columnEnd: Math.max(max.columnEnd, bound.columnEnd),
          lineStart: Math.min(max.lineStart, bound.lineStart),
          lineEnd: Math.max(max.lineEnd, bound.lineEnd),
        }
      }, voidsInLine)
    })
    .filter(Boolean) as BoundingRect[]

  const cuts = Object.values(portals).map(x => x.boundingRect)

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
        voids={voids}
        cuts={cuts}
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
function fold<T>(func: (acc: T, x: T) => T, array: T[]): T | undefined {
  if (array.length <= 1) {
    return array[0]
  }
  return array.slice(1).reduce(func, array[0])
}
