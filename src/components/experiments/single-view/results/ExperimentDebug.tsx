import _ from 'lodash'
import React from 'react'

import * as Experiments from 'src/lib/experiments'
import * as MetricAssignments from 'src/lib/metric-assignments'
import { indexMetrics } from 'src/lib/normalizers'
import { AnalysisPrevious, AnalysisStrategy, ExperimentFull, Metric } from 'src/lib/schemas'

import { MetricAssignmentAnalysesData } from './ExperimentResults'
import FullLatestAnalyses from './FullLatestAnalyses'
import ParticipantCounts from './ParticipantCounts'

/**
 * Main component for summarizing experiment results.
 */
export default function ExperimentDebug({
  analyses,
  experiment,
  metrics,
}: {
  analyses: AnalysisPrevious[]
  experiment: ExperimentFull
  metrics: Metric[]
  debugMode?: boolean
}): JSX.Element {
  const indexedMetrics = indexMetrics(metrics)
  const analysesByMetricAssignmentId = _.groupBy(analyses, 'metricAssignmentId')
  const allMetricAssignmentAnalysesData: MetricAssignmentAnalysesData[] = MetricAssignments.sort(
    experiment.metricAssignments,
  ).map((metricAssignment) => {
    const metricAssignmentAnalyses = analysesByMetricAssignmentId[metricAssignment.metricAssignmentId] || []
    return {
      metricAssignment,
      metric: indexedMetrics[metricAssignment.metricId],
      analysesByStrategyDateAsc: _.groupBy(
        _.orderBy(metricAssignmentAnalyses, ['analysisDatetime'], ['asc']),
        'analysisStrategy',
      ) as Record<AnalysisStrategy, AnalysisPrevious[]>,
    }
  })

  if (analyses.length === 0) {
    return <p>No analyses yet for {experiment.name}.</p>
  }

  const primaryMetricAssignmentId = Experiments.getPrimaryMetricAssignmentId(experiment)
  const primaryMetricAssignmentAnalysesData = allMetricAssignmentAnalysesData.find(
    ({ metricAssignment: { metricAssignmentId } }) => metricAssignmentId === primaryMetricAssignmentId,
  )

  // istanbul ignore next; Should never occur
  if (!primaryMetricAssignmentAnalysesData) {
    throw new Error('Missing primary metricAssignment!')
  }

  return (
    <>
      <div className='analysis-participant-counts'>
        <h3>Participant counts for the primary metric</h3>
        <ParticipantCounts
          experiment={experiment}
          primaryMetricAssignmentAnalysesData={primaryMetricAssignmentAnalysesData}
        />
      </div>

      <div className='analysis-latest-results'>
        <h3>Latest results by metric</h3>
        <FullLatestAnalyses experiment={experiment} allMetricAssignmentAnalysesData={allMetricAssignmentAnalysesData} />
      </div>
    </>
  )
}
