import { is, last, isNil, filter, map, join } from 'ramda'

interface Dict<T> {
    [id: string]: T
}

type BufferContent = string | Placeholder | Destination
type PortalsDict = Dict<Portal>


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

interface Placeholder {
    type: 'placeholder'
    for: string
}

interface Destination {
    type: 'destination'
    for: string
}


export function parse(text: string): Context {
    const lines = text.split('\n').map((line) => {
        return tokenize(line) || line
    })

    const context = lines.reduce((context, line, index) => {
        if (is(String, line)) {
            return pushToOpenedElements(line, context)
        }
        if (line.tag === 'warp') {
            pushToOpenedElements(line.original, context)
            pushToOpenedElements({ type: 'destination', for: line.id }, context)
            return context
        }
        if (line.tag === 'portal') {
            if (line.pos === 'start') {
                pushToOpenedElements(line.original, context)
                pushToOpenedElements({ type: 'placeholder', for: line.id }, context)
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

                pushToOpenedElements(line.original, context)
                return context
            }
        }
        return context
    }, { content: [], portals: {} } as Context)

    return joinStrings(context)
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
            if (is(String, curr)) {
                if (is(String, prev)) {
                    acc[acc.length - 1] = `${prev}\n${curr}`
                } else {
                    acc.push(curr)
                }
            } else {
                acc.push(joinStrings(curr))
            }

            return acc
        }, [])
    }

    if (x && ('content' in x)) {
        return {
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