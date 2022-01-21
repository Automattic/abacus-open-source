import { GridState, gridStateToUrlSearchParams, urlSearchParamsToGridState } from './ag-grid'
import { UrlSearchParams } from './url-params'

// corresponding gridStates and UrlSearchParams
const statesAndParams = [
  {
    gridState: {
      searchText: 'explat_test',
      columnState: [
        {
          colId: 'name',
          sort: 'asc',
          sortIndex: 0,
        },
      ],
      filterModel: {
        owner: {
          filterType: 'text',
          filter: 'isaac',
          type: 'contains',
        },
      },
    } as GridState,
    urlParams: {
      search: 'explat_test',
      nameS: 'asc',
      nameSi: '0',
      ownerF: 'isaac',
      ownerT: 'contains',
    } as UrlSearchParams,
  },
  {
    gridState: {
      searchText: '',
      columnState: [],
      filterModel: {
        start: {
          filterType: 'date',
          dateFrom: '2022-01-01',
          dateTo: '2022-02-22',
          type: 'inRange',
        },
      },
    } as GridState,
    urlParams: {
      startDf: '2022-01-01',
      startDt: '2022-02-22',
      startT: 'inRange',
    } as UrlSearchParams,
  },
  {
    gridState: {
      searchText: '',
      columnState: [],
      filterModel: {
        owner: {
          operator: 'AND',
          filterType: 'text',
          condition1: {
            filter: 'isaac',
            filterType: 'text',
            type: 'contains',
          },
          condition2: {
            filter: 'aaron',
            filterType: 'text',
            type: 'equals',
          },
        },
      },
    } as GridState,
    urlParams: {
      ownerOp: 'AND',
      ownerC1f: 'isaac',
      ownerC1t: 'contains',
      ownerC2f: 'aaron',
      ownerC2t: 'equals',
    } as UrlSearchParams,
  },
  {
    gridState: {
      searchText: '',
      columnState: [],
      filterModel: {
        start: {
          operator: 'OR',
          filterType: 'date',
          condition1: {
            dateFrom: '2022-01-01',
            dateTo: '2022-02-22',
            type: 'inRange',
            filterType: 'date',
          },
          condition2: {
            dateFrom: '2022-03-31',
            dateTo: '2022-04-14',
            type: 'equals',
            filterType: 'date',
          },
        },
      },
    } as GridState,
    urlParams: {
      startOp: 'OR',
      startC1df: '2022-01-01',
      startC1dt: '2022-02-22',
      startC1t: 'inRange',
      startC2df: '2022-03-31',
      startC2dt: '2022-04-14',
      startC2t: 'equals',
    } as UrlSearchParams,
  },
]

describe('utils/ag-grid.ts module', () => {
  describe('urlSearchParamsToGridState', () => {
    it('returns an empty GridState given an empty UrlSearchParams object', () => {
      expect(urlSearchParamsToGridState({})).toMatchObject({
        searchText: '',
        columnState: [],
        filterModel: {},
      })
    })

    it('returns the correct GridState given UrlSearchParams object with search, sort, and filter params', () => {
      statesAndParams.forEach(({ gridState, urlParams }) => {
        expect(urlSearchParamsToGridState(urlParams)).toMatchObject(gridState)
      })
    })

    it('returns an empty GridState given incomplete UrlSearchParams object', () => {
      expect(urlSearchParamsToGridState({ nameT: 'contains' })).toMatchObject({
        searchText: '',
        columnState: [],
        filterModel: {},
      })
    })

    it('returns an empty GridState given incorrect UrlSearchParams object', () => {
      expect(urlSearchParamsToGridState({ wrong: 'test' })).toMatchObject({
        searchText: '',
        columnState: [],
        filterModel: {},
      })
    })
  })

  describe('gridStateToUrlSearchParams', () => {
    it('empty gridState should result in empty UrlSearchParams object', () => {
      expect(
        gridStateToUrlSearchParams({
          searchText: '',
          columnState: [],
          filterModel: {},
        }),
      ).toMatchObject({})
    })

    it('gridState should result in corresponding UrlSearchParams object', () => {
      statesAndParams.forEach(({ gridState, urlParams }) => {
        expect(gridStateToUrlSearchParams(gridState)).toMatchObject(urlParams)
      })
    })
  })
})
