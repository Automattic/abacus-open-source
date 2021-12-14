import Plotly from 'plotly.js-cartesian-dist'
import createPlotlyComponent from 'react-plotly.js/factory'

// Loading up a partial bundle of Plotly to reduce bundle size
const Plot = createPlotlyComponent(Plotly)

export default Plot
