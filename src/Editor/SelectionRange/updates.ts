import { Intents } from './intent'
import { State, Reducer } from '..'
import { Token } from 'src/lang'
import { SelectedLines } from '.'
import { Stream } from 'xstream'
import randomWords from 'random-words'

export function updates(intents: Intents): Stream<Reducer> {
  return intents.range$.map(range => (state: State) => {
    if (state.movable) return state
    if (!range) return { ...state, range: undefined }

    const { buffer } = state
    const start = buffer.slice(0, range.startOffset).split('\n').length - 1
    const end = buffer.slice(0, range.endOffset - 1).split('\n').length - 1

    return {
      ...state,
      range: SelectionRange({ start, end }),
    }
  })
}

function SelectionRange(range: SelectedLines): [number, Token][] | undefined {
  const portalId = randomWords(2).join('-')

  return [
    [
      range.start,
      {
        id: `${portalId}-start`,
        tag: 'portal',
        portal: portalId,
        pos: 'start',
        original: null,
      },
    ],
    [
      range.start,
      {
        id: `${portalId}-warp`,
        tag: 'warp',
        portal: portalId,
        original: null,
      },
    ],
    [
      range.end === range.start ? range.start + 1 : range.end,
      {
        id: `${portalId}-end`,
        tag: 'portal',
        portal: portalId,
        pos: 'end',
        original: null,
      },
    ],
  ] as [number, Token][]
}
