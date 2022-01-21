import { render } from '@testing-library/react'
import { createMemoryHistory } from 'history'
import React from 'react'
import { Router } from 'react-router-dom'

import {
  searchStringToUrlSearchParams,
  UrlSearchParams,
  urlSearchParamsToSearchString,
  useUrlSearchParams,
} from './url-params'

describe('utils/url-params.ts module', () => {
  describe('searchStringToUrlSearchParams', () => {
    it('should be an empty object when given an empty string', () => {
      expect(searchStringToUrlSearchParams('')).toMatchObject({})
    })

    it('should be an empty object when given invalid search params', () => {
      expect(searchStringToUrlSearchParams('?')).toMatchObject({})
      expect(searchStringToUrlSearchParams('?test')).toMatchObject({})
      expect(searchStringToUrlSearchParams('test=123')).toMatchObject({})
    })

    it('should return object with properties that matches search params', () => {
      expect(searchStringToUrlSearchParams('?test=hello&test2=123')).toMatchObject({
        test: 'hello',
        test2: '123',
      })
    })

    it('should correctly decode URL encoded strings', () => {
      expect(
        searchStringToUrlSearchParams(
          '?test=+%3A%3C%3E%28%29%7B%7D%21%40%23%24%25%5E%26*%2C.%2F%5C%5B%5D%3D-%2B_%60%7E',
        ),
      ).toMatchObject({
        test: ' :<>(){}!@#$%^&*,./\\[]=-+_`~',
      })
    })
  })

  describe('urlSearchParamsToSearchString', () => {
    it('should return empty string when given empty object', () => {
      expect(urlSearchParamsToSearchString({})).toBe('')
    })

    it('should return correct string when given an object with properties', () => {
      expect(
        urlSearchParamsToSearchString({
          test: 'hello',
          test2: '123',
        }),
      ).toBe('test=hello&test2=123')
    })

    it('should correctly URL encode properties with special characters', () => {
      expect(
        urlSearchParamsToSearchString({
          test: ' :<>(){}!@#$%^&*,./\\[]=-+_`~',
        }),
      ).toBe('test=+%3A%3C%3E%28%29%7B%7D%21%40%23%24%25%5E%26*%2C.%2F%5C%5B%5D%3D-%2B_%60%7E')
    })
  })

  describe('useUrlSearchParams', () => {
    const TestPageParams = ({ defaultParams }: { defaultParams?: UrlSearchParams }) => {
      useUrlSearchParams(defaultParams)

      return <div></div>
    }

    it('useUrlSearchParams works as intended without defaultParams', () => {
      const history = createMemoryHistory()
      render(
        <Router history={history}>
          <TestPageParams />
        </Router>,
      )

      expect(history.length).toBe(2)
      expect(history.location.search).toBe('?')
    })

    it('useUrlSearchParams works as intended given defaultParams', () => {
      const history = createMemoryHistory()
      render(
        <Router history={history}>
          <TestPageParams defaultParams={{ test: 'a8c' }} />
        </Router>,
      )

      expect(history.length).toBe(2)
      expect(history.location.search).toBe('?test=a8c')
    })
  })
})
