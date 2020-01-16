import { State } from '../index'
import { parse, Token } from '../../lang'
import { TextLine } from 'src/lang/parse/Line'
import { cleanupContext } from 'src/lang/parse/cleanupContent'
import { Selection } from 'monaco-editor'
import randomWords from 'random-words'

export function stateToAST(state: State) {
  return parse(state.buffer, {
    add:
      state.movable && state.selection ? SelectionRange(state.selection) : [],
    move: state.copiable ? undefined : state.transform,
    copy: state.copiable ? state.transform : undefined,
  })
}

function SelectionRange(selection: Selection): [number, Token][] | undefined {
  const portalId = randomWords(2).join('-')

  return [
    [
      selection.startLineNumber - 1,
      {
        id: `${portalId}-start`,
        tag: 'portal',
        portal: portalId,
        pos: 'start',
        original: null,
      },
    ],
    [
      selection.startLineNumber - 1,
      {
        id: `${portalId}-warp`,
        tag: 'warp',
        portal: portalId,
        original: null,
      },
    ],
    [
      selection.endLineNumber - 1,
      {
        id: `${portalId}-end`,
        tag: 'portal',
        portal: portalId,
        pos: 'end',
        original: null,
      },
    ],
  ] as [number, Token][]
}

export function viewModel(state: State) {
  if (state.disabled) {
    return {
      buffer: state.buffer,
      content: [
        [
          {
            ...TextLine(0, { id: '0', tag: 'text', original: state.buffer }),
            end: state.buffer.split('\n').length + 1,
          },
        ],
      ],
      portals: {},
      movable: state.movable,
      targetted: undefined,
      disabled: true,
    }
  }

  return {
    buffer: state.buffer,
    ...cleanupContext(stateToAST(state)),
    movable: state.movable,
    targetted: state.draggedElement,
    disabled: false,
  }
}
