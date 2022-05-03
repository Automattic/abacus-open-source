import { Typography } from '@material-ui/core'
import _, { last } from 'lodash'
import MaterialTable from 'material-table'
import React from 'react'

import AnalysisDisplay from 'src/components/experiments/single-view/results/AnalysisDisplay'
import DatetimeText from 'src/components/general/DatetimeText'
import { AnalysisStrategyToHuman, RecommendationWarningToHuman } from 'src/lib/analyses'
import { AttributionWindowSecondsToHuman } from 'src/lib/metric-assignments'
import { getMetricAssignmentRecommendation } from 'src/lib/recommendations'
import { AnalysisPrevious, ExperimentFull, Metric } from 'src/lib/schemas'
import { createStaticTableOptions } from 'src/utils/material-table'

import { MetricAssignmentAnalysesData } from './ExperimentResults'

/**
 * Render the latest analyses for the experiment for each metric assignment.
 */
export default function FullLatestAnalyses({
  experiment,
  allMetricAssignmentAnalysesData,
}: {
  experiment: ExperimentFull
  allMetricAssignmentAnalysesData: MetricAssignmentAnalysesData[]
}): JSX.Element {
  const metricAssignmentSummaries = allMetricAssignmentAnalysesData.map(
    ({ metricAssignment, metric, analysesByStrategyDateAsc }) => {
      return {
        metricAssignment,
        metric,
        analysesByStrategyDateAsc,
        latestAnalyses: Object.values(analysesByStrategyDateAsc).map(last) as AnalysisPrevious[],
      }
    },
  )

  const tableColumns = [
    {
      title: 'Strategy',
      render: ({ analysis: { analysisStrategy } }: { analysis: AnalysisPrevious }) =>
        AnalysisStrategyToHuman[analysisStrategy],
    },
    {
      title: 'Participants',
      render: ({ analysis: { participantStats } }: { analysis: AnalysisPrevious }) => `${participantStats.total}`,
    },
    {
      title: 'Difference interval',
      render: ({ analysis: { metricEstimates } }: { analysis: AnalysisPrevious }) =>
        metricEstimates
          ? `[${_.round(metricEstimates.diff.bottom, 4)}, ${_.round(metricEstimates.diff.top, 4)}]`
          : 'N/A',
    },
    {
      title: 'Analysis',
      render: ({ analysis, metric }: { analysis: AnalysisPrevious; metric: Metric }) => (
        <AnalysisDisplay
          analysis={getMetricAssignmentRecommendation(experiment, metric, analysis)}
          experiment={experiment}
        />
      ),
    },
    {
      title: 'Warnings',
      render: ({ analysis: { recommendation } }: { analysis: AnalysisPrevious }) => {
        if (!recommendation) {
          return ''
        }
        return (
          <>
            {recommendation.warnings.map((warning) => (
              <div key={warning}>{RecommendationWarningToHuman[warning]}</div>
            ))}
          </>
        )
      },
    },
  ]
  return (
    <>
      {metricAssignmentSummaries.map(({ metricAssignment, metric, latestAnalyses }) => (
        <div key={metricAssignment.metricAssignmentId}>
          <Typography variant={'subtitle1'}>
            <strong>
              <code>{metric.name}</code>
            </strong>{' '}
            with {AttributionWindowSecondsToHuman[metricAssignment.attributionWindowSeconds]} attribution,{' '}
            {latestAnalyses.length > 0 ? (
              <>
                last analyzed on <DatetimeText datetime={latestAnalyses[0].analysisDatetime} excludeTime={true} />
              </>
            ) : (
              <strong>not analyzed yet</strong>
            )}
          </Typography>
          <MaterialTable
            columns={tableColumns}
            data={_.sortBy(latestAnalyses, 'analysisStrategy').map((analysis) => ({ analysis, metric }))}
            options={createStaticTableOptions(latestAnalyses.length)}
          />
          <br />
        </div>
      ))}
    </>
  )
}
