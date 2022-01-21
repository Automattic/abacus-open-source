import { render } from '@testing-library/react'
import React, { useEffect, useRef } from 'react'

import { getGridStateFromUrlParams, getUrlParamsFromGridState, GridState, useGridState } from './ag-grid'
import { UrlParams } from './url-params'

// corresponding gridStates and UrlParams
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
    } as UrlParams,
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
    } as UrlParams,
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
    } as UrlParams,
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
    } as UrlParams,
  },
]

describe('utils/ag-grid.ts module', () => {
  describe('getGridStateFromUrlParams', () => {
    it('returns an empty GridState given an empty UrlParams object', () => {
      expect(getGridStateFromUrlParams({})).toMatchObject({
        searchText: '',
        columnState: [],
        filterModel: {},
      })
    })

    it('returns the correct GridState given UrlParams object with search, sort, and filter params', () => {
      statesAndParams.forEach(({ gridState, urlParams }) => {
        expect(getGridStateFromUrlParams(urlParams)).toMatchObject(gridState)
      })
    })

    it('returns an empty GridState given incomplete UrlParams object', () => {
      expect(getGridStateFromUrlParams({ nameT: 'contains' })).toMatchObject({
        searchText: '',
        columnState: [],
        filterModel: {},
      })
    })

    it('returns an empty GridState given incorrect UrlParams object', () => {
      expect(getGridStateFromUrlParams({ wrong: 'test' })).toMatchObject({
        searchText: '',
        columnState: [],
        filterModel: {},
      })
    })
  })

  describe('getUrlParamsFromGridState', () => {
    it('empty gridState should result in empty URL params object', () => {
      expect(
        getUrlParamsFromGridState({
          searchText: '',
          columnState: [],
          filterModel: {},
        }),
      ).toMatchObject({})
    })

    it('gridState should result in corresponding URL params object', () => {
      statesAndParams.forEach(({ gridState, urlParams }) => {
        expect(getUrlParamsFromGridState(gridState)).toMatchObject(urlParams)
      })
    })
  })

  describe('useGridState', () => {
    const TestEmptyInitialGridState = () => {
      const { gridState } = useGridState()

      expect(gridState).toMatchObject({
        searchText: '',
        columnState: [],
        filterModel: {},
      })

      return <div></div>
    }

    const TestInitialGridState = () => {
      const initialState = {
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
      } as GridState
      const { gridState } = useGridState(initialState)

      useEffect(() => {
        expect(gridState).toMatchObject(initialState)
      })

      return <div></div>
    }

    const TestUpdateGridState = () => {
      const { gridState, updateGridState } = useGridState()

      const newState = {
        searchText: 'test2',
        columnState: [
          {
            colId: 'name',
            sort: 'desc',
            sortIndex: 0,
          },
        ],
        filterModel: {
          owner: {
            filterType: 'text',
            filter: 'blah',
            type: 'contains',
          },
        },
      } as GridState

      useEffect(() => {
        updateGridState(newState, (state: GridState) => {
          expect(state).toMatchObject(newState)
        })

        updateGridState({}, (state: GridState) => {
          expect(state).toMatchObject(gridState)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      return <div></div>
    }

    const TestUpdateGridStateNoCallback = () => {
      const { gridState, updateGridState } = useGridState()
      const count = useRef<number>(0)
      count.current++

      const newState = {
        searchText: 'test2',
        columnState: [
          {
            colId: 'name',
            sort: 'desc',
            sortIndex: 0,
          },
        ],
        filterModel: {
          owner: {
            filterType: 'text',
            filter: 'blah',
            type: 'contains',
          },
        },
      } as GridState

      useEffect(() => {
        updateGridState(newState)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      useEffect(() => {
        if (count.current === 2) {
          expect(gridState).toMatchObject(newState)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [gridState])

      return <div></div>
    }

    it('useGridState works as expected', () => {
      render(<TestEmptyInitialGridState />)
      render(<TestInitialGridState />)
      render(<TestUpdateGridState />)
      render(<TestUpdateGridStateNoCallback />)
    })
  })
})
