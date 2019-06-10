import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';
import { timeDriver } from '@cycle/time';
import onionify from 'cycle-onionify';
import { selectionDriver } from './drivers/selectionDriver'

import { Component } from './interfaces';

export type DriverThunk = Readonly<[string, () => any]> & [string, () => any]; // work around readonly
export type DriverThunkMapper = (t: DriverThunk) => DriverThunk;

// Set of Drivers used in this App
const driverThunks: DriverThunk[] = [
    ['DOM', () => makeDOMDriver('#app')],
    ['HTTP', () => makeHTTPDriver()],
    ['time', () => timeDriver],
    ['selection', () => selectionDriver],
];

export const buildDrivers = (fn: DriverThunkMapper) =>
    driverThunks
        .map(fn)
        .map(([n, t]: DriverThunk) => ({ [n]: t }))
        .reduce((a, c) => Object.assign(a, c), {});

export const driverNames = driverThunks
    .map(([n, t]) => n)
    .concat(['onion']);

export function wrapMain(main: Component): Component {
    return onionify(main as any) as any;
}
