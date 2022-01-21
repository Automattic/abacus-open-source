import { LinearProgress } from '@material-ui/core'
import debugFactory from 'debug'
import _ from 'lodash'
import React, { useRef } from 'react'

import ExperimentsApi from 'src/api/ExperimentsApi'
import ExperimentsTableAgGrid from 'src/components/experiments/multi-view/ExperimentsTableAgGrid'
import Layout from 'src/components/page-parts/Layout'
import { GridState, gridStateToUrlSearchParams, urlSearchParamsToGridState } from 'src/utils/ag-grid'
import { useDataLoadingError, useDataSource } from 'src/utils/data-loading'
import { useUrlSearchParams } from 'src/utils/url-params'

const debug = debugFactory('abacus:pages/experiments/Experiments.tsx')

const defaultGridState: GridState = {
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

  const { urlSearchParams, pushUrlSearchParams } = useUrlSearchParams()
  const gridStateRef = useRef<GridState>(urlSearchParamsToGridState(urlSearchParams))

  const resetGridState = () => pushUrlSearchParams(gridStateToUrlSearchParams(defaultGridState))
  const onGridStateChange = (newGridState: Partial<GridState>) =>
    pushUrlSearchParams(gridStateToUrlSearchParams({ ...gridStateRef.current, ...newGridState }))

  if (_.isEmpty(urlSearchParams)) {
    resetGridState()
  }

  gridStateRef.current = urlSearchParamsToGridState(urlSearchParams)

  return (
    <Layout headTitle='Experiments' flexContent>
      {isLoading ? (
        <LinearProgress />
      ) : (
        <ExperimentsTableAgGrid
          experiments={experiments || []}
          gridState={gridStateRef.current}
          actions={{ onGridStateChange, resetGridState }}
        />
      )}
    </Layout>
  )
}

export default Experiments
