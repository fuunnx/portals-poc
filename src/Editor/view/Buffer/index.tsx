import './buffer.scss'
import { VNodeStyle } from 'snabbdom/modules/style'
import { code } from '@cycle/dom'
import { editor as mEditor, Selection } from 'monaco-editor'
import { makeSnabbdomElement, Dict } from 'cycle-element/src'

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

function makeModel(value: string) {
  model = model || mEditor.createModel(value, 'javascript')

  if (model.getValue() !== value) {
    model.setValue(value)
  }

  return model
}

type CodeEditorProps = {
  selection?: Selection
  value: string
  start: number
  left: number
} & Dict

let model: mEditor.ITextModel
export const CodeEditor = makeSnabbdomElement<CodeEditorProps>(
  elm => {
    model = model || mEditor.createModel('', 'javascript')
    console.log(elm)
    let prevProps: Partial<CodeEditorProps> = {}
    let editor = mEditor.create(elm, {
      language: 'javascript',
      roundedSelection: true,
      scrollBeyondLastLine: false,
      readOnly: false,
      theme: 'vs-dark',
      lineNumbers: 'on',
      scrollbar: {
        vertical: 'hidden',
      },
      automaticLayout: false,
      minimap: {
        enabled: false,
      },
      model,
    })

    let onDidScrollChange = editor.onDidScrollChange(() => {
      editor.setScrollTop((prevProps.start || 0) * 18)
      editor.setScrollLeft((prevProps.left || 0) * 7.22)
    })

    let onDidChangeCursorSelection = editor.onDidChangeCursorSelection(e => {
      emit(elm, 'monaco-selectionchange', e)
    })

    return {
      update(props) {
        const { selection, value, start, left } = props

        // == diff selection
        let editorSelection = editor.getSelection()
        if (
          selection &&
          editorSelection &&
          !selection.equalsSelection(editorSelection)
        ) {
          editor.setSelection(selection)
        }

        // == diff value
        if (model.getValue() !== value) {
          model.setValue(value)
        }

        // == diff scroll positions
        if (prevProps.start !== start) {
          editor.setScrollTop(start * 18)
        }
        if (prevProps.left !== left) {
          editor.setScrollLeft(left * 7.22)
        }

        // == end
        prevProps = props
      },
      remove() {
        onDidScrollChange.dispose()
        onDidChangeCursorSelection.dispose()
        editor.dispose()
      },
    }
  },
  { wrapperNode: code },
)

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
  const height = end - start + 1

  return (
    <CodeEditor
      id={id}
      selection={selection}
      value={value}
      left={left}
      start={start}
      data={{
        buffer: true,
        draggable: movable,
      }}
      props-namespace={namespace}
      key={key || id}
      style={Object.assign(
        {
          '--height': String(height),
          '--left': String(left),
          '--width': String(width),
        },
        style,
      )}
      className={[className, 'buffer', movable && '-movable']
        .filter(Boolean)
        .join(' ')}
    />
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
