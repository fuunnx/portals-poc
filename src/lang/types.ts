import { SortedMapStructure } from '@collectable/sorted-map';


export interface Dict<T> {
  [id: string]: T
  [id: number]: T
}

export interface NumDict<T> {
  [id: number]: T
}

export type BufferContent = Placeholder | Destination | Text | Opening | Ending
export type Content = SortedMapStructure<number, BufferContent>
export type PortalsDict = Dict<Portal>

export interface Context {
  content: Content
  portals: Dict<Portal>
}

export interface Token {
  tag: 'portal' | 'warp' | 'text'
  portal?: Id
  pos?: 'start' | 'end'
  original: string | null
}

type LineCount = number
type CharCount = number
export type Id = string

export interface Portal {
  id?: Id
  start: LineCount
  end: LineCount
  left: CharCount
  right: CharCount
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
  start: LineCount
  end?: LineCount
  left: CharCount
  right: CharCount
}
