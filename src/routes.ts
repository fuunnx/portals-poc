import { Component } from './interfaces'
import { Editor } from './components/Editor'

export interface RouteValue {
    component: Component
    scope: string
}
export interface Routes {
    readonly [index: string]: RouteValue
}

export const routes: Routes = {
    '/': { component: Editor, scope: 'Editor' }
}

export const initialRoute = '/'
