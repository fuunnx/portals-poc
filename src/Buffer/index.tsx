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
  movable: Boolean
  value?: string
  width?: number
}

export function Buffer({
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
}: BufferElement) {
  const printed = value
    .split('\n')
    .slice(start, end + 1)
    .join('\n')

  const startOffset = value
    .split('\n')
    .slice(0, start)
    .join('\n').length

  function hook(vnode: VNode) {
    if (vnode.elm) {
      let elm = vnode.elm as HTMLElement
      if (elm.innerText.trim() !== printed.trim()) {
        elm.innerText = printed
      }

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
      data={{
        buffer: id,
        lineOffset: start,
        startOffset,
        endOffset: startOffset + printed.length,
        value,
      }}
      key={key || `id-${start}-${end}`}
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
    ></pre>
  )
}
