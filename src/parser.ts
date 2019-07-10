interface Dict {
    [id: string]: any;
}

export function parse(text: string) {
    const lines = text.split('\n')

    let portals: Dict = {}

    lines.forEach((line, index) => {
        if (!isComment(line)) return
        let token = tokenize(line)

        if (token.tag === 'warp') {
            portals[token.id] = portals[token.id] || { warpTo: [] }
            portals[token.id].warpTo.push(index)
        }

        if (token.pos === 'start' && token.tag === 'portal') {
            portals[token.id] = {
                id: token.id,
                start: index,
            }
        }

        if (token.pos === 'end' && token.tag === 'portal') {
            let existing = portals[token.id]
            if (!existing) return
            portals[token.id] = {
                ...existing,
                height: index - existing.start + 1,
                end: index,
                warpTo: [],
            }
        }

    });

    return Object.values(portals)
}


function isComment(str: string) {
    return str.trim().startsWith('//')
}


interface Token {
    tag: string
    id: string
    pos: ('start' | 'end' | undefined)
}
function tokenize(str: string) {
    let tokens = str.split(' ')

    let returned: Token = {
        tag: '',
        id: '',
        pos: undefined
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

    return returned
}