import './buffer.scss'
import { VNodeStyle } from 'snabbdom/modules/style'
import { VNode } from '@cycle/dom'

interface BufferElement {
  id?: string | number
  key?: string | number
  className?: string
  style?: VNodeStyle
  start?: number
  left?: number
  end?: number
  movable: boolean
  value?: string
  width?: number
  namespace: string[]
}

export function Buffer(props: BufferElement) {
  const {
    key,
    className,
    style = {},
    movable,
    start = 0,
    left = 0,
    end = 0,
    value = '',
    width = 0,
    id,
    namespace,
  } = props

  const printedLines = value.split('\n').slice(start, end + 1)

  const printed = printedLines.join('\n')

  const startOffset = value
    .split('\n')
    .slice(0, start)
    .join('\n').length

  function hook(vnode: VNode) {
    if (vnode.elm) {
      let elm = vnode.elm as HTMLElement
      requestAnimationFrame(() => {
        elm.scrollTop = 25 * start
        elm.scrollLeft = 12 * left
      })

      elm.onscroll = () => {
        elm.scrollTop = 25 * start
        elm.scrollLeft = 12 * left
      }
    }
  }

  // don't use textarea, selection can't be measured on textareas
  return (
    <pre
      id={id}
      data={{
        buffer: true,
        lineOffset: start,
        startOffset,
        endOffset: startOffset + printed.length,
        value,
        draggable: movable,
      }}
      props-namespace={namespace}
      key={key || id}
      style={Object.assign(
        {
          '--height': String(end - start + 1),
          '--left': String(left || 0),
          '--width': String(width || 999),
        },
        style,
      )}
      className={[className, 'buffer', movable && '-movable']
        .filter(Boolean)
        .join(' ')}
      attrs-contenteditable={!movable}
      attrs-spellcheck={false}
      scrollTop={25 * start}
      scrollLeft={12 * left}
      wrap="off"
      hook={{
        insert: hook,
        update: hook,
      }}
    >
      {printedLines.map((line, index) => (
        <div className="line" data-lineIndex={start + index}>
          {line || '\r'}
        </div>
      ))}
    </pre>
  )
}
