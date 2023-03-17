import { getDefaultNormalizer, screen } from '@testing-library/react'
import _ from 'lodash'
import React from 'react'

import { stringifyMetricParams } from 'src/lib/explat/metrics'
import Fixtures from 'src/test-helpers/fixtures'
import { render } from 'src/test-helpers/test-utils'
import { toggleDebugMode } from 'src/utils/general'

import MetricDetails from './MetricDetails'

const metric = Fixtures.createMetric(1)

describe('MetricDetails', () => {
  it('renders the loading state', async () => {
    render(<MetricDetails isLoading={true} />)
    screen.getByRole(/progressbar/)
  })

  it('with a metric, renders metric details in compact form', async () => {
    render(<MetricDetails metric={metric} isCompact isLoading={false} />)

    screen.getByText(/Parameters/)
    screen.getByText(stringifyMetricParams(metric), {
      normalizer: getDefaultNormalizer({ trim: true, collapseWhitespace: false }),
    })
  })

  it('with a metric, renders full metric details', async () => {
    render(<MetricDetails metric={metric} isLoading={false} />)
    screen.getByText(/Parameter Type/)
    screen.getByText(_.capitalize(metric.parameterType))
    screen.getByText(/Description/)
    screen.getByText(metric.description)
  })

  it('with a revenue metric, renders full metric details', async () => {
    const metric = Fixtures.createMetric(2)
    render(<MetricDetails metric={metric} isLoading={false} />)
    expect(screen.queryByText(/Cash Sales/)).toBeInTheDocument()
  })

  it('with a metric, renders assigned tags', async () => {
    toggleDebugMode()
    const metric = Fixtures.createMetric(1)
    render(<MetricDetails metric={metric} isLoading={false} />)
    expect(screen.queryByText(/tag_1/)).toBeInTheDocument()
  })
})
