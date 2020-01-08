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
      const startBuffer = getContainer(range.startContainer)
      const endBuffer = getContainer(range.endContainer)
      // making a copy is necessary because the range can be mutated from outside

      return {
        lineStart: parseInt(startBuffer.dataset?.lineIndex || '0'),
        lineEnd: parseInt(endBuffer.dataset?.lineIndex || '0'),
        columnStart: range.startOffset,
        endOffset: range.endOffset,
      }
    })
    .compose(dropRepeats(equals)) as Stream<SelectedChars | undefined>

  return {
    range$,
  }
}

function getContainer(element: any): any {
  while (!element.dataset?.lineIndex && element.parentNode) {
    element = element.parentNode
  }
  return element
}
