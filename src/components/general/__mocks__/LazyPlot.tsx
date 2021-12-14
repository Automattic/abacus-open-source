import React from 'react'
import { PlotParams } from 'react-plotly.js'

interface LazyPlotParams extends PlotParams {
  importFunc?: (name: string) => Promise<{ default: React.ComponentType<any> }>
}

export default function LazyPlot(props: LazyPlotParams): JSX.Element {
  return <div>A mocked LazyPlot with {JSON.stringify(props, null, 4)} passed!</div>
}
