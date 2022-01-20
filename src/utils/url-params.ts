import { useCallback, useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

export interface UrlParams {
  [key: string]: string
}

interface UsePageParamsProps {
  pageParams: UrlParams
  setPageParams: (params: UrlParams) => void
  replacePageParams: (newParams: UrlParams) => void
}

/**
 * TODO comments
 *
 * @param paramsObj TODO
 */
export const getParamsStringFromObj = (paramsObj: UrlParams): string => {
  // istanbul ignore next; extra precaution, shouldn't occur
  if (paramsObj.search?.length === 0) {
    delete paramsObj.search
  }

  const noNullVals = Object.entries(paramsObj).filter(([_key, value]) => value !== null && value !== undefined)
  const filteredParams = Object.fromEntries(noNullVals)
  return new URLSearchParams(filteredParams).toString()
}

/**
 * TODO comments
 *
 * @param search TODO
 */
export const getParamsObjFromSearchString = (search: string): UrlParams => {
  return Object.fromEntries(new URLSearchParams(search).entries()) as UrlParams
}

/**
 * TODO comments
 *
 * @param initialParams TODO
 */
export const usePageParams = (initialParams?: UrlParams): UsePageParamsProps => {
  const history = useHistory()
  const location = useLocation()

  const params = initialParams || getParamsObjFromSearchString(location.search)
  const [pageParams, setPageParams] = useState<UrlParams>(params)

  useEffect(() => {
    replacePageParams(params)
    // TODO: comment why you only need to do this once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setPageParams(getParamsObjFromSearchString(location.search))
  }, [location])

  const replacePageParams = useCallback(
    (newParams: UrlParams) => {
      setPageParams(newParams)
      history.push({
        pathname: location.pathname,
        search: `?${getParamsStringFromObj(newParams)}`,
      })
    },
    [history, location.pathname],
  )

  return {
    pageParams,
    setPageParams,
    replacePageParams,
  }
}
