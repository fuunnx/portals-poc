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
  line: Destination,
  context: PortaProps,
) {
  function hook(vnode: VNode) {
    if (vnode.elm) {
      let elm = vnode.elm as HTMLElement
      requestAnimationFrame(() => {
        elm.scrollLeft = 12 * context.left
      })
      elm.onscroll = () => {
        elm.scrollLeft = 12 * context.left
      }
    }
  }

  const isTargetted = context.targetted === line.id
  let namespace = context.namespace.concat([context.id])

  return (
    <div
      id={line.id}
      // hero={{
      //   id: line.id,
      // }}
      class={{
        'portal-instance': true,
        '-targetted': isTargetted,
        '-targettable': Boolean(context.targetted && !isTargetted),
      }}
      style={{
        'margin-left': `calc(var(--ch) * ${context.left})`,
        'max-width': `calc(var(--ch) * ${context.width})`,
        overflow: 'hidden',
      }}
      namespace={namespace}
      scrollLeft={context.left * 12}
      hook={{ insert: hook, update: hook }}
      data={{
        draggable: context.movable,
      }}
    >
      <div
        data={{
          dropzone: 'left',
          lineIndex: line.start,
          columnIndex: index - 0.5,
        }}
        className="dropzone -left"
      ></div>
      <div
        data={{
          dropzone: 'right',
          lineIndex: line.start,
          columnIndex: index + 0.5,
        }}
        className="dropzone -right"
      ></div>
      {EditorContent({
        content: context.content,
        portals: context.portals,
        buffer: context.buffer,
        left: context.left,
        movable: context.movable,
        namespace,
        selection: context.selection,
      })}
    </div>
  )
}
