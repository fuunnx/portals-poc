import { isNil } from 'ramda'
import { Buffer } from './Buffer'

type TextNodeProps = {
  id: string
  start: number
  end?: number
  type?: string
  left?: number
  width?: number
  movable: boolean
  namespace: string[]
  buffer: string
}

export function TextNode(x: TextNodeProps) {
  if (isNil(x.end)) return null
  return (
    <Buffer
      id={x.id}
      className={`-${x.type}`}
      value={x.buffer}
      start={x.start}
      end={x.end}
      width={x.width}
      left={x.left}
      movable={x.movable}
      namespace={x.namespace}
    />
  )
}
