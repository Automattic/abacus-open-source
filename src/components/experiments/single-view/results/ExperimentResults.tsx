/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  createStyles,
  FormControl,
  FormHelperText,
  InputLabel,
  makeStyles,
  MenuItem,
  Paper,
  Select,
  Theme,
  Tooltip,
  Typography,
  useTheme,
} from '@material-ui/core'
import { ExpandMore as ExpandMoreIcon } from '@material-ui/icons'
import { Alert } from '@material-ui/lab'
import clsx from 'clsx'
import _ from 'lodash'
import MaterialTable, { MTableBody } from 'material-table'
import { PlotData } from 'plotly.js'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import Plot from 'react-plotly.js'

import Attribute from 'src/components/general/Attribute'
import * as Analyses from 'src/lib/analyses'
import * as Experiments from 'src/lib/experiments'
import * as MetricAssignments from 'src/lib/metric-assignments'
import { AttributionWindowSecondsToHuman } from 'src/lib/metric-assignments'
import { indexMetrics } from 'src/lib/normalizers'
import * as Recommendations from 'src/lib/recommendations'
import {
  Analysis,
  AnalysisStrategy,
  ExperimentFull,
  Metric,
  MetricAssignment,
  MetricParameterType,
} from 'src/lib/schemas'
import * as Visualizations from 'src/lib/visualizations'
import { useDecorationStyles } from 'src/styles/styles'
import { isDebugMode } from 'src/utils/general'
import { createStaticTableOptions } from 'src/utils/material-table'
import { formatIsoDate } from 'src/utils/time'

import MetricValueInterval from '../../../general/MetricValueInterval'
import AnalysisDisplay from './AnalysisDisplay'
import CredibleIntervalVisualization from './CredibleIntervalVisualization'
import DeploymentRecommendation from './DeploymentRecommendation'
import HealthIndicatorTable from './HealthIndicatorTable'
import MetricAssignmentResults from './MetricAssignmentResults'

type MetricAssignmentAnalysesData = {
  metricAssignment: MetricAssignment
  metric: Metric
  analysesByStrategyDateAsc: Record<AnalysisStrategy, Analysis[]>
}

const indicationSeverityClassSymbol = (severity: Analyses.HealthIndicationSeverity) => `indicationSeverity${severity}`

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      // Hide the '>' expander buttons when they are disabled
      '& .MuiIconButton-root.Mui-disabled': {
        opacity: 0,
      },
    },
    summary: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: theme.spacing(2),
    },
    advancedControls: {
      margin: theme.spacing(2, 0),
      padding: theme.spacing(2),
      display: 'inline-flex',
    },
    summaryColumn: {
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '40%',
    },
    summaryStatsPaper: {
      padding: theme.spacing(4),
      marginLeft: theme.spacing(2),
      marginBottom: theme.spacing(2),
    },
    summaryStatsPart: {
      marginBottom: theme.spacing(2),
      '&:last-child': {
        marginBottom: 0,
      },
    },
    summaryStatsPartStrategy: {
      marginTop: theme.spacing(6),
    },
    summaryStatsStat: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    summaryStatsSubtitle: {
      marginRight: theme.spacing(1),
    },
    summaryHealthPaper: {
      padding: theme.spacing(4),
      marginLeft: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      flex: 1,
      textDecoration: 'none',
    },
    [indicationSeverityClassSymbol(Analyses.HealthIndicationSeverity.Ok)]: {},
    [indicationSeverityClassSymbol(Analyses.HealthIndicationSeverity.Warning)]: {
      borderTopWidth: 12,
      borderTopStyle: 'solid',
      borderTopColor: theme.palette.warning.main,
    },
    [indicationSeverityClassSymbol(Analyses.HealthIndicationSeverity.Error)]: {
      borderTopWidth: 8,
      borderTopStyle: 'solid',
      borderTopColor: theme.palette.error.main,
    },
    participantsPlotPaper: {
      padding: theme.spacing(4, 4, 2),
      flex: 1,
    },
    participantsPlot: {
      width: '100%',
      height: 300,
    },
    tableTitle: {
      margin: theme.spacing(4, 2, 2),
    },
    accordions: {
      margin: theme.spacing(2, 0),
    },
    accordionDetails: {
      flexDirection: 'column',
    },
    noAnalysesPaper: {
      padding: theme.spacing(2),
    },
    pre: {
      background: '#f5f5f5',
      padding: theme.spacing(3),
      overflow: 'scroll',
    },
    topLevelDiff: {
      fontFamily: theme.custom.fonts.monospace,
      color: theme.palette.grey[600],
      whiteSpace: 'pre',
    },
    metricAssignmentNameLine: {
      wordBreak: 'break-word',
    },
    abnControls: {
      padding: theme.spacing(2),
      marginBottom: theme.spacing(2),
    },
    abnVariationsSelector: {
      display: 'flex',
    },
    metricAssignmentNameSubtitle: {
      color: theme.palette.grey.A700,
    },
  }),
)

