import { Intents } from './intent'
import { State } from '..'

export function updates(intents: Intents) {
  return intents.dragging$.map(transform => (curr: State) => {
    return {
      ...curr,
      transform: transform.id
        ? {
            id: transform.id,
            target: transform.y - 0.5,
          }
        : undefined,
    }
  })
}
