import { Intents } from './intent'
import { State, Reducer } from '..'
import xs, { Stream } from 'xstream'

export function updates(intents: Intents): Stream<Reducer> {
  return xs.merge(
    intents.selectedElement$.map(id => (curr: State) => {
      return {
        ...curr,
        draggedElement: id,
      }
    }),
    intents.dragging$.map(transform => (curr: State) => {
      return {
        ...curr,
        transform: transform.id ? transform : undefined,
      }
    }),
  )
}
