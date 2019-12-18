import { Sources } from '..'
import { updates } from './updates'
import { intent } from './intent'

export type SelectedLines = { start: number; end: number }

export function PortalManagement(sources: Sources) {
  return {
    state: updates(intent(sources)),
  }
}
