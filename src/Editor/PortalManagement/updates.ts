import { Intents } from './intent'
import { State } from '..'

export function updates(intents: Intents) {
  return intents.dragging$.map(transform => (curr: State) => {
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
}
