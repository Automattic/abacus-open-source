import { LinearProgress } from '@material-ui/core'
import { Alert } from '@material-ui/lab'
import React, { useEffect, useRef, useState } from 'react'
import { PlotParams } from 'react-plotly.js'
import createPlotlyComponent from 'react-plotly.js/factory'

/**
 * A code-split version of a React Plotly plot in order to reduce memory usage. Displays a loading bar while it lazily loads react-plotly.
 * @param props PlotParams as defined in https://www.npmjs.com/package/@types/react-plotly.js
 * @returns A Plotly Plot component.
 */
export default function LazyPlot(props: PlotParams): JSX.Element {
  const Plot = useRef<React.ComponentType<PlotParams> | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    import('plotly.js-cartesian-dist')
      .then(({ default: plotly }) => {
        Plot.current = createPlotlyComponent(plotly)
        setLoading(false)
        return false
      })
      .catch((_) => {
        setLoading(false)
        setError(true)
      })
  }, [loading])

  return (
    <>
      {loading ? (
        <LinearProgress />
      ) : error ? (
        <Alert severity='error'>Chart could not be loaded.</Alert>
      ) : (
        // eslint-disable-next-line
        <Plot.current {...props} />
      )}
    </>
  )
}
