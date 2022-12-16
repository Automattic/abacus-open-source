import { noop } from 'lodash'
import MockDate from 'mockdate'
import React from 'react'

import { Status } from 'src/lib/explat/schemas'
import Fixtures from 'src/test-helpers/fixtures'
import { createMatchMedia, render } from 'src/test-helpers/test-utils'

import ExperimentDetails from './ExperimentDetails'

MockDate.set('2020-07-21')

const initialJsDomWindowInnerWidth = window.innerWidth
afterEach(() => {
  window.matchMedia = createMatchMedia(initialJsDomWindowInnerWidth)
})

const experimentReloadRef: React.MutableRefObject<() => void> = { current: noop }

test('renders as expected at large width', () => {
  window.matchMedia = createMatchMedia(1600)

  const metrics = Fixtures.createMetrics()
  const segments = Fixtures.createSegments(5)
  const tags = Fixtures.createTagBares(5)
  const experiment = Fixtures.createExperimentFull({
    segmentAssignments: [
      Fixtures.createSegmentAssignment({ segmentAssignmentId: 101, segmentId: 1 }),
      Fixtures.createSegmentAssignment({ segmentAssignmentId: 102, segmentId: 2, isExcluded: true }),
    ],
  })
  const { container } = render(
    <ExperimentDetails
      experiment={experiment}
      metrics={metrics}
      segments={segments}
      experimentReloadRef={experimentReloadRef}
      tags={tags}
    />,
  )

  expect(container).toMatchSnapshot()
})

test('renders as expected at small width', () => {
  window.matchMedia = createMatchMedia(600)
  const metrics = Fixtures.createMetrics()
  const segments = Fixtures.createSegments(5)
  const tags = Fixtures.createTagBares(5)
  const experiment = Fixtures.createExperimentFull({
    segmentAssignments: [
      Fixtures.createSegmentAssignment({ segmentAssignmentId: 101, segmentId: 1 }),
      Fixtures.createSegmentAssignment({ segmentAssignmentId: 102, segmentId: 2, isExcluded: true }),
    ],
  })
  const { container } = render(
    <ExperimentDetails
      experiment={experiment}
      metrics={metrics}
      segments={segments}
      tags={tags}
      experimentReloadRef={experimentReloadRef}
    />,
  )

  expect(container).toMatchSnapshot()
})

test('renders as expected with conclusion data', () => {
  const metrics = Fixtures.createMetrics()
  const segments = Fixtures.createSegments(5)
  const tags = Fixtures.createTagBares(5)
  const experiment = Fixtures.createExperimentFull({
    conclusionUrl: 'https://betterexperiments.wordpress.com/experiment_1/conclusion',
    deployedVariationId: 2,
    endReason: 'Ran its course.',
    segmentAssignments: [
      Fixtures.createSegmentAssignment({ segmentAssignmentId: 101, segmentId: 1 }),
      Fixtures.createSegmentAssignment({ segmentAssignmentId: 102, segmentId: 2, isExcluded: true }),
    ],
    status: Status.Disabled,
  })
  const { container } = render(
    <ExperimentDetails
      experiment={experiment}
      metrics={metrics}
      segments={segments}
      tags={tags}
      experimentReloadRef={experimentReloadRef}
    />,
  )

  expect(container).toMatchSnapshot()
})

test('renders as expected without conclusion data', () => {
  const metrics = Fixtures.createMetrics()
  const segments = Fixtures.createSegments(5)
  const tags = Fixtures.createTagBares(5)
  const experiment = Fixtures.createExperimentFull({
    segmentAssignments: [
      Fixtures.createSegmentAssignment({ segmentAssignmentId: 101, segmentId: 1 }),
      Fixtures.createSegmentAssignment({ segmentAssignmentId: 102, segmentId: 2, isExcluded: true }),
    ],
  })
  const { container } = render(
    <ExperimentDetails
      experiment={experiment}
      metrics={metrics}
      segments={segments}
      tags={tags}
      experimentReloadRef={experimentReloadRef}
    />,
  )

  expect(container).toMatchSnapshot()
})
