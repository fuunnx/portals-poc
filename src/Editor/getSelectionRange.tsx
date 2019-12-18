import xs from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import { Sources } from './index'
import { equals } from 'ramda'

export function getSelectionRange(sources: Sources) {
  const { selection, state } = sources

  const currentRange$ = selection
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
    .compose(dropRepeats(equals))

  const range$ = xs
    .combine(
      currentRange$,
      state.stream.map(x => x.buffer).compose(dropRepeats()),
    )
    .map(([range, buffer]: [Range, string]):
      | {
          start: number
          end: number
        }
      | undefined => {
      if (!range) return
      const start = buffer.slice(0, range.startOffset).split('\n').length - 1
      const end = buffer.slice(0, range.endOffset - 1).split('\n').length - 1
      return { start, end }
    })

  return range$
}
