import { ColumnApi, ColumnState } from 'ag-grid-community'

export interface UrlParams {
  [key: string]: string
}

export const defaultSortParams = {
  statusS: 'asc',
  statusSi: '0',
  startDatetimeS: 'desc',
  startDatetimeSi: '1',
}

export const getParamsStringFromObj = (paramsObj: UrlParams): string => {
  // istanbul ignore next; extra precaution, shouldn't occur
  if (paramsObj.search?.length === 0) {
    delete paramsObj.search
  }

  const noNullVals = Object.entries(paramsObj).filter(([_key, value]) => value !== null && value !== undefined)
  const filteredParams = Object.fromEntries(noNullVals)

  // special param if the search/filter is empty (to distinguish from default URL)
  if (Object.keys(filteredParams).length === 0) {
    return 'null=true'
  }

  return new URLSearchParams(filteredParams).toString()
}

export const getParamsObjFromSearchString = (search: string): UrlParams => {
  return Object.fromEntries(new URLSearchParams(search).entries()) as UrlParams
}

export const getSortParamsFromGrid = (colState: ColumnState[]): UrlParams => {
  return colState
    .filter((value: ColumnState) => value.sort !== null)
    .map((value: ColumnState) => {
      // istanbul ignore next; trivial and shouldn't occur
      if (!value.colId) {
        return {}
      }

      return {
        [`${value.colId}S`]: value.sort,
        [`${value.colId}Si`]: String(value.sortIndex),
      } as UrlParams
    })
    .reduce((prevValue: UrlParams, currentValue: UrlParams) => {
      return {
        ...prevValue,
        ...currentValue,
      } as UrlParams
    }, {})
}

export const getSortParamsFromUrlParams = (params: UrlParams): UrlParams => {
  const sortParams = {} as UrlParams

  Object.entries(params).forEach(([key, value]) => {
    if (key.endsWith('S') || key.endsWith('Si')) {
      sortParams[key] = value
    }
  })

  return sortParams
}

export const setGridSort = (params: UrlParams, gridColumnApi: ColumnApi): void => {
  const columnState = gridColumnApi.getColumnState()

  const state = columnState
    .map((column: ColumnState) => {
      const colId = column.colId as string
      return params[`${colId}Si`]
        ? [
            {
              colId: colId,
              sort: params[`${colId}S`],
              sortIndex: parseInt(params[`${colId}Si`]),
            },
          ]
        : []
    })
    .reduce((prevValue, currentValue) => {
      return [...prevValue, ...currentValue]
    }, [])

  gridColumnApi.applyColumnState({
    state: state,
    defaultState: { sort: null },
  })
}
