import { VNode } from '@cycle/dom'
import { Destination, Dict } from '../../lang'
import { CleanPortal } from 'src/lang/parse/cleanupContent'
import { EditorContent } from './EditorContent'
import { Selection } from 'monaco-editor'

type PortaProps = CleanPortal & {
  width: number
  movable: boolean
  namespace: string[]
  portals: Dict<CleanPortal>
  buffer: string
  targetted?: string
  selection?: Selection
}

export function RenderPortalInstance(
  index: number,
  lineElement: Destination,
  context: PortaProps,
) {
  const { columnStart } = context.boundingRect
  const { line } = lineElement.position

  function hook(vnode: VNode) {
    if (vnode.elm) {
      let elm = vnode.elm as HTMLElement
      requestAnimationFrame(() => {
        elm.scrollLeft = 7.22 * columnStart
      })
      elm.onscroll = () => {
        elm.scrollLeft = 7.22 * columnStart
      }
    }
  }

  const isTargetted = context.targetted === lineElement.id
  let namespace = context.namespace.concat([context.id])

  return (
    <div
      id={lineElement.id}
      key={lineElement.id}
      class={{
        'portal-instance': true,
        '-targetted': isTargetted,
        '-targettable': Boolean(context.targetted && !isTargetted),
      }}
      style={{
        overflow: 'hidden',
        width: '330px',
        '--top': String(line + 1),
        '--left': `${index * 330}px`,
        'z-index': String(namespace.length * 10),
      }}
      namespace={namespace}
      scrollLeft={columnStart * 12}
      hook={{ insert: hook, update: hook }}
      data={{
        draggable: context.movable,
      }}
    >
      <div
        data={{
          dropzone: 'left',
          lineIndex: lineElement.boundingRect.lineStart,
          columnIndex: index - 0.5,
        }}
        className="dropzone -left"
      ></div>
      <div
        data={{
          dropzone: 'right',
          lineIndex: lineElement.boundingRect.lineStart,
          columnIndex: index + 0.5,
        }}
        className="dropzone -right"
      ></div>
      {EditorContent({
        content: context.content,
        portals: context.portals,
        buffer: context.buffer,
        start: context.boundingRect.lineStart,
        end: context.boundingRect.lineEnd,
        movable: context.movable,
        namespace,
        selection: context.selection,
      })}
    </div>
  )
}
