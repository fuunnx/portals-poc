import { Token } from './tokenize'
import { is, filter, isNil } from 'ramda'
import { Portal, Dict } from '../types'


export function indexPortals(lines: Array<Token | string>) {
    return filter(
        isComplete,
        lines.reduce(
            (dict, line, index) => {
                if (is(String, line)) {
                    return dict
                }
                if (line.tag === 'warp') {
                    dict[line.id] = {
                        ...dict[line.id],
                        id: line.id,
                        warped: true,
                    }
                }

                if (line.tag !== 'portal') {
                    return dict
                }

                if (line.pos === 'start') {
                    dict[line.id] = {
                        ...dict[line.id],
                        id: line.id,
                        start: index + 1,
                        left: 0,
                        right: 0,
                        content: [],
                    }
                }

                if (line.pos === 'end') {
                    if (dict[line.id]) {
                        dict[line.id] = {
                            ...dict[line.id],
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