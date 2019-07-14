import { is, last, isNil, filter, map, join } from 'ramda'

interface Dict<T> {
    [id: string]: T
}

export type BufferContent = Placeholder | Destination | Text | Opening | Ending
export type PortalsDict = Dict<Portal>


interface Context {
    content: Array<BufferContent>,
    portals: Dict<Partial<Portal>>,
}

type LineCount = number
type CharCount = number
type Id = string

export interface Portal {
    id?: Id
    start: LineCount
    end: LineCount
    width: CharCount
    content: Array<BufferContent>,
}

export interface PortalInstance extends Portal {
    top: LineCount
    left: LineCount
    height: LineCount
}

interface Token {
    tag: string
    id: Id
    pos?: ('start' | 'end'),
    original: string,
}

export interface Opening {
    type: 'opening'
    for: string
    start: LineCount
    end: LineCount
}

export interface Ending {
    type: 'ending'
    for: string
    start: LineCount
    end: LineCount
}

export interface Placeholder {
    type: 'placeholder'
    for: string
}

export interface Destination {
    type: 'destination'
    for: string
    start: LineCount
    end: LineCount
}

export interface Text {
    type: 'text'
    start: LineCount
    end: LineCount
}


export function parse(text: string): Context {
    const lines = text.split('\n').map((line) => {
        return tokenize(line) || line
    })

    const ctx = lines.reduce((context, line, index) => {
        if (is(String, line)) {
            return pushToOpenedElements({ type: 'text', start: index, end: index }, context)
        }
        if (line.tag === 'warp') {
            pushToOpenedElements({ type: 'destination', for: line.id, start: index, end: index }, context)
            return context
        }
        if (line.tag === 'portal') {
            if (line.pos === 'start') {
                pushToOpenedElements({ type: 'opening', for: line.id, start: index, end: index }, context)
                context.portals[line.id] = {
                    id: line.id,
                    start: index + 1,
                    content: []
                }
                return context
            }
            if (line.pos === 'end') {
                let matching = context.portals[line.id]
                if (matching) {
                    context.portals[line.id] = {
                        ...matching,
                        end: index - 1,
                    }
                }

                pushToOpenedElements({ type: 'ending', for: line.id, start: index, end: index }, context)
                return context
            }
        }
        return context
    }, { content: [], portals: {} } as Context)

    return joinStrings(ctx)
}

function pushToOpenedElements(toPush: BufferContent, context: Context): Context {
    let openedPortals = Object.values(context.portals).filter(x => !isComplete(x))

    if (!openedPortals.length) {
        context.content.push(toPush)
        return context
    }

    openedPortals.forEach((portal = {}) => {
        (portal.content || []).push(toPush)
    })
    return context
}

function joinStrings<T>(x: T): T {
    if (Array.isArray(x)) {
        return x.reduce((acc, curr) => {
            const prev = last(acc)
            if (curr.type === 'text') {
                if (prev && prev.type === 'text') {
                    prev.end = curr.end
                } else {
                    acc.push(curr)
                }
            } else {
                acc.push(joinStrings(curr))
            }

            return acc
        }, [])
    }

    if (x && ('portals' in x)) {
        let portals = (x as unknown as { portals: unknown }).portals as Dict<T>
        x = {
            ...x,
            portals: map(joinStrings, portals)
        }
    }
    if (x && ('content' in x)) {
        x = {
            ...x,
            content: joinStrings((x as unknown as { content: unknown }).content)
        }
    }

    return x
}


function isComplete(x: any) {
    return x && !isNil(x.start) && !isNil(x.end)
}

function isComment(str: string) {
    return str.trim().startsWith('//')
}

function tokenize(str: string) {
    if (!isComment(str)) return null

    let tokens = str.split(' ')

    let returned: Token = {
        tag: '',
        id: '',
        pos: undefined,
        original: str,
    }

    tokens.forEach(token => {
        if (token === 'WARP') {
            returned.tag = 'warp'
        }
        if (token === 'PORTAL') {
            returned.tag = 'portal'
            returned.pos = 'start'
        }
        if (token === '/PORTAL') {
            returned.tag = 'portal'
            returned.pos = 'end'
        }
        if (returned.tag && token.startsWith('#')) {
            returned.id = token.replace(/^#/, '')
        }
    })

    if (!returned.tag) {
        return null
    }

    return returned
}