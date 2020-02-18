import { filter, isNil, pipe, map } from 'ramda'
import { Portal, Dict, Token, Id } from '../types'
import { fromArray } from '@collectable/sorted-map'

export function referencePortals(tokens: Array<[number, Token]>) {
  const referencedPortals = tokens.reduce((dict, [index, token]) => {
    if (token.tag === 'text' || !token.portal) {
      return dict
    }
    if (token.tag === 'warp') {
      dict[token.portal] = {
        ...dict[token.portal],
        id: token.portal,
        warped: true,
      }
    }

    if (token.tag !== 'portal') {
      return dict
    }

    if (token.pos === 'start') {
      let portal = dict[token.portal]
      dict[token.portal] = {
        content: fromArray([]),
        ...portal,
        id: token.portal,
        boundingRect: {
          columnStart: -1,
          columnEnd: -1,
          lineEnd: -1,
          ...portal?.boundingRect,
          lineStart: index,
        },
      }
    }

    if (token.pos === 'end') {
      let portal = dict[token.portal]
      dict[token.portal] = {
        content: fromArray([]),
        ...portal,
        boundingRect: {
          columnStart: -1,
          columnEnd: -1,
          lineStart: -1,
          ...portal?.boundingRect,
          lineEnd: index,
        },
      }
    }

    return dict
  }, {} as Dict<Partial<Portal>>)

  let finalize = pipe(filter(isComplete), map(normalize)) as any

  return finalize(referencedPortals) as Dict<Portal>
}

function isComplete(x: any) {
  return (
    x &&
    x.warped &&
    x.content &&
    x.boundingRect.lineStart !== -1 &&
    x.boundingRect.lineEnd !== -1
  )
}

function normalize(portal: Portal): Portal {
  let { lineStart, lineEnd } = portal.boundingRect
  if (lineStart - lineEnd === 2) {
    return {
      ...portal,
      boundingRect: {
        ...portal.boundingRect,
        lineStart: lineStart - 1,
        lineEnd: lineEnd + 1,
      },
    }
  }
  return portal
}
