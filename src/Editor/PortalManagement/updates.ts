import { Intents } from './intent'
import { State } from '..'
import xs from 'xstream'

export function updates(intents: Intents) {
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
        transform: transform.id
          ? {
              id: transform.id,
              target: transform.y - 0.5,
            }
          : undefined,
      }
    }),
  )
}
