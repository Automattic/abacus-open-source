import { LinearProgress } from '@material-ui/core'
import { Alert } from '@material-ui/lab'
import React, { useEffect, useRef, useState } from 'react'
import { PlotParams } from 'react-plotly.js'
import createPlotlyComponent from 'react-plotly.js/factory'

interface LazyPlotParams extends PlotParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importFunc?: (name: string) => Promise<{ default: React.ComponentType<any> }>
}

/**
 * A code-split version of a React Plotly plot in order to reduce memory usage. Displays a loading bar while it lazily loads react-plotly.
 * @param props PlotParams as defined in https://www.npmjs.com/package/@types/react-plotly.js
 * @returns A Plotly Plot component.
 */
export default function LazyPlot(props: LazyPlotParams): JSX.Element {
  const plotRef = useRef<React.ComponentType<PlotParams> | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    let importPromise
    if (props.importFunc) {
      importPromise = props.importFunc('plotly.js-cartesian-dist')
    } else {
      importPromise = import('plotly.js-cartesian-dist')
    }
    importPromise
      .then(({ default: plotly }) => {
        plotRef.current = createPlotlyComponent(plotly)
        setLoading(false)
        return false
      })
      .catch((_) => {
        setLoading(false)
        setError(true)
      })
  }, [props])

  const Plot = plotRef.current

  return (
    <>
      {loading ? (
        <LinearProgress />
      ) : error ? (
        <Alert severity='error'>Chart could not be loaded.</Alert>
      ) : (
        Plot && <Plot {...props} />
      )}
    </>
  )
}
