import { isNil } from 'ramda'
import { Buffer } from '../Buffer'
import { State } from './index'
import { Stream } from 'xstream'
import { VNode } from '@cycle/dom'
import dropRepeats from 'xstream/extra/dropRepeats'
import { parse, Destination } from '../lang'

import { equals } from 'ramda'
import { cleanupContent } from '../lang/parse'
import { CleanPortal, CleanContext } from 'src/lang/parse/cleanupContent'

export function view(state$: Stream<State>): Stream<VNode> {
  return state$
    .compose(dropRepeats(equals))
    .map(viewModel)
    .map(EditorContent)
}


function viewModel(state: State) {
  const context = parse(state.buffer, state.movable ? state.range : {})
  return { buffer: state.buffer, ...cleanupContent(context) }
}


const OFFSET = 1

function EditorContent({
  content,
  portals,
  buffer,
  left: parentLeft = 0,
}: CleanContext & {
  buffer: string
  left?: number
}
) {
  const children = content.map((line) => {
    if (line.type === 'text') {
      return TextNode({ ...line, left: parentLeft })
    }

    const matchingPortal = portals[line.for]
    const left = Math.max(0, Math.min(line.left, matchingPortal.left) - OFFSET)
    const width =
      Math.max(line.right, matchingPortal.right) - left + 1 + 2 * OFFSET

    if (line.type === 'opening' || line.type === 'ending') {
      return TextNode({ ...line, left, width })
    }

    if (line.type === 'destination') {
      if (matchingPortal) {
        return RenderPortalInstance(
          line,
          { ...matchingPortal, left, width },
        )
      }
      return TextNode({ ...line, left, width })
    }
    return null
  })

  return <div className="editor">{children}</div>

  function TextNode(
    x: {
      start: number
      end?: number
      type?: string
      left?: number
      width?: number
    }
  ) {
    if (isNil(x.end)) return null
    return (
      <Buffer
        className={`-${x.type}`}
        value={buffer}
        start={x.start}
        end={x.end}
        width={x.width}
        left={x.left}
      />
    )
  }

  function RenderPortalInstance(
    line: Destination,
    portal: CleanPortal & { width: number },
  ) {
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

    return (
      <div
        className="portal-instance"
        style={{
          'margin-left': `calc(var(--ch) * ${portal.left})`,
          'max-width': `calc(var(--ch) * ${portal.width})`,
          overflow: 'hidden',
        }}
        scrollLeft={portal.left * 12}
        hook={{ insert: hook, update: hook }}
      >
        {TextNode({ ...line, left: portal.left, width: portal.width })}
        {EditorContent({
          content: portal.content,
          portals,
          buffer,
          left: portal.left,
        })}
      </div>
    )
  }
}
