import { State } from './index'
import { Stream } from 'xstream'
import { VNode } from '@cycle/dom'
import dropRepeats from 'xstream/extra/dropRepeats'

import { equals } from 'ramda'
import { viewModel } from './viewModel'
import { EditorContent } from './EditorContent'

export function view(state$: Stream<State>): Stream<VNode> {
  return state$
    .compose(dropRepeats(equals))
    .map(viewModel)
    .map(state => {
      const content = EditorContent({ ...state, namespace: [] })

      return (
        <div class={{ 'editor-wrapper': true, '-movable': state.movable }}>
          <button attrs-action="toggle-preview">TOGGLE PREVIEW</button>
          {content}
        </div>
      )
    })
}
