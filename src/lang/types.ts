import { SortedMapStructure } from '@collectable/sorted-map'

export interface Dict<T> {
  [id: string]: T
  [id: number]: T
}

export interface NumDict<T> {
  [id: number]: T
}

export type Symbol = Placeholder | Destination | Text | Opening | Ending
export type Symbols = SortedMapStructure<number, Symbol>
export type Content = SortedMapStructure<number, Symbols>
export type PortalsDict = Dict<Portal>

export interface Context {
  buffer: string
  content: Content
  portals: Dict<Portal>
}

export interface Token {
  id: Id
  tag: 'portal' | 'warp' | 'text'
  portal?: Id
  pos?: 'start' | 'end'
  original: string | null
  left: number
}

type LineCount = number
type CharCount = number
export type Id = string

export interface BoundingRect {
  lineStart: LineCount
  lineEnd: LineCount
  columnStart: CharCount
  columnEnd: CharCount
}

export interface Position {
  line: LineCount
  column: CharCount
}

export interface Portal {
  id: Id
  boundingRect: BoundingRect
  content: Content
  warped?: boolean
}

export interface PortalInstance extends Portal {
  width: LineCount
}

export interface Opening extends Ref {
  type: 'opening'
}

export interface Ending extends Ref {
  type: 'ending'
}

export interface Placeholder extends Ref {
  type: 'placeholder'
}

export interface Destination extends Ref {
  type: 'destination'
}

export interface Text extends Base {
  type: 'text'
}

interface Ref extends Base {
  for: Id
}

export interface Base {
  id: Id
  boundingRect: BoundingRect
  position: Position
}
