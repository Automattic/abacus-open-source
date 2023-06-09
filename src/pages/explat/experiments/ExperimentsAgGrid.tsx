import { createStyles, LinearProgress, makeStyles } from '@material-ui/core'
import debugFactory from 'debug'
import React from 'react'

import ExperimentsApi from 'src/api/explat/ExperimentsApi'
import ExperimentsTableAgGrid from 'src/components/explat/experiments/multi-view/ExperimentsTableAgGrid'
import Layout from 'src/components/page-parts/Layout'
import { useDataLoadingError, useDataSource } from 'src/utils/data-loading'

const debug = debugFactory('abacus:pages/experiments/Experiments.tsx')

const useStyles = makeStyles(() =>
  createStyles({
    loadingBarContainer: {
      height: 0,
      overflow: 'visible',
    },
  }),
)

const Experiments = function (): JSX.Element {
  debug('ExperimentsPage#render')

  const classes = useStyles()
  const { isLoading, data: experiments, error } = useDataSource(() => ExperimentsApi.findAll(), [])

  useDataLoadingError(error, 'Experiment')
  return (
    <Layout headTitle='Experiments' flexContent>
      <div className={classes.loadingBarContainer}>{isLoading && <LinearProgress />}</div>
      {!error && <ExperimentsTableAgGrid experiments={experiments || []} />}
    </Layout>
  )
}

export default Experiments
