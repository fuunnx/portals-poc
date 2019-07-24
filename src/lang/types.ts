export interface Dict<T> {
    [id: string]: T
}

export type BufferContent = Placeholder | Destination | Text | Opening | Ending
export type PortalsDict = Dict<Portal>

export interface Context {
    content: Array<BufferContent>
    portals: Dict<Portal>
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
    content: Array<BufferContent>
    warped?: boolean
}

export interface PortalInstance extends Portal {
    top: LineCount
    left: CharCount
    right: CharCount
    height: LineCount
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
    end: LineCount
    left: CharCount
    right: CharCount
}