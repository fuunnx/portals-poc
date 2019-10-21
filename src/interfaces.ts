import { Stream } from 'xstream'
import { DOMSource, VNode } from '@cycle/dom'
import { TimeSource } from '@cycle/time'
import { ISelectionSource } from './drivers/selectionDriver'

export type Component = (s: BaseSources) => BaseSinks

export interface BaseSources {
  DOM: DOMSource
  time: TimeSource
  selection: ISelectionSource
}

export interface BaseSinks {
  DOM?: Stream<VNode>
}
