import { verbs } from '../config'

export function id(name: string | number) {
  return `${verbs.id}${name}`
}

export function comment(...children: string[]) {
  return `${verbs.comment} ${children.filter(Boolean).join(', ')}`
}

export function portalStart(name: string | number) {
  return `${verbs.portalStart} ${id(name)}`
}

export function portalEnd(name: string | number) {
  return `${verbs.portalEnd} ${id(name)}`
}

export function warp(name: string | number) {
  return `${verbs.warp} ${id(name)}`
}
