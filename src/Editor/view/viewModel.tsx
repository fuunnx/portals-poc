import { State } from '../index'
import { parse } from '../../lang'
import { cleanupContent } from '../../lang/parse'
import { TextLine } from 'src/lang/parse/Line'

export function viewModel(state: State) {
  if (state.disabled) {
    return {
      buffer: state.buffer,
      content: [
        [
          {
            ...TextLine(0, { tag: 'text', original: state.buffer }),
            end: state.buffer.split('\n').length + 1,
          },
        ],
      ],
      portals: {},
      movable: state.movable,
    }
  }

  let context = parse(state.buffer, {
    add: state.movable ? state.range : [],
    move: state.transform,
  })

  return {
    buffer: state.buffer,
    ...cleanupContent(context),
    movable: state.movable,
  }
}
