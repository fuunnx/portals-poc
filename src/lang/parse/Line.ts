import { Base, Text, Destination, Opening, Ending, Token } from '../types'

export function TextLine(index: number, token: Token): Text {
  return {
    type: 'text',
    ...calcPosition(index, token),
    id: token.id,
  }
}

export function DestinationLine(index: number, token: Token): Destination {
  return {
    type: 'destination',
    for: token.portal || '',
    ...calcPosition(index, token),
    id: token.id,
  }
}

export function OpeningLine(index: number, token: Token): Opening {
  return {
    type: 'opening',
    for: token.portal || '',
    ...calcPosition(index, token),
    id: token.id,
  }
}

export function EndingLine(index: number, token: Token): Ending {
  return {
    type: 'ending',
    for: token.portal || '',
    ...calcPosition(index, token),
    id: token.id,
  }
}

export function calcPosition(index: number, token: Token): Base {
  if (token.original === null) {
    return {
      id: '',
      boundingRect: {
        lineStart: index,
        lineEnd: Infinity,
        columnStart: Infinity,
        columnEnd: -Infinity,
      },
      position: {
        line: index,
        column: Infinity,
      },
    }
  }

  const left =
    ((token.original.match(/^[\s]+/g) || [])[0] || '').length + token.left
  return {
    id: '',
    boundingRect: {
      lineStart: index,
      lineEnd: index,
      columnStart: left,
      columnEnd: token.original.length + left,
    },
    position: {
      line: index,
      column: left,
    },
  }
}
