import 'jest'

import { parse } from './parser'

test('empty text', () => {
  expect(parse('')).toEqual([]);
});

test('no annotations', () => {
  expect(parse(`
Hello guys

How are you ?
`)).toEqual([]);
});

test('simple', () => {
  expect(parse(`
// PORTAL #1
Hello guys
// /PORTAL #1

How are you ?
`)).toEqual([
    { id: '1', start: 1, end: 3, height: 3, warpTo: [] }
  ]);
});

test('with target', () => {
  expect(parse(`
// PORTAL #1
Hello guys
// /PORTAL #1

How are you ?
// WARP #1
`)).toEqual([
    { id: '1', start: 1, end: 3, height: 3, warpTo: [6] }
  ]);
});