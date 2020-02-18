import { State } from '../index'
import { parse, Token } from '../../lang'
import { TextLine } from 'src/lang/parse/Line'
import { cleanupContext } from 'src/lang/parse/cleanupContent'
import { Selection } from 'monaco-editor'
import randomWords from 'random-words'

export function stateToAST(state: State) {
  return parse(state.buffer, {
    add:
      (state.movable || state.copiable) && state.selection
        ? SelectionRange(state.selection)
        : [],
    move: state.copiable ? undefined : state.transform,
    copy: state.copiable ? state.transform : undefined,
  })
}

function SelectionRange(selection: Selection): [number, Token][] | undefined {
  const { startLineNumber, endLineNumber, startColumn, endColumn } = selection
  if (startLineNumber === endLineNumber && startColumn === endColumn) {
    return []
  }
  const portalId = randomWords(2).join('-')

  return [
    [
      startLineNumber - 1,
      {
        id: `${portalId}-start`,
        tag: 'portal',
        portal: portalId,
        pos: 'start',
        original: null,
      },
    ],
    [
      startLineNumber - 1,
      {
        id: `${portalId}-warp`,
        tag: 'warp',
        portal: portalId,
        original: null,
      },
    ],
    [
      endLineNumber - 1,
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
            ...TextLine(0, {
              id: '0',
              tag: 'text',
              original: state.buffer,
              left: 0,
            }),
            end: state.buffer.split('\n').length + 1,
          },
        ],
      ],
      portals: {},
      movable: false,
      targetted: undefined,
      disabled: true,
      selection: state.selection,
    }
  }

  return {
    buffer: state.buffer,
    ...cleanupContext(stateToAST(state)),
    movable: state.movable || state.copiable,
    targetted: state.draggedElement,
    disabled: false,
    selection: state.selection,
  }
}
