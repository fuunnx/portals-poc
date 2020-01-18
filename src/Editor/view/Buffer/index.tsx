import './buffer.scss'
import { VNodeStyle } from 'snabbdom/modules/style'
import { VNode } from '@cycle/dom'
import { editor, IDisposable, Selection } from 'monaco-editor'

interface BufferElement {
  id?: string | number
  key?: string | number
  className?: string
  style?: VNodeStyle
  start?: number
  left?: number
  end?: number
  movable: boolean
  value?: string
  width?: number
  namespace: string[]
  selection?: Selection
}

let model: editor.ITextModel
function makeModel(value: string) {
  model = model || editor.createModel(value, 'javascript')

  if (model.getValue() !== value) {
    model.setValue(value)
  }

  return model
}

export function Buffer(props: BufferElement) {
  const {
    key,
    className,
    style = {},
    movable,
    start = 0,
    left = 0,
    end = 0,
    value = '',
    width = 0,
    id,
    namespace,
    selection,
  } = props

  const printedLines = value.split('\n').slice(start, end + 1)

  const printed = printedLines.join('\n')

  const startOffset = value
    .split('\n')
    .slice(0, start)
    .join('\n').length

  function hook(vnode: VNode) {
    if (!vnode.elm) {
      return
    }

    let elm = vnode.elm as any
    let _editor = elm._editor as editor.IStandaloneCodeEditor
    let _subscription = elm._subscription as IDisposable
    if (!_editor) {
      _editor = editor.create(vnode.elm as HTMLElement, {
        language: 'javascript',
        roundedSelection: true,
        scrollBeyondLastLine: false,
        readOnly: false,
        theme: 'vs-dark',
        lineNumbers: 'on',
        scrollbar: {
          vertical: 'hidden',
        },
        automaticLayout: true,
        minimap: {
          enabled: false,
        },
        model: makeModel(value),
      })

      elm._editor = _editor
    }
    let editorSelection = _editor.getSelection()
    if (
      selection &&
      editorSelection &&
      !selection.equalsSelection(editorSelection)
    ) {
      _editor.setSelection(selection)
    }
    _editor.onDidChangeCursorSelection(e => {
      emit(elm, 'monaco-selectionchange', e)
    })

    if (_editor.getValue() !== value) {
      makeModel(value)
    }

    _editor.setScrollTop(start * 18)
    _editor.setScrollLeft(left * 7.22)

    if (_subscription) {
      _subscription.dispose()
    }
    elm._subscription = _editor.onDidScrollChange(() => {
      _editor.setScrollTop(start * 18)
      _editor.setScrollLeft(left * 7.22)
    })
  }

  // don't use textarea, selection can't be measured on textareas
  return (
    <code
      id={id}
      data={{
        buffer: true,
        draggable: movable,
      }}
      props-namespace={namespace}
      key={key || id}
      style={Object.assign(
        {
          '--height': String(end - start + 1),
          '--left': String(left || 0),
          '--width': String(width || 0),
        },
        style,
      )}
      className={[className, 'buffer', movable && '-movable']
        .filter(Boolean)
        .join(' ')}
      hook={{
        insert: hook,
        update: hook,
        remove: vnode => {
          let elm = vnode.elm as any
          let _editor = elm?._editor as editor.IStandaloneCodeEditor
          _editor?.dispose()
          let _subscription = elm?._subscription as IDisposable
          _subscription?.dispose()
        },
      }}
    ></code>
  )
}

function emit<T extends Object = Object>(
  elm: HTMLElement,
  eventName: string,
  detail: T,
) {
  elm.dispatchEvent(
    new CustomEvent<T>(eventName, { detail, bubbles: true }),
  )
}

// function hook(vnode: VNode) {
//   if (vnode.elm) {
//     let elm = vnode.elm as HTMLElement
//     requestAnimationFrame(() => {
//       elm.scrollTop = 25 * start
//       elm.scrollLeft = 12 * left
//     })

//     elm.onscroll = () => {
//       elm.scrollTop = 25 * start
//       elm.scrollLeft = 12 * left
//     }
//   }
// }
//  <pre
//     id={id}
//     data={{
//       buffer: true,
//       lineIndex: start,
//       startOffset,
//       endOffset: startOffset + printed.length,
//       value,
//       draggable: movable,
//     }}
//     props-namespace={namespace}
//     key={key || id}
//     style={Object.assign(
//       {
//         '--height': String(end - start + 1),
//         '--left': String(left || 0),
//         '--width': String(width || 999),
//       },
//       style,
//     )}
//     className={[className, 'buffer', movable && '-movable']
//       .filter(Boolean)
//       .join(' ')}
//     attrs-contenteditable={!movable}
//     attrs-spellcheck={false}
//     scrollTop={25 * start}
//     scrollLeft={12 * left}
//     wrap="off"
//     hook={{
//       insert: vnode => {
//         init(vnode)
//         hook(vnode)
//       },
//       update: hook,
//     }}
//   >
//     {printedLines.map((line, index) => (
//       <div className="line" data-lineIndex={start + index}>
//         {line || '\r'}
//       </div>
//     ))}
//   </pre>
