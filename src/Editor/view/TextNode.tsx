import { isNil } from 'ramda'
import { Buffer } from './Buffer'
import { Selection } from 'monaco-editor'
import { BoundingRect } from 'src/lang'

type TextNodeProps = {
  id: string
  start: number
  end?: number
  type?: string
  left?: number
  right?: number
  width?: number
  movable: boolean
  voids: BoundingRect[]
  cuts: BoundingRect[]
  namespace: string[]
  buffer: string
  selection?: Selection
}

export function TextNode(x: TextNodeProps) {
  if (isNil(x.end)) return null
  if (!x.left && !x.right) return null

  return (
    <Buffer
      id={x.id}
      className={`-${x.type}`}
      value={x.buffer}
      start={x.start}
      end={x.end}
      width={x.width}
      left={x.left}
      voids={x.voids}
      cuts={x.cuts}
      movable={x.movable && x.type !== 'text'}
      namespace={x.namespace}
      selection={x.selection}
    />
  )
}
