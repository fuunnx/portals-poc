import { is, filter, isNil } from 'ramda'
import { Portal, Dict, Token } from '../types'
import { fromArray } from '@collectable/sorted-map'


export function referencePortals(tokens: Array<[number, Token]>) {
    return filter(
        isComplete,
        tokens.reduce(
            (dict, [index, token]) => {
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
                        ...dict[token.portal],
                        id: token.portal,
                        start: index + 1,
                        left: 0,
                        right: 0,
                        content: fromArray([]),
                    }
                }

                if (token.pos === 'end') {
                    if (dict[token.portal]) {
                        dict[token.portal] = {
                            ...dict[token.portal],
                            end: index - 1,
                        }
                    }
                }

                return dict
            },
            {} as Dict<Partial<Portal>>,
        ),
    ) as Dict<Portal>
}


function isComplete(x: any) {
    return x && x.warped && x.content && !isNil(x.start) && !isNil(x.end)
}