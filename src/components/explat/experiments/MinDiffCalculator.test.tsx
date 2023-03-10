import { screen } from '@testing-library/react'
import _ from 'lodash'
import React from 'react'

import { experimentToFormData } from 'src/lib/explat/form-data'
import { MetricParameterType } from 'src/lib/explat/schemas'
import Fixtures from 'src/test-helpers/fixtures'
import { interactWithMinDiffCalculator, render } from 'src/test-helpers/test-utils'

import MinDiffCalculator from './MinDiffCalculator'

describe('Min diff calculator', () => {
  const samplesPerMonth = 50000
  const experiment = experimentToFormData(Fixtures.createExperimentFull())

  const setSamplesPerMonth = jest.fn()

  it('should calculate and apply minimum difference for Revenue metrics', async () => {
    const revenueMetric = Fixtures.createMetric(0)
    const setMinPracticalDiff = jest.fn()

    render(
      <MinDiffCalculator
        samplesPerMonth={samplesPerMonth}
        experiment={experiment}
        setSamplesPerMonth={setSamplesPerMonth}
        setMinPracticalDiff={setMinPracticalDiff}
        metric={revenueMetric}
      />,
    )

    expect(screen.queryByText(/Calculator: Minimum practical difference/)).toBeVisible()

    await interactWithMinDiffCalculator(MetricParameterType.Revenue, undefined, '10', '10000')
    const expectedMinDiff = 0.2

    expect(setMinPracticalDiff).toHaveBeenLastCalledWith(expectedMinDiff)
  })

  it('should calculate and apply minimum difference for Conversion metrics', async () => {
    const conversionMetric = Fixtures.createMetric(1)
    const setMinPracticalDiff = jest.fn()

    render(
      <MinDiffCalculator
        samplesPerMonth={samplesPerMonth}
        experiment={experiment}
        setSamplesPerMonth={setSamplesPerMonth}
        setMinPracticalDiff={setMinPracticalDiff}
        metric={conversionMetric}
      />,
    )

    expect(screen.queryByText(/Calculator: Minimum practical difference/)).toBeVisible()

    await interactWithMinDiffCalculator(MetricParameterType.Conversion, undefined, '10', '800')
    const expectedMinDiff = 0.016

    expect(setMinPracticalDiff).toHaveBeenLastCalledWith(expectedMinDiff)
  })
})
