import './buffer.scss'
import { VNodeStyle } from 'snabbdom/modules/style'
import { Selection } from 'monaco-editor'
import { h } from '@cycle/dom'
import merge from 'snabbdom-merge'
import { BoundingRect } from 'src/lang'
import { CodeEditor } from './CodeEditor'

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
  selection?: Selection
  voids: BoundingRect[]
  cuts: BoundingRect[]
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
    selection,
    voids,
    cuts,
  } = props
  const height = end - start + 1

  return merge(
    <CodeEditor
      id={id}
      selection={selection}
      value={value}
      left={left}
      start={start}
      zones={voids.map(zone => {
        return {
          afterLineNumber: Math.round(zone.lineStart + 1),
          afterColumn: Math.round(zone.columnStart),
          heightInLines: Math.round(zone.lineEnd - zone.lineStart + 1),
        }
      })}
      cuts={cuts}
      data={{
        buffer: true,
        draggable: movable,
      }}
      props-namespace={namespace}
      key={key || id}
      style={Object.assign(
        {
          '--height': String(height),
          '--left': String(left),
          '--width': String(width),
          'z-index': String(namespace.length),
        },
        style,
      )}
      className={[className, 'buffer', movable && '-movable']
        .filter(Boolean)
        .join(' ')}
    />,
    h('code', props),
  )
}
