import { LinearProgress } from '@material-ui/core'
import { ColumnState } from 'ag-grid-community'
import debugFactory from 'debug'
import _ from 'lodash'
import React, { useEffect } from 'react'

import ExperimentsApi from 'src/api/ExperimentsApi'
import ExperimentsTableAgGrid from 'src/components/experiments/multi-view/ExperimentsTableAgGrid'
import Layout from 'src/components/page-parts/Layout'
import {
  ColumnFilter,
  getGridStateFromUrlParams,
  getUrlParamsFromGridState,
  GridState,
  useGridState,
} from 'src/utils/ag-grid'
import { useDataLoadingError, useDataSource } from 'src/utils/data-loading'
import { usePageParams } from 'src/utils/url-params'

const debug = debugFactory('abacus:pages/experiments/Experiments.tsx')

// Exported for testing purposes
export const defaultGridState: GridState = {
  searchText: '',
  columnState: [
    {
      colId: 'status',
      sort: 'asc',
      sortIndex: 0,
    },
    {
      colId: 'startDatetime',
      sort: 'desc',
      sortIndex: 1,
    },
  ],
  filterModel: {},
}

const Experiments = function (): JSX.Element {
  debug('ExperimentsPage#render')

  const { isLoading, data: experiments, error } = useDataSource(() => ExperimentsApi.findAll(), [])

  useDataLoadingError(error, 'Experiment')

  const { gridState, updateGridState } = useGridState(defaultGridState)
  const { pageParams, replacePageParams } = usePageParams()

  useEffect(() => {
    if (_.isEmpty(pageParams)) {
      updateGridState(defaultGridState)
    } else {
      updateGridState(getGridStateFromUrlParams(pageParams))
    }
  }, [pageParams, updateGridState])

  const updateParamsFromGridState = (newState: GridState) => {
    let params = getUrlParamsFromGridState(newState)

    // TODO: comment reasoning for this
    if (_.isEmpty(params)) {
      params = { null: 'true' }
    }

    replacePageParams(params)
  }

  const updateGridSearchText = (searchText: string) => {
    updateGridState({ searchText: searchText }, updateParamsFromGridState)
  }

  const updateGridSortState = (sortState: ColumnState[]) => {
    updateGridState({ columnState: sortState }, updateParamsFromGridState)
  }

  const updateGridFilterModel = (filterModel: ColumnFilter) => {
    updateGridState({ filterModel: filterModel }, updateParamsFromGridState)
  }

  const resetGridState = () => {
    updateGridState(defaultGridState, updateParamsFromGridState)
  }

  return (
    <Layout headTitle='Experiments' flexContent>
      {isLoading ? (
        <LinearProgress />
      ) : (
        <ExperimentsTableAgGrid
          experiments={experiments || []}
          gridState={gridState}
          actions={{ updateGridSearchText, updateGridSortState, updateGridFilterModel, resetGridState }}
        />
      )}
    </Layout>
  )
}

export default Experiments
