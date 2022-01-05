import { ColumnApi, ColumnState, GridApi } from 'ag-grid-community'
import _ from 'lodash'

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

export const getFilterParamsFromGrid = (api: GridApi, colState: ColumnState[]): UrlParams => {
  return colState
    .map((column: ColumnState) => column.colId as string)
    .map((colId: string) => {
      const filterInstance = api.getFilterInstance(colId)
      return { model: filterInstance?.getModel() as FilterObj, colId: colId }
    })
    .filter(({ model }) => model !== null)
    .map(({ model, colId }) => {
      if ('operator' in model) {
        if ('dateFrom' in model.condition1) {
          return {
            [`${colId}Op`]: model.operator,
            [`${colId}C1df`]: model.condition1.dateFrom,
            [`${colId}C1dt`]: model.condition1.dateTo,
            [`${colId}C1t`]: model.condition1.type,
            [`${colId}C2df`]: model.condition2.dateFrom,
            [`${colId}C2dt`]: model.condition2.dateTo,
            [`${colId}C2t`]: model.condition2.type,
          } as UrlParams
        } else {
          return {
            [`${colId}Op`]: model.operator,
            [`${colId}C1f`]: model.condition1.filter,
            [`${colId}C1t`]: model.condition1.type,
            [`${colId}C2f`]: model.condition2.filter,
            [`${colId}C2t`]: model.condition2.type,
          } as UrlParams
        }
      } else {
        if ('dateFrom' in model) {
          return {
            [`${colId}Df`]: model.dateFrom,
            [`${colId}Dt`]: model.dateTo,
            [`${colId}T`]: model.type,
          } as UrlParams
        } else {
          return {
            [`${colId}F`]: model.filter,
            [`${colId}T`]: model.type,
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

export const getFilterParamsFromUrlParams = (params: UrlParams): UrlParams => {
  const filterParams = {} as UrlParams

  Object.entries(params).forEach(([key, value]) => {
    if (!(key.endsWith('S') || key.endsWith('Si') || key === 'search' || key === 'null')) {
      filterParams[key] = value
    }
  })

  return filterParams
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

export const setGridFilter = (params: UrlParams, gridApi: GridApi, gridColumnApi: ColumnApi): void => {
  // istanbul ignore next; trivial and shouldn't occur
  if (Object.keys(params).length === 0) {
    gridApi.setFilterModel(null)
    return
  }

  const columnState = gridColumnApi.getColumnState()
  columnState.forEach((column: ColumnState) => {
    const colId = column.colId as string
    const filterInstance = gridApi.getFilterInstance(colId)

    let filterType = ''
    let singleFilter = {}
    let condition1 = {}
    let condition2 = {}
    if (colId.endsWith('Datetime')) {
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
        operator: params[`${colId}Op`],
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

    filterInstance?.setModel(model)
    gridApi.onFilterChanged()
  })
}
