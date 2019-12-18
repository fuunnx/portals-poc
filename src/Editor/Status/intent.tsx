import xs, { Stream, MemoryStream } from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import { Sources } from '../index'

export type Intents = {
  movable$: MemoryStream<boolean>
  copiable$: MemoryStream<boolean>
  togglePreview$: Stream<null>
}

export function intent(sources: Sources): Intents {
  const { DOM } = sources

  const togglePreview$ = DOM.select('[action="toggle-preview"]')
    .events('click')
    .mapTo(null)

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
    togglePreview$,
  }
}
