import { LinearProgress } from '@material-ui/core'
import React, { Suspense } from 'react'
import { PlotParams } from 'react-plotly.js'

const Plot = React.lazy(() => import('./Plot'))

/**
 * A code-split version of a React Plotly plot in order to reduce memory usage. Displays a loading bar while it lazily loads react-plotly.
 * This should be used instead of importing react-plotly.js directly.
 * @param props PlotParams as defined in https://www.npmjs.com/package/@types/react-plotly.js
 * @returns A Plotly Plot component or a loading bar if it is loading.
 */
export default function LazyPlot(props: PlotParams): JSX.Element {
  return (
    <Suspense fallback={<LinearProgress />}>
      <Plot {...props} />
    </Suspense>
  )
}
