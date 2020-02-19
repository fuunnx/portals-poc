import { parse } from '../parse'
import { stringify } from './index'
import { comment, portalStart, portalEnd, warp } from '../helpers'

test('empty text', () => {
  const source = ''
  expect(stringify(parse(source))).toEqual(source)
})

test('simple text', () => {
  const source = `1
2
3`
  expect(stringify(parse(source))).toEqual(source)
})

test('less simple text', () => {
  const source = `${comment(portalStart(1))}
1
${comment(portalEnd(1))}
2
${comment(warp(1))}
3`
  expect(stringify(parse(source))).toEqual(source)
})

test('multiple per line', () => {
  const source = ` ${comment(portalStart(1), portalEnd(1), warp(1))}`
  expect(stringify(parse(source))).toEqual(source)
})

test('multiple destinations per line', () => {
  const source = `
${comment(portalStart(1), portalEnd(1))}
${comment(portalStart(2), portalEnd(2))}

${comment(warp(1), warp(2))}`
  expect(stringify(parse(source))).toEqual(source)
})

test('partial content', () => {
  const source = `
${comment(portalStart(2), portalEnd(2))}

${comment(warp(''))}`
  expect(stringify(parse(source))).toEqual(source)
})
