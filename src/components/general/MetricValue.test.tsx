/* eslint-disable no-irregular-whitespace */
import React from 'react'

import { MetricParameterType } from 'src/lib/schemas'
import { render } from 'src/test-helpers/test-utils'

import MetricValue from './MetricValue'

test('renders metric values', () => {
  expect(render(<MetricValue value={1} metricParameterType={MetricParameterType.Conversion} />).container)
    .toMatchInlineSnapshot(`
    <div>
      
      100
      %
    </div>
  `)
  expect(render(<MetricValue value={0.01} metricParameterType={MetricParameterType.Conversion} />).container)
    .toMatchInlineSnapshot(`
    <div>
      
      1
      %
    </div>
  `)
  expect(render(<MetricValue value={0.123456789} metricParameterType={MetricParameterType.Conversion} />).container)
    .toMatchInlineSnapshot(`
    <div>
      
      12.35
      %
    </div>
  `)
  expect(
    render(<MetricValue value={1} metricParameterType={MetricParameterType.Conversion} isDifference={true} />)
      .container,
  ).toMatchInlineSnapshot(`
    <div>
      
      100
      <span
        class="makeStyles-tooltipped-1"
        title="Percentage points."
      >
        pp
      </span>
    </div>
  `)
  expect(
    render(<MetricValue value={0.01} metricParameterType={MetricParameterType.Conversion} isDifference={true} />)
      .container,
  ).toMatchInlineSnapshot(`
    <div>
      
      1
      <span
        class="makeStyles-tooltipped-1"
        title="Percentage points."
      >
        pp
      </span>
    </div>
  `)
  expect(
    render(<MetricValue value={0.123456789} metricParameterType={MetricParameterType.Conversion} isDifference={true} />)
      .container,
  ).toMatchInlineSnapshot(`
    <div>
      
      12.35
      <span
        class="makeStyles-tooltipped-1"
        title="Percentage points."
      >
        pp
      </span>
    </div>
  `)

  expect(render(<MetricValue value={1} metricParameterType={MetricParameterType.Revenue} />).container)
    .toMatchInlineSnapshot(`
    <div>
      
      1.00
       USD
    </div>
  `)
  expect(render(<MetricValue value={0.01} metricParameterType={MetricParameterType.Revenue} />).container)
    .toMatchInlineSnapshot(`
    <div>
      
      0.01
       USD
    </div>
  `)
  expect(render(<MetricValue value={0.123456789} metricParameterType={MetricParameterType.Revenue} />).container)
    .toMatchInlineSnapshot(`
    <div>
      
      0.12
       USD
    </div>
  `)
  expect(
    render(<MetricValue value={1} metricParameterType={MetricParameterType.Revenue} isDifference={true} />).container,
  ).toMatchInlineSnapshot(`
    <div>
      
      1.00
       USD
    </div>
  `)
  expect(
    render(<MetricValue value={0.01} metricParameterType={MetricParameterType.Revenue} isDifference={true} />)
      .container,
  ).toMatchInlineSnapshot(`
    <div>
      
      0.01
       USD
    </div>
  `)
  expect(
    render(<MetricValue value={0.123456789} metricParameterType={MetricParameterType.Revenue} isDifference={true} />)
      .container,
  ).toMatchInlineSnapshot(`
    <div>
      
      0.12
       USD
    </div>
  `)
})
