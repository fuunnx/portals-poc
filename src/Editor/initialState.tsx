import { State } from './index'
import { verbs } from 'src/config'

function id(name: string | number) {
  return `${verbs.id}${name}`
}

function comment(...children: string[]) {
  return `${verbs.comment} ${children.filter(Boolean).join(', ')}`
}

function portalStart(name: string | number) {
  return `${verbs.portalStart} ${id(name)}`
}

function portalEnd(name: string | number) {
  return `${verbs.portalEnd} ${id(name)}`
}

function warp(name: string | number) {
  return `${verbs.warp} ${id(name)}`
}

export const initialState: State = {
  movable: false,
  copiable: false,
  disabled: false,
  draggedElement: undefined,
  selection: undefined,
  buffer: `
${comment(portalStart(1))}
function fibonnaci (n) {
    ${comment(portalStart(2))}
    if (n === 1) {
        return 1
    }
    ${comment(portalEnd(2))}
    ${comment(portalStart(3))}
    return n + fibonnaci(n - 1)
    ${comment(portalEnd(3))}
    ${comment(warp(2), warp(3))}
}
${comment(portalEnd('fibonnaci'))}

fibonnaci(5) // = 15


${comment(warp('fibonnaci'))}

html\`
<grid columns="3">
    <card>
        <img src="jean-maurice.jpg" />
        <h2>Jean Maurice</h2>
    </card>
    <card>
        <img src="mauricette.jpg" />
        <h2>Mauricette</h2>
    </card>
    ${comment(portalStart('card'))}
    <card>
        <img src="albert.jpg" />
        <h2>Albert</h2>
    </card>
    ${comment(portalEnd('card'))}
</grid>
\`
`,
}
