import { Sources } from '..'
import { updates } from './updates'
import { intent } from './intent'

export function Status(sources: Sources) {
  return {
    state: updates(intent(sources)),
  }
}
