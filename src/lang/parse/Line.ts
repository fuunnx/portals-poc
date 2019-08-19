import { Base, Text, Destination, Opening, Ending, Token } from '../types'

export function TextLine(index: number, token: Token): Text {
    return {
        type: 'text',
        ...calcPosition(index, token.original),
    }
}

export function DestinationLine(index: number, token: Token): Destination {
    return {
        type: 'destination',
        for: token.portal || '',
        ...calcPosition(index, token.original),
    }
}

export function OpeningLine(index: number, token: Token): Opening {
    return {
        type: 'opening',
        for: token.portal || '',
        ...calcPosition(index, token.original),
    }
}

export function EndingLine(index: number, token: Token): Ending {
    return {
        type: 'ending',
        for: token.portal || '',
        ...calcPosition(index, token.original),
    }
}

export function calcPosition(index: number, str: string | null): Base {
    if (str === null) {
        return {
            start: index,
            end: undefined,
            left: Infinity,
            right: -Infinity,
        }
    }

    const left = ((str.match(/^[\s]+/g) || [])[0] || '').length
    return {
        start: index,
        end: index,
        left: left,
        right: str.length,
    }
}