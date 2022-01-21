import { render } from '@testing-library/react'
import { createMemoryHistory } from 'history'
import React from 'react'
import { Router } from 'react-router-dom'

import { getParamsObjFromSearchString, getParamsStringFromObj, UrlParams, usePageParams } from './url-params'

describe('utils/url-params.ts module', () => {
  describe('getParamsObjFromSearchString', () => {
    it('should be an empty object when given an empty string', () => {
      expect(getParamsObjFromSearchString('')).toMatchObject({})
    })

    it('should be an empty object when given invalid search params', () => {
      expect(getParamsObjFromSearchString('?')).toMatchObject({})
      expect(getParamsObjFromSearchString('?test')).toMatchObject({})
      expect(getParamsObjFromSearchString('test=123')).toMatchObject({})
    })

    it('should return object with properties that matches search params', () => {
      expect(getParamsObjFromSearchString('?test=hello&test2=123')).toMatchObject({
        test: 'hello',
        test2: '123',
      })
    })

    it('should correctly decode URL encoded strings', () => {
      expect(
        getParamsObjFromSearchString(
          '?test=+%3A%3C%3E%28%29%7B%7D%21%40%23%24%25%5E%26*%2C.%2F%5C%5B%5D%3D-%2B_%60%7E',
        ),
      ).toMatchObject({
        test: ' :<>(){}!@#$%^&*,./\\[]=-+_`~',
      })
    })
  })

  describe('getParamsStringFromObj', () => {
    it('should return empty string when given empty object', () => {
      expect(getParamsStringFromObj({})).toBe('')
    })

    it('should return correct string when given an object with properties', () => {
      expect(
        getParamsStringFromObj({
          test: 'hello',
          test2: '123',
        }),
      ).toBe('test=hello&test2=123')
    })

    it('should correctly URL encode properties with special characters', () => {
      expect(
        getParamsStringFromObj({
          test: ' :<>(){}!@#$%^&*,./\\[]=-+_`~',
        }),
      ).toBe('test=+%3A%3C%3E%28%29%7B%7D%21%40%23%24%25%5E%26*%2C.%2F%5C%5B%5D%3D-%2B_%60%7E')
    })
  })

  describe('usePageParams', () => {
    const TestPageParams = ({ initialParams }: { initialParams?: UrlParams }) => {
      usePageParams(initialParams)

      return <div></div>
    }

    it('usePageParams works as intended without initialParams', () => {
      const history = createMemoryHistory()
      render(
        <Router history={history}>
          <TestPageParams />
        </Router>,
      )

      expect(history.length).toBe(2)
      expect(history.location.search).toBe('?')
    })

    it('usePageParams works as intended given initialParams', () => {
      const history = createMemoryHistory()
      render(
        <Router history={history}>
          <TestPageParams initialParams={{ test: 'a8c' }} />
        </Router>,
      )

      expect(history.length).toBe(2)
      expect(history.location.search).toBe('?test=a8c')
    })
  })
})
