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
      dict[token.portal] = {
        content: fromArray([]),
        ...dict[token.portal],
        id: token.portal,
        start: index,
      }
    }

    if (token.pos === 'end') {
      dict[token.portal] = {
        content: fromArray([]),
        ...dict[token.portal],
        end: index,
      }
    }

    return dict
  }, {} as Dict<Partial<Portal>>)

  let finalize = pipe(filter(isComplete), map(normalize)) as any

  return finalize(referencedPortals) as Dict<Portal>
}

function isComplete(x: any) {
  return x && x.warped && x.content && !isNil(x.start) && !isNil(x.end)
}

function normalize(portal: Portal): Portal {
  let { start, end } = portal
  if (start - end === 2) {
    return {
      ...portal,
      start: start - 1,
      end: end + 1,
    }
  }
  return portal
}
