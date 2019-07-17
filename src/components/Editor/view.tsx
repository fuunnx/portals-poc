import { Buffer } from '../buffer'
import { State } from './index'
import { Stream } from 'xstream'
import { VNode } from '@cycle/dom'
import { parse, BufferContent, PortalsDict } from '../../parser'
import dropRepeats from 'xstream/extra/dropRepeats'
import { equals } from 'ramda'

export function view(state$: Stream<State>): Stream<VNode> {
  return state$
    .map(state => {
      return { buffer: state.buffer, ...parse(state.buffer) }
    })
    .map(editor)
}

function editor({
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
  const children = content.map((x, i) => {
    const key = i
    if (x.type === 'text') {
      return text(buffer, x, key, parentLeft)
    }
    const matchingPortal = portals[x.for]
    const left = Math.min(x.left, matchingPortal.left)
    const width = Math.max(x.right, matchingPortal.right) - left + 1 + 10

    if (x.type === 'opening' || x.type === 'ending') {
      return text(buffer, x, key, left, width)
    }

    if (x.type === 'destination') {
      if (!matchingPortal) {
        return text(buffer, x, key, left, width)
      }
      return (
        <div
          className="portal-instance"
          style={{
            'margin-left': `calc(var(--ch) * ${left})`,
            'max-width': `calc(var(--ch) * ${width})`,
            overflow: 'hidden',
          }}
          scrollLeft={left * 12}
          hook={{
            update: vnode => {
              if (vnode.elm) {
                let elm = vnode.elm as HTMLElement
                elm.scrollLeft = 12 * left

                elm.onscroll = () => {
                  elm.scrollLeft = 12 * left
                }
              }
            },
          }}
        >
          {text(buffer, x, key, left, width)}
          {editor({
            content: matchingPortal.content,
            portals,
            buffer,
            left: matchingPortal.left,
          })}
        </div>
      )
    }
    return null
  })

  console.log(content, children)

  return <div className="editor">{children}</div>
}

function text(
  buffer: string,
  x: { start: number; end: number; type?: string },
  key?: string | number,
  left?: number,
  width?: number,
) {
  return (
    <Buffer
      value={buffer}
      key={key}
      className={x.type || ''}
      start={x.start}
      end={x.end}
      width={width}
      left={left}
    />
  )
}
