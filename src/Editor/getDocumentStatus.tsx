import xs from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import { Sources } from './index'

export function getDocumentStatus(sources: Sources) {
  const { DOM } = sources

  const movable$ = xs
    .merge(
      DOM.select('document')
        .events('keydown')
        .filter((e: KeyboardEvent) => e.key === 'Meta')
        .mapTo(true),
      DOM.select('document')
        .events('keyup')
        .filter((e: KeyboardEvent) => e.key === 'Meta')
        .mapTo(false),
    )
    .startWith(false)
    .compose(dropRepeats())

  const mouseDown$ = xs
    .merge(
      DOM.select('document')
        .events('mousedown')
        .mapTo(true),
      DOM.select('document')
        .events('mouseup')
        .mapTo(false),
    )
    .startWith(false)

  const copiable$ = xs
    .merge(
      DOM.select('document')
        .events('keydown')
        .filter((e: KeyboardEvent) => e.key === 'Alt')
        .mapTo(true),
      DOM.select('document')
        .events('keyup')
        .filter((e: KeyboardEvent) => e.key === 'Alt')
        .mapTo(false),
    )
    .startWith(false)

  return {
    movable$,
    copiable$,
    mouseDown$,
  }
}
