import { is, last, isNil, filter } from 'ramda'

interface Dict {
    [id: string]: any;
}

interface Context {
    id?: string,
    start?: number,
    end?: number,
    children: Array<Context | Token | string | Placeholder | Destination>,
    portals: Dict,
    parent?: Context,
}

interface Token {
    tag: string
    id: string
    pos: ('start' | 'end' | undefined),
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

export function parse(text: string) {
    let lines = text.split('\n').map((line) => {
        return tokenize(line) || line
    });

    let portals = lines.reduce((portals, token, index) => {
        if (is(String, token)) return portals

        if (token.pos === 'start' && token.tag === 'portal') {
            portals[token.id] = {
                id: token.id,
                start: index,
            }
        }

        if (token.pos === 'end' && token.tag === 'portal') {
            let existing = portals[token.id]
            if (existing) {
                portals[token.id] = {
                    ...existing,
                    end: index,
                }
            }
        }

        return portals
    }, {} as Dict)

    let completePortals = filter(isComplete, portals)



    const walk = makeWalker(lines)

    function pushToChildren(context: Context, x: string) {
        let prev = last(context.children)

        if (is(String, prev)) {
            context.children[(context.children.length - 1)] = `${prev}\n${x}`
        } else {
            context.children.push(x)
        }
        return context

    }

    function walker(context: Context, token: Token, index: number) {
        if (is(String, token)) {
            return pushToChildren(context, token as unknown as string)
        }

        if (token.tag === 'portal') {
            if (token.pos === 'start') {
                context = pushToChildren(context, token.original)
                if (!completePortals[token.id]) return context

                context.children.push({ type: 'placeholder', for: token.id })

                context.portals[token.id] = walk(walker, {
                    id: token.id,
                    start: index + 2,
                    children: [],
                    portals: {},
                    parent: context
                })

                return context
            }

            if (token.pos === 'end' && token.id === context.id && context.parent) {
                context.end = index
                pushToChildren(context.parent, token.original)
                delete context.parent
            }
        }

        if (token.tag === 'warp') {
            pushToChildren(context, token.original)
            if (!completePortals[token.id]) return context

            context.children.push({ type: 'destination', for: token.id })
        }

        return context
    }

    return walk(walker, { children: [], portals: {} })
}



function makeWalker(lines: Array<Token | string>) {
    let walked = lines.slice()
    let index = -1

    return function walk(walker: (i: Context, j: (Token | string), k?: number) => Context, context: Context) {
        while (walked.length) {
            let next = walked.shift()
            if (next === undefined) continue
            context = walker(context, next, index++)
            if (isComplete(context)) {
                break;
            }
        }

        return context
    }
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

    tokens.forEach(str => {
        if (str === 'WARP') {
            returned.tag = 'warp'
        }
        if (str === 'PORTAL') {
            returned.tag = 'portal'
            returned.pos = 'start'
        }
        if (str === '/PORTAL') {
            returned.tag = 'portal'
            returned.pos = 'end'
        }
        if (returned.tag && str.startsWith('#')) {
            returned.id = str.replace(/^#/, '')
        }
    })

    if (!returned.tag) {
        return null
    }

    return returned
}