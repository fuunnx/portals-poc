import { VNode } from '@cycle/dom'
import { Destination, Dict } from '../../lang'
import { CleanPortal } from 'src/lang/parse/cleanupContent'
import { EditorContent } from './EditorContent'
import { TextNode } from './TextNode'

type PortaProps = CleanPortal & {
  width: number
  movable: boolean
  namespace: string[]
  portals: Dict<CleanPortal>
  buffer: string
}

export function RenderPortalInstance(line: Destination, portal: PortaProps) {
  function hook(vnode: VNode) {
    if (vnode.elm) {
      let elm = vnode.elm as HTMLElement
      requestAnimationFrame(() => {
        elm.scrollLeft = 12 * portal.left
      })
      elm.onscroll = () => {
        elm.scrollLeft = 12 * portal.left
      }
    }
  }

  let namespace = portal.namespace.concat([portal.id])
  return (
    <div
      class={{ 'portal-instance': true }}
      style={{
        'margin-left': `calc(var(--ch) * ${portal.left})`,
        'max-width': `calc(var(--ch) * ${portal.width})`,
        overflow: 'hidden',
      }}
      scrollLeft={portal.left * 12}
      hook={{ insert: hook, update: hook }}
    >
      {TextNode({
        ...line,
        left: portal.left,
        width: portal.width,
        movable: portal.movable,
        namespace,
        buffer: portal.buffer,
      })}
      {EditorContent({
        content: portal.content,
        portals: portal.portals,
        buffer: portal.buffer,
        left: portal.left,
        movable: portal.movable,
        namespace,
      })}
    </div>
  )
}
