// tslint:disable-next-line
/// <reference path="node_modules/snabbdom-pragma/snabbdom-pragma.d.ts" />
declare module 'cycle-restart'

declare var Snabbdom: any //Automaticly imported into every file

declare module 'random-words' {
  export default function randomWords(): string
  export default function randomWords(count: number): string[]
}

// declare namespace SnabbdomPragma {
//   type Children = VNode[] | VNode | string | number
//   type CircularChildren = Children | Children[]

//   type Component = (props: VNodeData, children: CircularChildren[]) => VNode

//   export function createElement(sel: string | Component, data: null | VNodeData, ...children: CircularChildren[]): VNode
// }
