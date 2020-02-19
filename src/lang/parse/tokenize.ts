import { Token } from '../types'
import { verbs } from '../../config'

export function tokenize(text: string): Array<[number, Token]> {
  let id = 0
  return text
    .split('\n')
    .map((line, index) => {
      return tokenizeLine(line).map(token => [index, token] as [number, Token])
    })
    .reduce((acc, x) => {
      acc.push(...x)
      return acc
    }, [])

  function tokenizeLine(line: string) {
    let left = 0
    return line.split(',').map(_tokenize)

    function _tokenize(str: string) {
      let token: Token = {
        id: '' + id++,
        tag: 'text',
        portal: undefined,
        pos: undefined,
        original: str,
        left,
      }
      left += str.length

      if (isComment(line)) {
        str.split(' ').forEach(word => {
          if (word === verbs.warp) {
            token.tag = 'warp'
          }
          if (word === verbs.portalStart) {
            token.tag = 'portal'
            token.pos = 'start'
          }
          if (word === verbs.portalEnd) {
            token.tag = 'portal'
            token.pos = 'end'
          }
          if (token.tag && word.startsWith(verbs.id)) {
            token.portal = word.slice(verbs.id.length)
          }
        })
      }

      return token
    }
  }
}

function isComment(str: string) {
  return str.trim().startsWith(verbs.comment)
}
