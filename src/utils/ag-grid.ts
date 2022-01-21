import { ColumnState } from 'ag-grid-community'
import _ from 'lodash'
import { useCallback, useRef, useState } from 'react'

import { UrlParams } from './url-params'

type FilterType = 'text' | 'date'
type FilterOption =
  | 'equals'
  | 'notEqual'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'lessThan'
  | 'greaterThan'
  | 'inRange'

interface SingleFilterObj {
  filterType: FilterType
  type: FilterOption
  filter?: string
  dateFrom?: string
  dateTo?: string
}

interface ConditionalFilterObj {
  filterType: FilterType
  operator: 'AND' | 'OR'
  condition1: SingleFilterObj
  condition2: SingleFilterObj
}

type FilterObj = SingleFilterObj | ConditionalFilterObj
export interface ColumnFilter {
  [key: string]: FilterObj
}

export interface GridState {
  searchText: string
  columnState: ColumnState[]
  filterModel: ColumnFilter
}

interface OptionalGridState {
  searchText?: string
  columnState?: ColumnState[]
  filterModel?: ColumnFilter
}

interface UseGridStateProps {
  gridState: GridState
  updateGridState: (gridState: OptionalGridState, callbackIfChanged?: (newState: GridState) => void) => void
}

export type UpdateGridSearchTextFunction = (searchText: string) => void
export type UpdateGridSortStateFunction = (sortState: ColumnState[]) => void
export type UpdateGridFilterModelFunction = (filterModel: ColumnFilter) => void
export type ResetGridStateFunction = () => void

export interface GridActions {
  updateGridSearchText: UpdateGridSearchTextFunction
  updateGridSortState: UpdateGridSortStateFunction
  updateGridFilterModel: UpdateGridFilterModelFunction
  resetGridState: ResetGridStateFunction
}

