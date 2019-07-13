import 'jest'

import { parse } from './parser'

test('empty text', () => {
  expect(parse('')).toEqual({
    portals: {},
    children: [''],
  });
});

test('no annotations', () => {
  expect(parse(`
Hello guys

How are you ?
`)).toEqual({
    portals: {},
    children: [`
Hello guys

How are you ?
`,
    ],
  });
});

test('simple', () => {
  expect(parse(`
// PORTAL #1
Hello guys
// /PORTAL #1

How are you ?
`)).toEqual({
    children: [
      `
// PORTAL #1`,
      { type: 'placeholder', for: '1' },
      `// /PORTAL #1

How are you ?
`
    ],
    portals: {
      '1': { id: '1', start: 2, end: 2, children: ['Hello guys'], portals: {} }
    }
  });
});

test('with target', () => {
  expect(parse(`
// PORTAL #1
Hello guys
// /PORTAL #1

How are you ?
// WARP #1
`)).toEqual({
    children: [
      `
// PORTAL #1`,
      { type: 'placeholder', for: '1' },
      `// /PORTAL #1

How are you ?
// WARP #1`,
      { type: 'destination', for: '1' },
      ``
    ],
    portals: {
      '1': { id: '1', start: 2, end: 2, children: ['Hello guys'], portals: {} }
    }
  })
})


test('malformed', () => {
  expect(parse(`
// PORTAL #1
Hello guys

How are you ?
// WARP #1
`)).toEqual({
    children: [`
// PORTAL #1
Hello guys

How are you ?
// WARP #1
`
    ],
    portals: {}
  });
});


test('nested', () => {
  expect(parse(`
// PORTAL #1
Hello
// PORTAL #2
guys
// /PORTAL #2
// /PORTAL #1

How are you ?
// WARP #1
`)).toEqual({
    children: [
      `
// PORTAL #1`,
      { type: 'placeholder', for: '1' },
      `// /PORTAL #1

How are you ?
// WARP #1`,
      { type: 'destination', for: '1' },
      ``
    ],
    portals: {
      '1': {
        id: '1',
        start: 2,
        end: 5,
        children: [
          `Hello
// PORTAL #2`,
          { type: 'placeholder', for: '2' },
          `// /PORTAL #2`
        ],
        portals: {
          '2': {
            id: '2',
            start: 4,
            end: 4,
            children: ['guys'],
            portals: {},
          },
        }
      },
    },

  });
});
