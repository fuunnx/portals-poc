import { makeDOMDriver } from '@cycle/dom'
import { timeDriver } from '@cycle/time'
import { withState } from '@cycle/state'
import { selectionDriver } from './drivers/selectionDriver'
import { init } from 'snabbdom'

import { Component } from './interfaces'

import { Module } from 'snabbdom/modules/module'
import ClassModule from 'snabbdom/modules/class'
import PropsModule from 'snabbdom/modules/props'
import AttrsModule from 'snabbdom/modules/attributes'
import StyleModule from 'snabbdom/modules/style'
import DatasetModule from 'snabbdom/modules/dataset'
import HeroModule from 'snabbdom/modules/hero'

const modules: Array<Module> = [
  StyleModule,
  ClassModule,
  PropsModule,
  AttrsModule,
  DatasetModule,
  HeroModule,
]
export const patch = init(modules)

export type DriverThunk = Readonly<[string, () => any]> & [string, () => any] // work around readonly
export type DriverThunkMapper = (t: DriverThunk) => DriverThunk

// Set of Drivers used in this App
const driverThunks: DriverThunk[] = [
  ['DOM', () => makeDOMDriver('#app', { modules: modules })],
  ['time', () => timeDriver],
  ['selection', () => selectionDriver],
]

export const buildDrivers = (fn: DriverThunkMapper) =>
  driverThunks
    .map(fn)
    .map(([n, t]: DriverThunk) => ({ [n]: t }))
    .reduce((a, c) => Object.assign(a, c), {})

export const driverNames = driverThunks.map(([n]) => n).concat(['state'])

export function wrapMain(main: Component): Component {
  return withState(main as any) as any
}
