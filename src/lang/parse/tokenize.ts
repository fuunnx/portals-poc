import { Token } from '../types'

export function tokenize(line: string) {
  return line.split(',').map(_tokenize)

  function _tokenize(str: string) {
    let token: Token = {
      tag: 'text',
      portal: undefined,
      pos: undefined,
      original: str,
    }

    if (isComment(line)) {
      str.split(' ').forEach(word => {
        if (word === 'WARP') {
          token.tag = 'warp'
        }
        if (word === 'PORTAL') {
          token.tag = 'portal'
          token.pos = 'start'
        }
        if (word === '/PORTAL') {
          token.tag = 'portal'
          token.pos = 'end'
        }
        if (token.tag && word.startsWith('#')) {
          token.portal = word.replace(/^#/, '')
        }
      })
    }

    return token
  }
}

function isComment(str: string) {
  return str.trim().startsWith('//')
}
