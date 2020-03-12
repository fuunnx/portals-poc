import './editor.scss'

import { State } from '../index'
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
      const content = EditorContent({
        ...state,
        namespace: [],
        start: 0,
        end: state.buffer.split('\n').length + 1,
      })

      return (
        <div
          class={{
            'editor-wrapper': true,
            '-movable': Boolean(state.movable || state.targetted),
          }}
        >
          <label className="toggle-button">
            <input
              type="checkbox"
              attrs-action="toggle-preview"
              checked={state.disabled}
            />
            <div className="background" />
            <div className="button" />
          </label>
          {content}
        </div>
      )
    })
}
