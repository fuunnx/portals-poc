import isolate from '@cycle/isolate'

import { buildDrivers, wrapMain } from './drivers'
import { Component } from './interfaces'
import { Main } from './components/main'

const main: Component = wrapMain(Main)

/// #if PRODUCTION
import { run } from '@cycle/run'
run(main as any, buildDrivers(([k, t]) => [k, t()]))

/// #else
import { setup } from '@cycle/run'
import { restartable, rerunner } from 'cycle-restart'

const mkDrivers = () =>
  buildDrivers(([k, t]) => {
    if (k === 'DOM') {
      return [k, restartable(t(), { pauseSinksWhileReplaying: false })]
    }
    if (k === 'time' || k === 'router') {
      return [k, t()]
    }
    return [k, restartable(t())]
  })
const rerun = rerunner(setup, mkDrivers, isolate)
rerun(main as any)

if (module.hot) {
  module.hot.accept('./components/main', () => {
    console.clear()
    const newApp = (require('./components/main') as any).Main

    rerun(wrapMain(newApp))
  })
}
/// #endif
