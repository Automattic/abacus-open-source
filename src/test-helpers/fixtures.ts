/**
 * Data fixtures to use in tests.
 *
 * Functions in this file return new objects populated with dummy values, which may potentially be overridden in
 * functions that accept Partial<T> as an argument.
 */
import _ from 'lodash'

import {
  Analysis,
  AnalysisStrategy,
  AssignmentCacheStatus,
  AttributionWindowSeconds,
  DistributionStats,
  ExperimentFull,
  ExperimentFullNew,
  Metric,
  MetricAssignment,
  MetricEstimates,
  MetricNew,
  MetricParameterType,
  Platform,
  Segment,
  SegmentAssignment,
  SegmentType,
  Status,
  TagBare,
  TransactionTypes,
  Variation,
} from 'src/lib/explat/schemas'

function createDistributionStats(fieldOverrides?: Partial<DistributionStats>): DistributionStats {
  return {
    mean: 0,
    top_95: 0,
    bottom_95: 0,
    top_99: 0,
    bottom_99: 0,
    top_50: 0,
    bottom_50: 0,
    ...fieldOverrides,
  }
}

function createMetricEstimates(fieldOverrides?: Partial<MetricEstimates>): MetricEstimates {
  return {
    variations: {
      '1': createDistributionStats(),
      '2': createDistributionStats(),
    },
    diffs: {
      '1_2': createDistributionStats(),
      '2_1': createDistributionStats(),
    },
    ratios: {
      '1_2': createDistributionStats(),
      '2_1': createDistributionStats(),
    },
    ...fieldOverrides,
  }
}

function createAnalysis(fieldOverrides: Partial<Analysis>): Analysis {
  return {
    metricAssignmentId: 123,
    analysisStrategy: AnalysisStrategy.IttPure,
    participantStats: {
      total: 1000,
      variation_1: 600,
      variation_2: 400,
    },
    metricEstimates: createMetricEstimates(),
    analysisDatetime: new Date(Date.UTC(2020, 4, 10)),
    ...fieldOverrides,
  }
}

function createMultiVariationAnalysis(fieldOverrides: Partial<Analysis>): Analysis {
  return {
    metricAssignmentId: 123,
    analysisStrategy: AnalysisStrategy.PpNaive,
    participantStats: {
      total: 1000,
      variation_1: 400,
      variation_2: 400,
      variation_3: 200,
    },
    metricEstimates: {
      variations: {
        '1': Fixtures.createDistributionStats({
          top_95: 1,
          bottom_95: 0.5,
          mean: 1,
        }),
        '2': Fixtures.createDistributionStats({
          top_95: 1,
          bottom_95: 0.5,
          mean: 1,
        }),
        '3': Fixtures.createDistributionStats({
          top_95: 1,
          bottom_95: 0.5,
          mean: 1,
        }),
      },
      diffs: {
        '2_1': Fixtures.createDistributionStats({
          top_95: 1,
          bottom_95: -1,
          mean: 0,
        }),
        '1_2': Fixtures.createDistributionStats({
          top_95: 0,
          bottom_95: 0,
          mean: 0,
        }),
        '3_1': Fixtures.createDistributionStats({
          top_95: 1,
          bottom_95: -1,
          mean: 0,
        }),
        '1_3': Fixtures.createDistributionStats({
          top_95: 0,
          bottom_95: 0,
          mean: 0,
        }),
        '3_2': Fixtures.createDistributionStats({
          top_95: 1,
          bottom_95: -1,
          mean: 0,
        }),
        '2_3': Fixtures.createDistributionStats({
          top_95: 0,
          bottom_95: 0,
          mean: 0,
        }),
      },
      ratios: {
        '2_1': Fixtures.createDistributionStats({
          top_95: 1,
          bottom_95: 0.5,
          mean: 0,
        }),
        '1_2': Fixtures.createDistributionStats({
          top_95: 0,
          bottom_95: 0,
          mean: 0,
        }),
        '3_1': Fixtures.createDistributionStats({
          top_95: 1,
          bottom_95: 0.5,
          mean: 0,
        }),
        '1_3': Fixtures.createDistributionStats({
          top_95: 0,
          bottom_95: 0,
          mean: 0,
        }),
        '3_2': Fixtures.createDistributionStats({
          top_95: 1,
          bottom_95: 0.5,
          mean: 0,
        }),
        '2_3': Fixtures.createDistributionStats({
          top_95: 0,
          bottom_95: 0,
          mean: 0,
        }),
      },
    },
    analysisDatetime: new Date(Date.UTC(2020, 4, 10)),
    ...fieldOverrides,
  }
}

