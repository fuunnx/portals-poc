import { flatten } from 'ramda'
import { VNode } from '@cycle/dom'
import { BoundingRect } from 'src/lang'
import { editor as mEditor, Selection } from 'monaco-editor'
import { makeSnabbdomElement, Dict } from 'cycle-element/src'

type CodeEditorProps = {
  selection?: Selection
  value: string
  start: number
  left: number
  children?: VNode[]
  zones: Zone[]
  cuts: BoundingRect[]
} & Dict

type Zone = {
  afterLineNumber: number
  afterColumn: number
  heightInLines: number
  id?: string
  domNode?: HTMLElement
}

let model: mEditor.ITextModel
export const CodeEditor = makeSnabbdomElement<CodeEditorProps>(
  elm => {
    model = model || mEditor.createModel('', 'javascript')

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
      const scrollTop = (prevProps.start || 0) * 18
      const scrollLeft = (prevProps.left || 0) * 7.22
      if (editor.getScrollTop() !== scrollTop) {
        editor.setScrollTop(scrollTop)
      }
      if (editor.getScrollLeft() !== scrollLeft) {
        editor.setScrollLeft(scrollLeft)
      }
    })

    let onDidChangeCursorSelection = editor.onDidChangeCursorSelection(e => {
      emit(elm, 'monaco-selectionchange', e)
    })

    editor.onDidChangeModelContent(e => {
      emit(elm, 'monaco-changemodelcontent', model)
    })
    let prevZones: Zone[] = []
    return {
      update(props) {
        const { selection, value, start, left, zones } = props
        // == diff selection
        diffSelection(editor, prevProps.selection, selection)

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

        // == diff zones
        prevZones = props.zones = diffZones(editor, prevZones, zones)

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
  { wrapperNode: <code data-monacoeditor /> },
)

function diffZones(
  editor: mEditor.IStandaloneCodeEditor,
  prevZones: Zone[] | null | undefined,
  zones?: Zone[] | null | undefined,
) {
  let indexedByHeight = (prevZones || []).reduce((zones, zone) => {
    let height = zone.heightInLines
    zones[height] = zones[height] || []
    zones[height].push(zone)
    return zones
  }, {} as { [height: string]: Zone[] })

  let newZones: Zone[] = []
  editor.changeViewZones(accessor => {
    newZones = (zones || []).map(zone => {
      let height = zone.heightInLines
      const isNew = !indexedByHeight[height]?.length
      if (isNew) {
        zone.domNode = zone.domNode || document.createElement('div')
        zone.id = accessor.addZone(zone as mEditor.IViewZone)
        return zone
      }

      let delegate = indexedByHeight[height].shift() as Zone
      const areEquals =
        delegate.afterLineNumber === zone.afterLineNumber &&
        delegate.afterColumn === zone.afterColumn

      if (!delegate.id || areEquals) {
        return delegate
      }

      delegate.afterLineNumber = zone.afterLineNumber
      delegate.afterColumn = zone.afterColumn
      accessor.layoutZone(delegate.id)
      return delegate
    })

    flatten(Object.values(indexedByHeight)).forEach(zone => {
      zone.id && accessor.removeZone(zone.id)
    })
  })
  return newZones
}

function diffSelection(
  editor: mEditor.IStandaloneCodeEditor,
  prevSelection: Selection | null | undefined,
  selection?: Selection | null | undefined,
): void {
  if (!selection) {
    if (prevSelection && !prevSelection.isEmpty()) {
      prevSelection.collapseToStart()
    }
    return
  }

  if (!prevSelection || !prevSelection.equalsSelection(selection)) {
    editor.setSelection(selection)
    return
  }
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
