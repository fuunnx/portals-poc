import { Stream } from 'xstream';
import { DOMSource, VNode } from '@cycle/dom';
import { StorageSource, StorageRequest } from '@cycle/storage';
import { HTTPSource, RequestOptions } from '@cycle/http';
import { TimeSource } from '@cycle/time';
import { RouterSource, HistoryAction } from 'cyclic-router';
import { ISelectionSource } from './drivers/selectionDriver';

export type Component = (s: BaseSources) => BaseSinks;

export interface BaseSources {
    DOM: DOMSource;
    HTTP: HTTPSource;
    time: TimeSource;
    router: RouterSource;
    storage: StorageSource;
    selection: ISelectionSource;
}

export interface BaseSinks {
    DOM?: Stream<VNode>;
    HTTP?: Stream<RequestOptions>;
    router?: Stream<HistoryAction>;
    storage?: Stream<StorageRequest>;
}