function createAnalyses(): Analysis[] {
  return [
    // Full set of "latest" analyses for the default metric assignment.
    createAnalysis({
      analysisStrategy: AnalysisStrategy.IttPure,
      participantStats: {
        total: 1000,
        variation_1: 600,
        variation_2: 400,
      },
    }),
    createAnalysis({
      analysisStrategy: AnalysisStrategy.MittNoCrossovers,
      participantStats: {
        total: 900,
        variation_1: 540,
        variation_2: 360,
      },
    }),
    createAnalysis({
      analysisStrategy: AnalysisStrategy.MittNoSpammers,
      participantStats: {
        total: 850,
        variation_1: 510,
        variation_2: 340,
      },
    }),
    createAnalysis({
      analysisStrategy: AnalysisStrategy.MittNoSpammersNoCrossovers,
      participantStats: {
        total: 800,
        variation_1: 480,
        variation_2: 320,
      },
    }),
    createAnalysis({
      analysisStrategy: AnalysisStrategy.PpNaive,
      participantStats: {
        total: 700,
        variation_1: 420,
        variation_2: 280,
      },
    }),

    // Another set of analyses for the default metric assignment with an earlier date.
    createAnalysis({
      analysisStrategy: AnalysisStrategy.IttPure,
      participantStats: {
        total: 100,
        variation_1: 60,
        variation_2: 40,
      },
      analysisDatetime: new Date(Date.UTC(2020, 4, 9)),
    }),
    createAnalysis({
      analysisStrategy: AnalysisStrategy.MittNoCrossovers,
      participantStats: {
        total: 90,
        variation_1: 54,
        variation_2: 36,
      },
      analysisDatetime: new Date(Date.UTC(2020, 4, 9)),
    }),
    createAnalysis({
      analysisStrategy: AnalysisStrategy.MittNoSpammers,
      participantStats: {
        total: 85,
        variation_1: 51,
        variation_2: 34,
      },
      analysisDatetime: new Date(Date.UTC(2020, 4, 9)),
    }),
    createAnalysis({
      analysisStrategy: AnalysisStrategy.MittNoSpammersNoCrossovers,
      participantStats: {
        total: 80,
        variation_1: 48,
        variation_2: 32,
      },
      analysisDatetime: new Date(Date.UTC(2020, 4, 9)),
    }),
    createAnalysis({
      analysisStrategy: AnalysisStrategy.PpNaive,
      participantStats: {
        total: 70,
        variation_1: 42,
        variation_2: 28,
      },
      analysisDatetime: new Date(Date.UTC(2020, 4, 9)),
    }),

    // One example of a metric assignment with no data on one variation.
    createAnalysis({
      metricAssignmentId: 124,
      analysisStrategy: AnalysisStrategy.IttPure,
      participantStats: {
        total: 10,
        variation_1: 10,
      },
      metricEstimates: null,
    }),

    // Similar to the set of "latest" analyses for the default metric assignment, but with consistent recommendations.
    createAnalysis({
      metricAssignmentId: 126,
      analysisStrategy: AnalysisStrategy.IttPure,
      participantStats: {
        total: 2000,
        variation_1: 1200,
        variation_2: 800,
      },
    }),
    createAnalysis({
      metricAssignmentId: 126,
      analysisStrategy: AnalysisStrategy.MittNoCrossovers,
      participantStats: {
        total: 1800,
        variation_1: 1080,
        variation_2: 720,
      },
    }),
    createAnalysis({
      metricAssignmentId: 126,
      analysisStrategy: AnalysisStrategy.MittNoSpammers,
      participantStats: {
        total: 1700,
        variation_1: 920,
        variation_2: 780,
      },
    }),
    createAnalysis({
      metricAssignmentId: 126,
      analysisStrategy: AnalysisStrategy.MittNoSpammersNoCrossovers,
      participantStats: {
        total: 1600,
        variation_1: 960,
        variation_2: 640,
      },
    }),
    createAnalysis({
      metricAssignmentId: 126,
      analysisStrategy: AnalysisStrategy.PpNaive,
      participantStats: {
        total: 1400,
        variation_1: 840,
        variation_2: 560,
      },
    }),
    createAnalysis({
      metricAssignmentId: 126,
      analysisStrategy: AnalysisStrategy.PpNaive,
      participantStats: {
        total: 1200,
        variation_1: 940,
        variation_2: 660,
      },
      analysisDatetime: new Date(Date.UTC(2020, 5, 11)),
    }),
  ]
}

