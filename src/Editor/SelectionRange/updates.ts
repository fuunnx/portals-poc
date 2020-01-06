import { Intents } from './intent'
import { State, Reducer } from '..'
import { Token } from 'src/lang'
import { SelectedLines } from '.'
import { Stream } from 'xstream'

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
  return [
    [
      range.start,
      {
        tag: 'portal',
        portal: 'selectionRange',
        pos: 'start',
        original: null,
      },
    ],
    [
      range.start,
      {
        tag: 'warp',
        portal: 'selectionRange',
        original: null,
      },
    ],
    [
      range.end,
      {
        tag: 'portal',
        portal: 'selectionRange',
        pos: 'end',
        original: null,
      },
    ],
  ] as [number, Token][]
}
