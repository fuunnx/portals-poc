import xs, { Stream } from 'xstream'
import { Intents } from './intent'
import { State } from './index'

export function update(intents: Intents): Stream<Reducer> {
    const init$ = xs.of<Reducer>(
        prevState => (prevState === undefined ? defaultState : prevState)
    )

    return xs.merge(
        init$,
        intents.movePortal$.map(x => (state: State) => ({
            ...state,
            instances: state.instances.map(
                p => (p.id === x.id ? { ...p, ...x } : p)
            )
        })),
        intents.input$.map(buffer => (state: State) => {
            return { ...state, buffer }
        }),
        intents.dragMode$.map(down => (state: State) =>
            ({
                ...state,
                mode: down ? 'drag' : 'edit'
            } as State)
        ),
        intents.createPortal$.map(portal => (state: State) => ({
            ...state,
            instances: state.instances.concat([portal])
        }))
    )
}

export type Reducer = (prev: State) => State | undefined

export const defaultState: State = {
    mode: 'edit',
    instances: [],
    buffer: `
function fibonnaci (n) {
    if (n === 1) {
        return 1
    }
    return n + fibonnaci(n - 1)
}

fibonnaci(5) // = 15

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
    <card>
        <img src="albert.jpg" />
        <h2>Albert</h2>
    </card>
</grid>
\`
`
}
