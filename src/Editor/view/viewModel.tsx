import { State } from '../index'
import { parse, stringify } from '../../lang'
import { TextLine } from 'src/lang/parse/Line'
import { cleanupContext } from 'src/lang/parse/cleanupContent'

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
    }
  }

  let context = parse(state.buffer, {
    add: state.movable ? state.range : [],
    move: state.copiable ? undefined : state.transform,
    copy: state.copiable ? state.transform : undefined,
  })

  return {
    buffer: state.buffer,
    ...cleanupContext(context),
    movable: state.movable,
    targetted: state.draggedElement,
  }
}