function createMetricAssignment(fieldOverrides: Partial<MetricAssignment>): MetricAssignment {
  return {
    metricAssignmentId: 123,
    metricId: 1,
    attributionWindowSeconds: AttributionWindowSeconds.OneWeek,
    changeExpected: true,
    isPrimary: true,
    minDifference: 0.1,
    ...fieldOverrides,
  }
}

/* istanbul ignore next; All coverage to be removed, see https://github.com/Automattic/abacus/issues/231 */
function createExperimentFullNew(fieldOverrides: Partial<ExperimentFullNew> = {}): ExperimentFullNew {
  const now = new Date()
  // This is a bit funky as we want to work in UTC but DateFns only does local time
  // and we want to avoid DST problems.
  const startDatetime = new Date(new Date(new Date().setMonth(now.getMonth() + 2)).setUTCHours(0, 0, 0, 0))
  const endDatetime = new Date(new Date(new Date().setMonth(now.getMonth() + 4)).setUTCHours(0, 0, 0, 0))
  return {
    name: 'experiment_1',
    startDatetime,
    endDatetime,
    platform: Platform.Calypso,
    ownerLogin: 'owner-nickname',
    description: 'Experiment with things. Change stuff. Profit.',
    existingUsersAllowed: false,
    p2Url: 'https://wordpress.com/experiment_1',
    variations: [
      {
        name: 'test',
        isDefault: false,
        allocatedPercentage: 40,
      },
      {
        name: 'control',
        isDefault: true,
        allocatedPercentage: 60,
      },
    ],
    metricAssignments: [
      createMetricAssignment({
        metricAssignmentId: 123,
        metricId: 1,
        attributionWindowSeconds: AttributionWindowSeconds.OneWeek,
        changeExpected: true,
        isPrimary: true,
        minDifference: 0.1,
      }),
      createMetricAssignment({
        metricAssignmentId: 124,
        metricId: 2,
        attributionWindowSeconds: AttributionWindowSeconds.FourWeeks,
        changeExpected: false,
        isPrimary: false,
        minDifference: 10.5,
      }),
      createMetricAssignment({
        metricAssignmentId: 125,
        metricId: 2,
        attributionWindowSeconds: AttributionWindowSeconds.OneHour,
        changeExpected: true,
        isPrimary: false,
        minDifference: 0.5,
      }),
      createMetricAssignment({
        metricAssignmentId: 126,
        metricId: 3,
        attributionWindowSeconds: AttributionWindowSeconds.SixHours,
        changeExpected: true,
        isPrimary: false,
        minDifference: 12,
      }),
    ],
    segmentAssignments: [],
    ...fieldOverrides,
  }
}

function createVariation(fieldOverrides: Partial<Variation> = {}): Variation {
  const variationId = fieldOverrides.variationId || 1
  const name = variationId === 1 ? 'control' : variationId === 2 ? 'test' : `treatment_${variationId - 1}`
  return {
    variationId,
    isDefault: variationId === 1 ? true : false,
    name,
    allocatedPercentage: 10,
    ...fieldOverrides,
  }
}

function createVariations(n: number): Variation[] {
  const allocatedPercentage = Math.floor(100 / n)
  return _.range(1, n + 1).map((variationId) =>
    createVariation({
      variationId,
      allocatedPercentage,
    }),
  )
}

