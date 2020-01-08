import { Sources } from '..'
import { updates } from './updates'
import { intent } from './intent'

export type SelectedLines = { start: number; end: number }
export type SelectedChars = {
  lineStart: number
  lineEnd: number
  columnStart: number
  columnEnd: number
}

export function SelectionRange(sources: Sources) {
  return {
    state: updates(intent(sources)),
  }
}
