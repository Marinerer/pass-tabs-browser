import { describe, it, expect } from 'vitest'

describe('hello', () => {
  it('should return hello world', () => {
    expect(['hello', 'world'].join(' ')).toBe('hello world')
  })
})
