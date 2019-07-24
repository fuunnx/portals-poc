import { Id } from '../types'

export interface Token {
    tag: string
    id: Id
    pos?: 'start' | 'end'
    original: string
}


export function tokenize(str: string) {
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

function isComment(str: string) {
    return str.trim().startsWith('//')
}
