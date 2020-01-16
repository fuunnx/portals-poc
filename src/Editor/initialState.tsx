import { State } from './index'

export const initialState: State = {
  movable: false,
  copiable: false,
  disabled: false,
  draggedElement: undefined,
  selection: undefined,
  buffer: `
// PORTAL #1
function fibonnaci (n) {
    // PORTAL #2
    if (n === 1) {
        return 1
    }
    // /PORTAL #2
    // PORTAL #3
    return n + fibonnaci(n - 1)
    // /PORTAL #3
    // WARP #2, WARP #3
}
// /PORTAL #fibonnaci

fibonnaci(5) // = 15


// WARP #fibonnaci

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
    // PORTAL #card
    <card>
        <img src="albert.jpg" />
        <h2>Albert</h2>
    </card>
    // /PORTAL #card
</grid>
\`
`,
}
