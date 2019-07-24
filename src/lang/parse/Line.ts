import { Token } from './tokenize'
import { Base, Text, Destination, Opening, Ending } from '../types'

export function TextLine(index: number, line: string): Text {
    return {
        type: 'text',
        ...calcPosition(index, line),
    }
}

export function DestinationLine(index: number, token: Token): Destination {
    return {
        type: 'destination',
        for: token.id,
        ...calcPosition(index, token.original),
    }
}

export function OpeningLine(index: number, token: Token): Opening {
    return {
        type: 'opening',
        for: token.id,
        ...calcPosition(index, token.original),
    }
}

export function EndingLine(index: number, token: Token): Ending {
    return {
        type: 'ending',
        for: token.id,
        ...calcPosition(index, token.original),
    }
}

export function calcPosition(index: number, str: string): Base {
    const left = ((str.match(/^[\s]+/g) || [])[0] || '').length
    return {
        start: index,
        end: index,
        left: left,
        right: str.length,
    }
}