import { Buffer } from '../Buffer'
import { State } from './index'
import { Stream } from 'xstream'
import { VNode } from '@cycle/dom'
import dropRepeats from 'xstream/extra/dropRepeats'
import {
  parse,
  BufferContent,
  PortalsDict,
  PortalInstance,
  Destination,
} from '../lang'

import { cleanupContent } from '../lang/parse'
import { equals } from 'ramda'

export function view(state$: Stream<State>): Stream<VNode> {
  return state$
    .compose(dropRepeats(equals))
    .map(viewModel)
    .map(EditorContent)
}


function viewModel(state: State) {
  const context = parse(state.buffer)
  console.log(state.range)

  if (state.movable && state.range) {
    console.log(state.range)
  }

  return { buffer: state.buffer, ...cleanupContent(context) }
}


const OFFSET = 1

function EditorContent({
  content,
  portals,
  buffer,
  left: parentLeft = 0,
}: {
  content: Array<BufferContent>
  portals: PortalsDict
  buffer: string
  left?: number
}) {
  const children = content.map((line, index) => {
    if (line.type === 'text') {
      return TextNode({ ...line, left: parentLeft }, index)
    }

    const matchingPortal = portals[line.for]
    const left = Math.max(0, Math.min(line.left, matchingPortal.left) - OFFSET)
    const width =
      Math.max(line.right, matchingPortal.right) - left + 1 + 2 * OFFSET

    if (line.type === 'opening' || line.type === 'ending') {
      return TextNode({ ...line, left, width }, index)
    }

    if (line.type === 'destination') {
      if (matchingPortal) {
        return RenderPortalInstance(
          line,
          { ...matchingPortal, left, width },
          index,
        )
      }
      return TextNode({ ...line, left, width }, index)
    }
    return null
  })

  return <div className="editor">{children}</div>

  function TextNode(
    x: {
      start: number
      end: number
      type?: string
      left?: number
      width?: number
    },
    index: number,
  ) {
    return (
      <Buffer
        key={`texnode-${index}`}
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
    portal: PortalInstance,
    index: number,
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
        key={`portalInstance-${index}`}
        style={{
          'margin-left': `calc(var(--ch) * ${portal.left})`,
          'max-width': `calc(var(--ch) * ${portal.width})`,
          overflow: 'hidden',
        }}
        scrollLeft={portal.left * 12}
        hook={{ insert: hook, update: hook }}
      >
        {TextNode({ ...line, left: portal.left, width: portal.width }, index)}
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