export const METRIC_DETAILS_AUTO_EXPAND_DELAY = 1500

/**
 * Render the latest analyses for the experiment for each metric assignment as a single condensed table, using only
 * the experiment's default analysis strategy.
 */
export default function ExperimentResults({
  analyses,
  experiment,
  metrics,
}: {
  analyses: Analysis[]
  experiment: ExperimentFull
  metrics: Metric[]
  debugMode?: boolean
}): JSX.Element {
  const classes = useStyles()
  const decorationClasses = useDecorationStyles()
  const theme = useTheme()

  const availableAnalysisStrategies = [
    AnalysisStrategy.IttPure,
    AnalysisStrategy.MittNoCrossovers,
    AnalysisStrategy.MittNoSpammers,
    AnalysisStrategy.MittNoSpammersNoCrossovers,
  ]
  if (experiment.exposureEvents) {
    availableAnalysisStrategies.push(AnalysisStrategy.PpNaive)
  }
  const [strategy, setStrategy] = useState<AnalysisStrategy>(() => Experiments.getDefaultAnalysisStrategy(experiment))
  const onStrategyChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setStrategy(event.target.value as AnalysisStrategy)
  }

  // For A/B/n baseline and change to compare
  const [baseVariationId, setBaseVariationId] = useState<number | undefined>(
    () => experiment.variations.find((v) => v.isDefault)?.variationId,
  )
  const [changeVariationId, setChangeVariationId] = useState<number | undefined>(
    () => experiment.variations.find((v) => !v.isDefault)?.variationId,
  )
  const onBaseVariationIdChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const baseVariationId = event.target.value as number
    setBaseVariationId(baseVariationId)
    if (changeVariationId === baseVariationId) {
      const notBaseVariationId = experiment.variations.find((v) => v.variationId !== baseVariationId)?.variationId
      setChangeVariationId(notBaseVariationId)
    }
  }
  const onChangeVariationIdChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setChangeVariationId(event.target.value as number)
  }
  // istanbul ignore next; Shouldn't occur.
  if (!baseVariationId || !changeVariationId) {
    throw new Error('Missing base or change variations.')
  }
  const variationDiffKey = `${changeVariationId}_${baseVariationId}`
  const isMultivariation = experiment.variations.length > 2

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
      ) as Record<AnalysisStrategy, Analysis[]>,
    }
  })

  const metricAssignmentSummaryData = allMetricAssignmentAnalysesData.map(
    ({ metricAssignment, metric, analysesByStrategyDateAsc }) => ({
      experiment,
      strategy,
      metricAssignment,
      metric,
      analysesByStrategyDateAsc,
      recommendation: Recommendations.getAggregateMetricAssignmentRecommendation(
        Object.values(analysesByStrategyDateAsc)
          .map(_.last.bind(null))
          .filter((x) => x)
          .map((analysis) =>
            Recommendations.getMetricAssignmentRecommendation(
              experiment,
              metric,
              analysis as Analysis,
              variationDiffKey,
            ),
          ),
        strategy,
      ),
    }),
  )

  // ### Result Summary Visualizations

  const primaryMetricAssignmentAnalysesData = allMetricAssignmentAnalysesData.find(
    ({ metricAssignment: { isPrimary } }) => isPrimary,
  ) as MetricAssignmentAnalysesData
  const primaryAnalyses = primaryMetricAssignmentAnalysesData.analysesByStrategyDateAsc[strategy] || []
  const dates = primaryAnalyses.map(({ analysisDatetime }) => analysisDatetime.toISOString())

  const plotlyDataParticipantGraph: Array<Partial<PlotData>> = [
    ..._.flatMap(experiment.variations, (variation, index) => {
      const variationKey = `variation_${variation.variationId}`
      return [
        {
          name: `${variation.name}`,
          x: dates,
          y: primaryAnalyses.map(({ participantStats: { [variationKey]: variationCount } }) => variationCount),
          line: {
            color: Visualizations.variantColors[index],
          },
          mode: 'lines+markers' as const,
          type: 'scatter' as const,
        },
      ]
    }),
  ]

  // ### Top Level Stats

  const primaryMetricLatestAnalysesByStrategy = _.mapValues(
    primaryMetricAssignmentAnalysesData.analysesByStrategyDateAsc,
    _.last.bind(null),
  )
  const latestPrimaryMetricAnalysis = primaryMetricLatestAnalysesByStrategy[strategy]
  // istanbul ignore next; trivial
  const totalParticipants = latestPrimaryMetricAnalysis?.participantStats['total'] ?? 0
  const primaryMetricRecommendation = Recommendations.getAggregateMetricAssignmentRecommendation(
    Object.values(primaryMetricLatestAnalysesByStrategy)
      .filter((x) => x)
      .map((analysis) =>
        Recommendations.getMetricAssignmentRecommendation(
          experiment,
          primaryMetricAssignmentAnalysesData.metric,
          analysis as Analysis,
          variationDiffKey,
        ),
      ),
    strategy,
  )
  // We check if there are any analyses at all to show as we want to show what we can to the Experimenter:
  const hasAnalyses = allMetricAssignmentAnalysesData.some(
    (x) => Object.values(x.analysesByStrategyDateAsc).filter((y) => y).length > 0,
  )

  const experimentParticipantStats = Analyses.getExperimentParticipantStats(
    experiment,
    primaryMetricLatestAnalysesByStrategy,
  )
  const experimentHealthIndicators = [
    ...Analyses.getExperimentParticipantHealthIndicators(experimentParticipantStats),
    ...Analyses.getExperimentHealthIndicators(experiment),
  ]

  const maxIndicationSeverity = experimentHealthIndicators
    .map(({ indication: { severity } }) => severity)
    .sort(
      (severityA, severityB) =>
        Analyses.healthIndicationSeverityOrder.indexOf(severityB) -
        Analyses.healthIndicationSeverityOrder.indexOf(severityA),
    )[0]

  const maxIndicationSeverityMessage = {
    [Analyses.HealthIndicationSeverity.Ok]: 'No issues detected',
    [Analyses.HealthIndicationSeverity.Warning]: 'Potential issues',
    [Analyses.HealthIndicationSeverity.Error]: 'Serious issues',
  }

  // ### Metric Assignments Table

  const tableColumns = [
    {
      title: 'Metric (attribution window)',
      render: ({ metric, metricAssignment }: { metric: Metric; metricAssignment: MetricAssignment }) => (
        <>
          <span className={classes.metricAssignmentNameLine}>
            <Tooltip title={metric.description}>
              <span>{metric.name}</span>
            </Tooltip>
            &nbsp;({AttributionWindowSecondsToHuman[metricAssignment.attributionWindowSeconds]})
          </span>
          {metricAssignment.isPrimary && (
            <>
              <br />
              <Attribute name='primary metric' className={classes.metricAssignmentNameSubtitle} />
            </>
          )}
        </>
      ),
      cellStyle: {
        fontFamily: theme.custom.fonts.monospace,
        fontWeight: 600,
        minWidth: 450,
      },
    },
    {
      title: 'Absolute change',
      render: ({
        metric,
        metricAssignment,
        strategy,
        analysesByStrategyDateAsc,
        recommendation,
      }: {
        metric: Metric
        metricAssignment: MetricAssignment
        strategy: AnalysisStrategy
        analysesByStrategyDateAsc: Record<AnalysisStrategy, Analysis[]>
        recommendation: Recommendations.Recommendation
      }) => {
        const latestEstimates = _.last(analysesByStrategyDateAsc[strategy])?.metricEstimates
        if (
          !latestEstimates ||
          recommendation.decision === Recommendations.Decision.ManualAnalysisRequired ||
          recommendation.decision === Recommendations.Decision.MissingAnalysis
        ) {
          return null
        }

        return (
          <>
            <CredibleIntervalVisualization
              top={latestEstimates.diffs[variationDiffKey].top_95}
              bottom={latestEstimates.diffs[variationDiffKey].bottom_95}
              minDifference={metricAssignment.minDifference}
            />
            <MetricValueInterval
              intervalName={'the absolute change between variations'}
              isDifference={true}
              metricParameterType={metric.parameterType}
              bottomValue={latestEstimates.diffs[variationDiffKey].bottom_95}
              topValue={latestEstimates.diffs[variationDiffKey].top_95}
              displayTooltipHint={false}
              alignToCenter
            />
          </>
        )
      },
      cellStyle: {
        fontFamily: theme.custom.fonts.monospace,
        textAlign: 'center',
        minWidth: 180,
      } as React.CSSProperties,
      headerStyle: {
        textAlign: 'center',
      } as React.CSSProperties,
    },
    {
      title: 'Relative change (lift)',
      render: ({
        strategy,
        analysesByStrategyDateAsc,
        recommendation,
      }: {
        strategy: AnalysisStrategy
        analysesByStrategyDateAsc: Record<AnalysisStrategy, Analysis[]>
        recommendation: Recommendations.Recommendation
      }) => {
        const latestEstimates = _.last(analysesByStrategyDateAsc[strategy])?.metricEstimates
        if (
          !latestEstimates?.ratios[variationDiffKey]?.top_95 ||
          recommendation.decision === Recommendations.Decision.ManualAnalysisRequired ||
          recommendation.decision === Recommendations.Decision.MissingAnalysis
        ) {
          return null
        }

        return (
          <MetricValueInterval
            intervalName={'the relative change between variations'}
            metricParameterType={MetricParameterType.Conversion}
            bottomValue={Analyses.ratioToDifferenceRatio(latestEstimates.ratios[variationDiffKey].bottom_95)}
            topValue={Analyses.ratioToDifferenceRatio(latestEstimates.ratios[variationDiffKey].top_95)}
            displayTooltipHint={false}
          />
        )
      },
      cellStyle: {
        fontFamily: theme.custom.fonts.monospace,
        minWidth: 180,
      } as React.CSSProperties,
    },
    {
      title: 'Analysis',
      render: ({
        experiment,
        recommendation,
      }: {
        experiment: ExperimentFull
        recommendation: Recommendations.Recommendation
      }) => {
        return <AnalysisDisplay {...{ experiment, analysis: recommendation }} />
      },
      cellStyle: {
        fontFamily: theme.custom.fonts.monospace,
      },
    },
  ]

  interface DetailPanelProps {
    strategy: AnalysisStrategy
    analysesByStrategyDateAsc: Record<AnalysisStrategy, Analysis[]>
    metricAssignment: MetricAssignment
    metric: Metric
    recommendation: Recommendations.Recommendation
  }
  const DetailPanel = [
    ({ strategy, analysesByStrategyDateAsc, metricAssignment, metric, recommendation }: DetailPanelProps) => {
      let disabled = recommendation.decision === Recommendations.Decision.ManualAnalysisRequired
      // istanbul ignore next; debug only
      disabled = disabled && !isDebugMode()
      return {
        render: () => {
          // Prevent automatically expanding the primary metric detail panel if any panel has been opened
          expandPrimaryMetricPanelTimer.current && clearTimeout(expandPrimaryMetricPanelTimer.current)

          return (
            <MetricAssignmentResults
              {...{
                strategy,
                analysesByStrategyDateAsc,
                metricAssignment,
                metric,
                experiment,
                recommendation,
                variationDiffKey,
              }}
            />
          )
        },
        disabled,
      }
    },
  ]

  // HACK: The following solution, while being imperative, it is required for automatically expanding a detail panel
  // Other possible solutions were discussed at https://github.com/mbrn/material-table/issues/1021
  const tableRef = useRef<typeof MTableBody>(null)
  const expandPrimaryMetricPanelTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    const table = tableRef.current as unknown as {
      onToggleDetailPanel: (path: number[], detailPanel: () => ReactElement) => void
      props: {
        data: DetailPanelProps[]
      }
      dataManager: {
        lastDetailPanelRow: {
          tableData: {
            id: number
            showDetailPanel?: () => void
          }
        }
      }
    }
    if (!table?.dataManager.lastDetailPanelRow) {
      // initial render: expand the first row after a delay
      expandPrimaryMetricPanelTimer.current = setTimeout(() => {
        table?.onToggleDetailPanel([0], DetailPanel[0](table?.props.data[0]).render)
      }, METRIC_DETAILS_AUTO_EXPAND_DELAY)
    } else if (table?.dataManager.lastDetailPanelRow.tableData.showDetailPanel) {
      // after variation/strategy selection: expand the last active row immediately
      const rowIndex = table.dataManager.lastDetailPanelRow.tableData.id
      table?.onToggleDetailPanel([rowIndex], DetailPanel[0](table?.props.data[rowIndex]).render)
    }
    // clear on component unmount
    return () => {
      expandPrimaryMetricPanelTimer.current && clearTimeout(expandPrimaryMetricPanelTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableRef.current, variationDiffKey, strategy])

  return (
    <div className='analysis-latest-results'>
      <div className={classes.root}>
        {hasAnalyses ? (
          <>
            {isMultivariation && (
              <>
                <Alert severity='warning'>
                  <strong>A/B/n analysis is an BETA quality feature.</strong>
                </Alert>
                <br />
                <Paper className={classes.abnControls}>
                  <Typography variant='h5' gutterBottom>
                    {' '}
                    A/B/n Analysis Controls{' '}
                  </Typography>
                  <br />
                  <div className={classes.abnVariationsSelector}>
                    <FormControl>
                      <InputLabel id='variation-base-selector-label'> Base Variation: </InputLabel>
                      <Select
                        id='variation-base-selector'
                        labelId='variation-base-selector-label'
                        value={baseVariationId}
                        onChange={onBaseVariationIdChange}
                      >
                        {experiment.variations.map((variation) => (
                          <MenuItem key={variation.variationId} value={variation.variationId}>
                            {variation.name}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>Base variation to compare against.</FormHelperText>
                    </FormControl>
                    &nbsp; &nbsp; &nbsp;
                    <FormControl>
                      <InputLabel id='variation-change-selector-label'> Change Variation: </InputLabel>
                      <Select
                        id='variation-change-selector'
                        labelId='variation-change-selector-label'
                        value={changeVariationId}
                        onChange={onChangeVariationIdChange}
                      >
                        {experiment.variations
                          .filter((v) => v.variationId !== baseVariationId)
                          .map((variation) => (
                            <MenuItem key={variation.variationId} value={variation.variationId}>
                              {variation.name}
                            </MenuItem>
                          ))}
                      </Select>
                      <FormHelperText>Change variation to measure against base.</FormHelperText>
                    </FormControl>
                  </div>
                </Paper>
                <br />
              </>
            )}
            <div className={classes.summary}>
              <Paper className={classes.participantsPlotPaper}>
                <Typography variant='h3' gutterBottom>
                  Participants by Variation
                </Typography>
                <Plot
                  layout={{
                    ...Visualizations.plotlyLayoutDefault,
                    margin: {
                      l: theme.spacing(4),
                      r: theme.spacing(2),
                      t: 0,
                      b: theme.spacing(6),
                    },
                  }}
                  data={plotlyDataParticipantGraph}
                  className={classes.participantsPlot}
                />
              </Paper>
              <div className={classes.summaryColumn}>
                <Paper className={classes.summaryStatsPaper}>
                  {latestPrimaryMetricAnalysis && (
                    <>
                      <div className={classes.summaryStatsPart}>
                        <Typography variant='h3' className={classes.summaryStatsStat} color='primary'>
                          {totalParticipants.toLocaleString('en', { useGrouping: true })}
                        </Typography>
                        <Typography variant='subtitle1'>
                          <strong>analyzed participants</strong> as at{' '}
                          {formatIsoDate(latestPrimaryMetricAnalysis.analysisDatetime)}
                        </Typography>
                      </div>
                      <div className={classes.summaryStatsPart}>
                        <Typography variant='h3' className={classes.summaryStatsStat} color='primary'>
                          <DeploymentRecommendation {...{ experiment, analysis: primaryMetricRecommendation }} />
                        </Typography>
                        <Typography variant='subtitle1'>
                          <Tooltip title='The recommendation is metric specific and does not consider other metrics. Check the table below to analyze each metric.'>
                            <span className={decorationClasses.tooltipped}>
                              <strong>primary metric</strong> recommendation
                            </span>
                          </Tooltip>
                        </Typography>
                      </div>
                    </>
                  )}
                </Paper>
                <Paper
                  className={clsx(
                    classes.summaryHealthPaper,
                    classes[indicationSeverityClassSymbol(maxIndicationSeverity)],
                  )}
                  component='a'
                  // @ts-ignore: Component extensions aren't appearing in types.
                  href='#health-report'
                >
                  <div className={classes.summaryStats}>
                    <Typography variant='h3' className={clsx(classes.summaryStatsStat)} color='primary'>
                      {maxIndicationSeverityMessage[maxIndicationSeverity]}
                    </Typography>
                    <Typography variant='subtitle1'>
                      see <strong>health report</strong>
                    </Typography>
                  </div>
                </Paper>
              </div>
            </div>
            <Typography variant='h3' className={classes.tableTitle}>
              Metric Assignment Results
            </Typography>
            <MaterialTable
              tableRef={tableRef}
              columns={tableColumns}
              data={metricAssignmentSummaryData}
              options={createStaticTableOptions(metricAssignmentSummaryData.length)}
              onRowClick={(_event, rowData, togglePanel) => {
                const { recommendation } = rowData as {
                  recommendation: Recommendations.Recommendation
                }
                let disabled = recommendation.decision === Recommendations.Decision.ManualAnalysisRequired
                // istanbul ignore next; debug only
                disabled = disabled && !isDebugMode()

                // istanbul ignore else; trivial
                if (togglePanel && !disabled) {
                  togglePanel()
                }
              }}
              detailPanel={DetailPanel}
            />
            <Typography variant='h3' className={classes.tableTitle}>
              Health Report
            </Typography>
            <Paper id='health-report'>
              <HealthIndicatorTable indicators={experimentHealthIndicators} />
            </Paper>
          </>
        ) : (
          <Paper className={classes.noAnalysesPaper}>
            <Typography variant='h3' gutterBottom>
              {' '}
              No Results{' '}
            </Typography>
            <Typography variant='body1'>No results are available at the moment, this can be due to:</Typography>
            <ul>
              <Typography component='li'>
                <strong> An experiment being new. </strong> ExPlat can take 24-48 hours for results to process and
                become available. Updates are usually released at 06:00 UTC daily.
              </Typography>
              <Typography component='li'>
                <strong> No assignments occuring. </strong> Check the &quot;Early Monitoring&quot; section below to
                ensure that assignments are occuring.
              </Typography>
            </ul>
          </Paper>
        )}

        <div className={classes.accordions}>
          {hasAnalyses && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant='h5'>Advanced - Choose an Analysis Strategy</Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.accordionDetails}>
                <Typography variant='body1'>
                  Choosing a different analysis strategy is useful for checking the effect of different modelling
                  decisions on the results:
                </Typography>

                <ul>
                  <Typography variant='body1' component='li'>
                    <strong>All participants:</strong> All the participants are analysed based on their initial
                    variation assignment. Pure intention-to-treat.
                  </Typography>
                  <Typography variant='body1' component='li'>
                    <strong>Without crossovers:</strong> Same as all participants, but excluding participants that were
                    assigned to multiple experiment variations before or on the analysis date (aka crossovers). Modified
                    intention-to-treat.
                  </Typography>
                  <Typography variant='body1' component='li'>
                    <strong>Without spammers:</strong> Same as all participants, but excluding participants that were
                    flagged as spammers on the analysis date. Modified intention-to-treat.
                  </Typography>
                  <Typography variant='body1' component='li'>
                    <strong>Without crossovers and spammers:</strong> Same as all participants, but excluding both
                    spammers and crossovers. Modified intention-to-treat.
                  </Typography>
                  <Typography variant='body1' component='li'>
                    <strong>Exposed without crossovers and spammers:</strong> Only participants that triggered one of
                    the experiment&apos;s exposure events, excluding both spammers and crossovers. This analysis
                    strategy is only available if the experiment has exposure events, while the other four strategies
                    are used for every experiment. Naive per-protocol.
                  </Typography>
                </ul>

                <FormControl>
                  <InputLabel htmlFor='strategy-selector' id='strategy-selector-label'>
                    Analysis Strategy:
                  </InputLabel>
                  <Select
                    id='strategy-selector'
                    labelId='strategy-selector-label'
                    value={strategy}
                    onChange={onStrategyChange}
                  >
                    {availableAnalysisStrategies.map((strat) => (
                      <MenuItem key={strat} value={strat}>
                        {Analyses.AnalysisStrategyToHuman[strat]}
                        {strat === Experiments.getDefaultAnalysisStrategy(experiment) && ' (recommended)'}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Updates the page data.</FormHelperText>
                </FormControl>
              </AccordionDetails>
            </Accordion>
          )}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant='h5'>Early Monitoring - Live Assignment Event Flow</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.accordionDetails}>
              <Typography variant='body1'>
                For early monitoring, you can run this query in Hue to retrieve unfiltered assignment counts from the
                unprocessed tracks queue.
              </Typography>

              <Typography variant='body1'>
                This query should only be used to monitor event flow. The best way to use it is to run it multiple times
                and ensure that counts go up and are roughly distributed as expected. Counts may also go down as events
                are moved to prod_events every day.
              </Typography>
              <pre className={classes.pre}>
                <code>
                  {/* (Using a javasript string automatically replaces special characters with html entities.) */}
                  {`with tracks_counts as (
  select
    cast(json_extract(eventprops, '$.experiment_variation_id') as bigint) as experiment_variation_id,
    count(distinct userid) as unique_users
  from kafka_staging.etl_events
  where
    eventname = 'wpcom_experiment_variation_assigned' and
    eventprops like '%"experiment_id":"${experiment.experimentId}"%'
  group by cast(json_extract(eventprops, '$.experiment_variation_id') as bigint)
)

select
  experiment_variations.name as variation_name,
  unique_users
from tracks_counts
inner join wpcom.experiment_variations using (experiment_variation_id)`}
                </code>
              </pre>
            </AccordionDetails>
          </Accordion>
        </div>
      </div>
    </div>
  )
}
