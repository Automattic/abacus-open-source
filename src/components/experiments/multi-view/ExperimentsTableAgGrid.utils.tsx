export interface UrlParams {
  [key: string]: string
}

export const getParamsStringFromObj = (paramsObj: UrlParams): string => {
  // istanbul ignore next; extra precaution, shouldn't occur
  if (paramsObj.search?.length === 0) {
    delete paramsObj.search
  }

  const noNullVals = Object.entries(paramsObj).filter(([_key, value]) => value !== null && value !== undefined)
  const filteredParams = Object.fromEntries(noNullVals)

  return new URLSearchParams(filteredParams).toString()
}

export const getParamsObjFromSearchString = (search: string): UrlParams => {
  return Object.fromEntries(new URLSearchParams(search).entries()) as UrlParams
}
