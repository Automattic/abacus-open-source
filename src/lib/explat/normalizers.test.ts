import Fixtures from 'src/test-helpers/fixtures'

import * as Normalizers from './normalizers'

describe('lib/normalizers.ts module', () => {
  describe('indexSegments', () => {
    it('indexes an empty array', () => {
      expect(Normalizers.indexMetrics([])).toEqual({})
    })

    it('indexes an non-empty array', () => {
      const metrics = Fixtures.createMetrics()
      expect(Normalizers.indexMetrics(metrics)).toEqual({ 1: metrics[0], 2: metrics[1], 3: metrics[2] })
    })
  })

  describe('indexSegments', () => {
    it('indexes an empty array', () => {
      expect(Normalizers.indexSegments([])).toEqual({})
    })

    it('indexes an non-empty array', () => {
      const segments = Fixtures.createSegments(2)
      expect(Normalizers.indexSegments(segments)).toEqual({ 1: segments[0], 2: segments[1] })
    })
  })

  describe('indexTags', () => {
    it('indexes an empty array', () => {
      expect(Normalizers.indexTags([])).toEqual({})
    })

    it('indexes an non-empty array', () => {
      const tags = Fixtures.createTagBares(2)
      expect(Normalizers.indexTags(tags)).toEqual({ 1: tags[0], 2: tags[1] })
    })
  })
})
