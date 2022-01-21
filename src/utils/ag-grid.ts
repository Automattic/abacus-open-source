import { ColumnState } from 'ag-grid-community'
import _ from 'lodash'

import { UrlSearchParams } from './url-params'

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

export type OnGridStateChangeFunction = (gridState: Partial<GridState>) => void
export type ResetGridStateFunction = () => void

export interface GridActions {
  onGridStateChange: OnGridStateChangeFunction
  resetGridState: ResetGridStateFunction
}

const gridStateToSortParams = (gridState: GridState): UrlSearchParams => {
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
      } as UrlSearchParams
    })
    .reduce((prevValue, currentValue) => {
      return {
        ...prevValue,
        ...currentValue,
      } as UrlSearchParams
    }, {})
}

const gridStateToFilterParams = (gridState: GridState): UrlSearchParams => {
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
          } as UrlSearchParams
        } else {
          return {
            [`${colId}Op`]: filter.operator,
            [`${colId}C1f`]: filter.condition1.filter,
            [`${colId}C1t`]: filter.condition1.type,
            [`${colId}C2f`]: filter.condition2.filter,
            [`${colId}C2t`]: filter.condition2.type,
          } as UrlSearchParams
        }
      } else {
        if ('dateFrom' in filter) {
          return {
            [`${colId}Df`]: filter.dateFrom,
            [`${colId}Dt`]: filter.dateTo,
            [`${colId}T`]: filter.type,
          } as UrlSearchParams
        } else {
          return {
            [`${colId}F`]: filter.filter,
            [`${colId}T`]: filter.type,
          } as UrlSearchParams
        }
      }
    })
    .reduce((prevValue, currentValue) => {
      return {
        ...prevValue,
        ...currentValue,
      } as UrlSearchParams
    }, {})
}

/**
 * Converts a GridState object to the corresponding UrlSearchParams object.
 *
 * @param gridState the GridState to convert
 */
export const gridStateToUrlSearchParams = (gridState: GridState): UrlSearchParams => {
  const urlParams = {
    ...(gridState.searchText.length > 0 ? { search: gridState.searchText } : {}),
    ...gridStateToSortParams(gridState),
    ...gridStateToFilterParams(gridState),
  }

  return _.isEmpty(urlParams) ? { null: 'true' } : urlParams
}

// Takes an array of potential endings and finds the first ending that is an actual suffix of str.
// Then it returns the substring of str that does not contain that ending.
const prefixFromEndings = (endings: string[], str: string) => {
  const match = endings.find((ending) => str.endsWith(ending))
  // istanbul ignore next; shouldn't be possible in current cases since keys are always filtered first
  if (!match) {
    throw new Error(`String ${str} does not end with any of the endings in: ${JSON.stringify(endings)}`)
  }
  // Slice string from [start, ending substring)
  return str.slice(0, -match.length)
}

const urlSearchParamsToSearchText = (params: UrlSearchParams): string => {
  return params.search || ''
}

const urlSearchParamsToSortState = (params: UrlSearchParams): ColumnState[] => {
  const endings = ['S', 'Si']

  const colIds = Object.keys(params)
    .filter((key) => endings.some((ending) => key.endsWith(ending)))
    .map((sortKey) => prefixFromEndings(endings, sortKey))
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

const urlSearchParamsToFilterState = (params: UrlSearchParams): ColumnFilter => {
  const endings = ['Df', 'Dt', 'F', 'T', 'Op', 'C1df', 'C2df', 'C1dt', 'C2dt', 'C1f', 'C2f', 'C1t', 'C2t']

  const colIds = Object.keys(params)
    .filter((key) => endings.some((ending) => key.endsWith(ending)))
    .map((filterKey) => prefixFromEndings(endings, filterKey))
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
 * Converts a UrlSearchParams object into the corresponding Grid State.
 *
 * @param params the UrlSearchParams object to convert
 */
export const urlSearchParamsToGridState = (params: UrlSearchParams): GridState => {
  return {
    searchText: urlSearchParamsToSearchText(params),
    columnState: urlSearchParamsToSortState(params),
    filterModel: urlSearchParamsToFilterState(params),
  }
}
