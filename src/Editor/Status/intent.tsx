import xs, { Stream, MemoryStream } from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import { Sources } from '../index'
import { shortcuts } from 'src/config'

export type Intents = {
  movable$: MemoryStream<boolean>
  copiable$: MemoryStream<boolean>
  togglePreview$: Stream<null>
}

export function intent(sources: Sources): Intents {
  const { DOM } = sources

  const togglePreview$ = xs
    .merge(
      DOM.select('[action="toggle-preview"]').events('click'),
      shortcutIsDown(shortcuts.previewModeToggle).filter(Boolean),
    )
    .mapTo(null)

  const movable$ = shortcutIsDown(shortcuts.moveModeOn)
  const copiable$ = shortcutIsDown(shortcuts.duplicateModeOn)

  return {
    movable$,
    copiable$,
    togglePreview$,
  }

  function shortcutIsDown(shortcut: string) {
    return xs
      .combine(...shortcut.split('+').map(x => keyIsDown(x)))
      .map(all => all.every(Boolean))
  }

  function keyIsDown(keyName: string) {
    return xs
      .merge(
        DOM.select('document')
          .events('keydown')
          .filter((e: KeyboardEvent) => e.key === keyName || e.code === keyName)
          .mapTo(true),
        DOM.select('document')
          .events('keyup')
          .filter((e: KeyboardEvent) => e.key === keyName || e.code === keyName)
          .mapTo(false),
      )
      .startWith(false)
      .compose(dropRepeats())
  }
}
