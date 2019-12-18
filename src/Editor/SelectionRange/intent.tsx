import xs, { Stream } from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import { Sources } from '../index'
import { equals } from 'ramda'
import { SelectedChars } from '.'

export type Intents = {
  range$: Stream<SelectedChars | undefined>
}

export function intent(sources: Sources) {
  const { selection } = sources

  const range$ = selection
    .selections()
    .map(selec => {
      if (!selec.rangeCount) return undefined
      const range = selec.getRangeAt(0)
      if (range.collapsed) return undefined
      // there are cross browser issues that need to be solved (firefox for eg)
      const startContainer = range.startContainer.parentNode as HTMLElement
      const endContainer = range.endContainer.parentNode as HTMLElement
      // making a copy is necessary because the range can be mutated from outside
      return {
        startOffset:
          range.startOffset +
          parseInt(startContainer.dataset.startOffset || ''),
        endOffset:
          range.endOffset + parseInt(endContainer.dataset.startOffset || ''),
      }
    })
    .compose(dropRepeats(equals)) as Stream<SelectedChars | undefined>

  return {
    range$,
  }
}