const getSortParamsFromGridState = (gridState: GridState): UrlParams => {
  return gridState.columnState
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

const getFilterParamsFromGridState = (gridState: GridState): UrlParams => {
  return Object.entries(gridState.filterModel)
    .map(([colId, filter]) => {
      if ('operator' in filter) {
        if ('dateFrom' in filter.condition1) {
          return {
            [`${colId}Op`]: filter.operator,
            [`${colId}C1df`]: filter.condition1.dateFrom,
            [`${colId}C1dt`]: filter.condition1.dateTo,
            [`${colId}C1t`]: filter.condition1.type,
            [`${colId}C2df`]: filter.condition2.dateFrom,
            [`${colId}C2dt`]: filter.condition2.dateTo,
            [`${colId}C2t`]: filter.condition2.type,
          } as UrlParams
        } else {
          return {
            [`${colId}Op`]: filter.operator,
            [`${colId}C1f`]: filter.condition1.filter,
            [`${colId}C1t`]: filter.condition1.type,
            [`${colId}C2f`]: filter.condition2.filter,
            [`${colId}C2t`]: filter.condition2.type,
          } as UrlParams
        }
      } else {
        if ('dateFrom' in filter) {
          return {
            [`${colId}Df`]: filter.dateFrom,
            [`${colId}Dt`]: filter.dateTo,
            [`${colId}T`]: filter.type,
          } as UrlParams
        } else {
          return {
            [`${colId}F`]: filter.filter,
            [`${colId}T`]: filter.type,
          } as UrlParams
        }
      }
    })
    .reduce((prevValue, currentValue) => {
      return {
        ...prevValue,
        ...currentValue,
      } as UrlParams
    }, {})
}

/**
 * TODO comments
 * @param gridState
 */
export const getUrlParamsFromGridState = (gridState: GridState): UrlParams => {
  return {
    ...(gridState.searchText.length > 0 ? { search: gridState.searchText } : {}),
    ...getSortParamsFromGridState(gridState),
    ...getFilterParamsFromGridState(gridState),
  }
}

// TODO: add comment explaining this algorithm
const getPrefix = (endings: string[], str: string) => {
  const match = endings.find((ending) => str.endsWith(ending))
  // istanbul ignore next; shouldn't be possible in current cases since keys are always filtered first
  if (!match) {
    throw new Error(`String ${str} does not end with any of the endings in: ${JSON.stringify(endings)}`)
  }
  // Slice string from [start, ending substring begins)
  return str.slice(0, -match.length)
}

const getSearchTextFromUrlParams = (params: UrlParams): string => {
  return params.search || ''
}

const getSortStateFromUrlParams = (params: UrlParams): ColumnState[] => {
  const endings = ['S', 'Si']

  const colIds = Object.keys(params)
    .filter((key) => endings.some((ending) => key.endsWith(ending)))
    .map((sortKey) => getPrefix(endings, sortKey))
  const uniqueColIds = [...new Set(colIds)]
  const state = uniqueColIds
    .map((colId) => {
      return [
        {
          colId: colId,
          sort: params[`${colId}S`],
          sortIndex: parseInt(params[`${colId}Si`]),
        },
      ]
    })
    .reduce((prevValue, currentValue) => {
      return [...prevValue, ...currentValue]
    }, [])

  return state
}

const getFilterStateFromUrlParams = (params: UrlParams): ColumnFilter => {
  const endings = ['Df', 'Dt', 'F', 'T', 'Op', 'C1df', 'C2df', 'C1dt', 'C2dt', 'C1f', 'C2f', 'C1t', 'C2t']

  const colIds = Object.keys(params)
    .filter((key) => endings.some((ending) => key.endsWith(ending)))
    .map((filterKey) => getPrefix(endings, filterKey))
  const uniqueColIds = [...new Set(colIds)]
  const state = uniqueColIds
    .map((colId) => {
      let filterType = ''
      let singleFilter = {}
      let condition1 = {}
      let condition2 = {}
      if (`${colId}Df` in params || `${colId}C1df` in params) {
        filterType = 'date'
        singleFilter = { dateFrom: params[`${colId}Df`], dateTo: params[`${colId}Dt`] }
        condition1 = { dateFrom: params[`${colId}C1df`], dateTo: params[`${colId}C1dt`] }
        condition2 = { dateFrom: params[`${colId}C2df`], dateTo: params[`${colId}C2dt`] }
      } else {
        filterType = 'text'
        singleFilter = { filter: params[`${colId}F`] }
        condition1 = { filter: params[`${colId}C1f`] }
        condition2 = { filter: params[`${colId}C2f`] }
      }

      let model = null
      if (params[`${colId}F`] || params[`${colId}Df`]) {
        model = {
          ...singleFilter,
          filterType: filterType,
          type: params[`${colId}T`],
        }
      } else if (params[`${colId}Op`]) {
        model = {
          operator: params[`${colId}Op`] as 'AND' | 'OR',
          filterType: filterType,
          condition1: {
            ...condition1,
            filterType: filterType,
            type: params[`${colId}C1t`],
          },
          condition2: {
            ...condition2,
            filterType: filterType,
            type: params[`${colId}C2t`],
          },
        }
      }

      return model
        ? {
            [colId]: model,
          }
        : {}
    })
    .filter((filterObj) => !_.isEmpty(filterObj))
    .reduce((prevValue, currentValue) => {
      return {
        ...prevValue,
        ...currentValue,
      }
    }, {}) as ColumnFilter

  return state
}

/**
 * TODO comments
 *
 * @param params TODO
 */
export const getGridStateFromUrlParams = (params: UrlParams): GridState => {
  return {
    searchText: getSearchTextFromUrlParams(params),
    columnState: getSortStateFromUrlParams(params),
    filterModel: getFilterStateFromUrlParams(params),
  }
}

/**
 * TODO comments
 *
 * @param initialGridState TODO comments
 */
export const useGridState = (initialGridState?: GridState): UseGridStateProps => {
  const initialState = initialGridState || {
    searchText: '',
    columnState: [],
    filterModel: {},
  }
  const searchTextRef = useRef<string>(initialState.searchText || '')
  const columnStateRef = useRef<ColumnState[]>(initialState.columnState)
  const filterModelRef = useRef<ColumnFilter>(initialState.filterModel)
  const [gridState, setGridState] = useState<GridState>(initialState)

  const updateGridState = useCallback(
    (gridState: OptionalGridState, callbackIfChanged?: (newState: GridState) => void): void => {
      // TODO: refactor this ==> probably a cleaner/easier way to do this part??
      let changed = false

      if (typeof gridState.searchText !== 'undefined' && gridState.searchText !== searchTextRef.current) {
        changed = true
        searchTextRef.current = gridState.searchText
      }

      if (typeof gridState.columnState !== 'undefined' && gridState.columnState !== columnStateRef.current) {
        changed = true
        columnStateRef.current = gridState.columnState
      }

      if (typeof gridState.filterModel !== 'undefined' && gridState.filterModel !== filterModelRef.current) {
        changed = true
        filterModelRef.current = gridState.filterModel
      }

      const newState = {
        searchText: searchTextRef.current,
        columnState: columnStateRef.current,
        filterModel: filterModelRef.current,
      }

      if (changed) {
        setGridState(newState)

        if (!callbackIfChanged) {
          return
        }
        callbackIfChanged(newState)
      }
    },
    [],
  )

  return {
    gridState,
    updateGridState,
  }
}
