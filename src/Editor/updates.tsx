import xs from 'xstream'
import { Intents } from './intent'
import { Token, parse, stringify } from '../lang'
import { initialState } from './initialState'
import dropRepeats from 'xstream/extra/dropRepeats'
import { State, Reducer } from './index'
export function updates(intents: Intents) {
  const input$ = intents.input$
    .compose(dropRepeats())
    .map(buffer => (currState: State) => {
      return {
        ...currState,
        buffer,
      }
    })
  const init$ = xs.of<Reducer>(prevState =>
    prevState === undefined ? initialState : prevState,
  )
  const commit$ = intents.commit$.mapTo((currState: State) => {
    const parsed = parse(currState.buffer, {
      add: currState.movable ? currState.range : [],
      move: currState.transform,
    })
    return {
      ...currState,
      movable: false,
      transform: undefined,
      buffer: stringify(parsed),
    }
  })
  const togglePreview$ = intents.togglePreview$.mapTo((st: State) => ({
    ...st,
    disabled: !st.disabled,
  }))
  const startMoving$ = intents.startMoving$.map(transform => (curr: State) => {
    return {
      ...curr,
      transform: Number.isFinite(transform.id)
        ? {
            target: transform.id,
            offset: transform.y - transform.id,
          }
        : undefined,
    }
  })
  const range$ = intents.range$.map(range => (curr: State) => ({
    ...curr,
    range: [
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
    ] as [number, Token][],
  }))
  const movable$ = intents.movable$.map(movable => (curr: State) => ({
    ...curr,
    movable: Boolean(movable),
  }))
  const copiable$ = intents.copiable$.map(copiable => (curr: State) => ({
    ...curr,
    copiable: Boolean(copiable),
  }))
  return xs.merge(
    input$,
    init$,
    commit$,
    togglePreview$,
    startMoving$,
    range$,
    movable$,
    copiable$,
  )
}
