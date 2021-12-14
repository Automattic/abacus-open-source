import { prettyDOM, screen } from '@testing-library/react'
import React from 'react'

import * as Visualizations from 'src/lib/visualizations'
import { render } from 'src/test-helpers/test-utils'

import LazyPlot from './LazyPlot'

// To remove non-deterministic elements from Plotly code
// https://stackoverflow.com/a/69925334
const removeUnstableHtmlProperties = (htmlElement: HTMLElement) => {
  const domHtml = prettyDOM(htmlElement, Infinity)
  if (!domHtml) return undefined
  return domHtml.replace(/id(.*)"(.*)"|class(.*)"(.*)"|url\((.*)\)/g, '')
}

const createRange = (n: number): number[] => {
  const range = [...Array(n).keys()]
  return range
}

const createPlotData = (size: number) => {
  return [
    {
      name: 'Test Data Variant 1',
      x: createRange(size),
      y: createRange(size),
      line: {
        color: Visualizations.variantColors[0],
      },
      mode: 'lines' as const,
      type: 'scatter' as const,
    },
    {
      name: 'Test Data Variant 2',
      x: createRange(size),
      y: createRange(size),
      line: {
        color: Visualizations.variantColors[1],
      },
      mode: 'lines' as const,
      type: 'scatter' as const,
    },
  ]
}

test('renders progress loading bar', async () => {
  const layout = {
    ...Visualizations.plotlyLayoutDefault,
    title: 'Test Plot 1',
  }
  render(<LazyPlot layout={layout} data={createPlotData(20)} />)

  expect(await screen.findByRole('progressbar'))
})

test('renders a chart', async () => {
  const layout = {
    ...Visualizations.plotlyLayoutDefault,
    title: 'Test Plot 2',
  }
  const { container } = render(<LazyPlot layout={layout} data={createPlotData(20)} />)

  expect(await screen.findByText('Test Plot 2'))

  expect(removeUnstableHtmlProperties(container)).toMatchSnapshot()
})
