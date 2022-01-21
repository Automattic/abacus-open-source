import { useCallback, useEffect } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

export interface UrlSearchParams {
  [key: string]: string
}

interface UseUrlSearchParamsResult {
  urlSearchParams: UrlSearchParams
  pushUrlSearchParams: (newParams: UrlSearchParams) => void
}

/**
 * Convert a UrlSearchParams object to a url params search string. Excludes the beginning '?' character.
 *
 * @param searchParams the UrlSearchParams object to convert to a search params string
 */
export const urlSearchParamsToSearchString = (searchParams: UrlSearchParams): string => {
  // istanbul ignore next; extra precaution, shouldn't occur
  if (searchParams.search?.length === 0) {
    delete searchParams.search
  }

  const noNullValues = Object.entries(searchParams).filter(([_key, value]) => value !== null && value !== undefined)
  const filteredParams = Object.fromEntries(noNullValues)
  return new URLSearchParams(filteredParams).toString()
}

/**
 * Convert a url params search string to a UrlSearchParams object.
 *
 * @param search the url search params string to convert
 */
export const searchStringToUrlSearchParams = (search: string): UrlSearchParams => {
  return Object.fromEntries(new URLSearchParams(search).entries()) as UrlSearchParams
}

/**
 * Provides access to the current page's URL search params.
 *
 * @param defaultParams optional initial search params
 */
export const useUrlSearchParams = (defaultParams?: UrlSearchParams): UseUrlSearchParamsResult => {
  const history = useHistory()
  const location = useLocation()

  const params = defaultParams || searchStringToUrlSearchParams(location.search)

  useEffect(() => {
    pushUrlSearchParams(params)
    // Only needed on initialization so don't need other dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pushUrlSearchParams = useCallback(
    (newParams: UrlSearchParams) => {
      history.push({
        pathname: location.pathname,
        search: `?${urlSearchParamsToSearchString(newParams)}`,
      })
    },
    [history, location.pathname],
  )

  const urlSearchParams = searchStringToUrlSearchParams(location.search)

  return {
    urlSearchParams,
    pushUrlSearchParams,
  }
}