function createExperimentFull(fieldOverrides: Partial<ExperimentFull> = {}): ExperimentFull {
  const fieldsOnlyForExistingExperiments = [
    'experimentId',
    'endReason',
    'conclusionUrl',
    'deployedVariationId',
    'status',
    'variations',
    'metricAssignments',
    'segmentAssignments',
    'exposureEvents',
    'assignmentCacheStatus',
  ]
  const newExperimentFieldOverrides = {
    ..._.omit(fieldOverrides, fieldsOnlyForExistingExperiments),
    exposureEvents: undefined,
    status: undefined,
    assignmentCacheStatus: undefined,
  }
  const existingExperimentFieldOverrides = _.pick(fieldOverrides, fieldsOnlyForExistingExperiments)

  return {
    ...createExperimentFullNew(newExperimentFieldOverrides),
    experimentId: 1,
    status: Status.Staging,
    endReason: null,
    conclusionUrl: null,
    deployedVariationId: null,
    variations: [
      createVariation({
        variationId: 2,
        name: 'test',
        isDefault: false,
        allocatedPercentage: 40,
      }),
      createVariation({
        allocatedPercentage: 60,
      }),
    ],
    metricAssignments: [
      createMetricAssignment({
        metricAssignmentId: 123,
        metricId: 1,
        attributionWindowSeconds: AttributionWindowSeconds.OneWeek,
        changeExpected: true,
        isPrimary: true,
        minDifference: 0.1,
      }),
      createMetricAssignment({
        metricAssignmentId: 124,
        metricId: 2,
        attributionWindowSeconds: AttributionWindowSeconds.FourWeeks,
        changeExpected: false,
        isPrimary: false,
        minDifference: 10.5,
      }),
      createMetricAssignment({
        metricAssignmentId: 125,
        metricId: 2,
        attributionWindowSeconds: AttributionWindowSeconds.OneHour,
        changeExpected: true,
        isPrimary: false,
        minDifference: 0.5,
      }),
      createMetricAssignment({
        metricAssignmentId: 126,
        metricId: 3,
        attributionWindowSeconds: AttributionWindowSeconds.SixHours,
        changeExpected: true,
        isPrimary: false,
        minDifference: 12,
      }),
    ],
    segmentAssignments: [
      {
        segmentAssignmentId: 1,
        segmentId: 1,
        isExcluded: true,
      },
    ],
    exposureEvents: [
      {
        event: 'event_name',
        props: {
          additionalProp1: 'prop1Value',
          additionalProp2: 'prop2Value',
          additionalProp3: 'prop3Value',
        },
      },
      {
        event: 'event_without_props',
      },
    ],
    exclusionGroupTagIds: [1],
    assignmentCacheStatus: AssignmentCacheStatus.Fresh,
    ...existingExperimentFieldOverrides,
  }
}

function createMetric(id: number, override?: Partial<Metric>): Metric {
  // Note: It is hard to reuse createMetric here as it is boxed
  //       Currently we only unbox it into an ApiData format which is different from this
  const parameterType = id % 2 === 0 ? MetricParameterType.Revenue : MetricParameterType.Conversion
  const eventParams = [{ event: 'event_name', props: { has_blocks: 'true' } }]
  const revenueParams = {
    refundDays: id * 2,
    productSlugs: ['xx-bundles'],
    transactionTypes: [TransactionTypes.NewPurchase],
  }
  return {
    metricId: id,
    name: `metric_${id}`,
    description: `This is metric ${id}`,
    parameterType,
    higherIsBetter: id % 3 === 0,
    eventParams: parameterType === MetricParameterType.Conversion ? eventParams : undefined,
    revenueParams: parameterType === MetricParameterType.Revenue ? revenueParams : undefined,
    tags: [],
    ...override,
  }
}

function createMetricNew(id: number, override?: Partial<Metric>): MetricNew {
  const metric = createMetric(id, override)
  return { ...metric, tags: metric.tags?.map((tag) => tag.tagId) || [] }
}

function createMetrics(numMetrics = 3): Metric[] {
  return _.range(1, numMetrics + 1).map((id) => createMetric(id))
}

function createTagBare(id: number): TagBare {
  return {
    tagId: id,
    namespace: `tag_namespace_${id}`,
    name: `tag_${id}`,
    description: `This is tag ${id}`,
  }
}

function createTagBares(numTags = 3): TagBare[] {
  return _.range(1, numTags + 1).map(createTagBare)
}

const createTagFull = createTagBare

function createSegment(id: number): Segment {
  return {
    segmentId: id,
    name: `segment_${id}`,
    type: id % 2 === 0 ? SegmentType.Country : SegmentType.Locale,
  }
}

/**
 * Creates an array of segments.
 */
function createSegments(numSegments = 2): Segment[] {
  return _.range(1, numSegments + 1).map(createSegment)
}

function createSegmentAssignment(fieldOverrides: Partial<SegmentAssignment>): SegmentAssignment {
  return {
    segmentAssignmentId: 123,
    segmentId: 1,
    isExcluded: false,
    ...fieldOverrides,
  }
}

const Fixtures = {
  createAnalyses,
  createAnalysis,
  createMultiVariationAnalysis,
  createDistributionStats,
  createExperimentFull,
  createExperimentFullNew,
  createMetricAssignment,
  createMetricEstimates,
  createMetric,
  createMetrics,
  createMetricNew,
  createTagBares,
  createTagFull,
  createSegmentAssignment,
  createSegments,
  createVariation,
  createVariations,
}

export default Fixtures
