import {
  createStyles,
  makeStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Theme,
  Typography,
} from '@material-ui/core'
import { ChevronRight, ExpandMore } from '@material-ui/icons'
import clsx from 'clsx'
import _, { capitalize, identity } from 'lodash'
import { PlotData } from 'plotly.js'
import React, { useState } from 'react'
import Plot from 'react-plotly.js'

import DatetimeText from 'src/components/general/DatetimeText'
import MetricValue from 'src/components/general/MetricValue'
import MetricValueInterval from 'src/components/general/MetricValueInterval'
import PrivateLink from 'src/components/general/PrivateLink'
import * as Analyses from 'src/lib/explat/analyses'
import { getChosenVariation, getExperimentRunHours, isOneTimeExperiment } from 'src/lib/explat/experiments'
import { getUnitInfo, UnitDerivationType, UnitInfo, UnitType } from 'src/lib/explat/metrics'
import * as Recommendations from 'src/lib/explat/recommendations'
import {
  Analysis,
  AnalysisStrategy,
  DistributionStats,
  ExperimentFull,
  Metric,
  MetricAssignment,
  Variation,
} from 'src/lib/explat/schemas'
import * as Visualizations from 'src/lib/explat/visualizations'
import { abbreviateNumber } from 'src/utils/formatters'
import { cartesianProduct } from 'src/utils/general'

import AnalysisDisplay from './AnalysisDisplay'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2, 8),
      background: theme.palette.action.hover,
    },
    headerCell: {
      fontWeight: 'bold',
      width: '14rem',
      verticalAlign: 'top',
    },
    monospace: {
      fontFamily: theme.custom.fonts.monospace,
    },
    metricEstimatePlots: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: theme.spacing(2),
    },
    metricEstimatePlot: {
      width: `calc(50% - ${theme.spacing(1)}px)`,
      height: 400,
    },
    noPlotMessage: {
      margin: theme.spacing(0, 0, 0, 2),
      color: theme.palette.grey[600],
    },
    rowHeader: {
      verticalAlign: 'top',
    },
    rowVariationNotSelected: {
      '& > th, & > td': {
        color: theme.palette.grey[500],
      },
    },
    analysisFinePrint: {
      fontSize: '.7rem',
      fontStyle: 'italic',
      opacity: 0.7,
      margin: theme.spacing(1, 0, 2, 2),
    },
    credibleIntervalHeader: {
      width: '8rem',
    },
    recommendation: {
      fontFamily: theme.custom.fonts.monospace,
      marginBottom: theme.spacing(2),
    },
    dataTableHeader: {
      margin: theme.spacing(2, 2, 1, 2),
      display: 'block',
      fontSize: '0.8rem',
      color: theme.palette.grey[600],
      '&:first-of-type': {
        marginTop: 0,
      },
    },
    coolTable: {
      '& tbody td, & tbody th': {
        borderBottom: 0,
      },
      '& th:first-of-type': {
        borderRightWidth: 1,
        borderRightStyle: 'solid',
        borderRightColor: theme.palette.grey[300],
      },
    },
    clickable: {
      cursor: 'pointer',
      userSelect: 'none',
    },
    expandCollapseIcon: {
      verticalAlign: 'middle',
      height: '1.3rem',
      width: '1.3rem',
      marginTop: '-2px',
      marginLeft: '-1.3rem',
    },
    warningAsterisk: {
      color: theme.palette.error.main,
    },
    unitName: {
      '&::first-letter': {
        textTransform: 'capitalize',
      },
    },
  }),
)

type StringifiedStatisticalDifference = 'true' | 'false'

// Practical Difference Status -> (string) Statistical Difference -> string
// {{ }} delimited variables are going to be replaced using Lodash: https://lodash.com/docs/4.17.15#template
const differenceOverviewMessages: Record<
  Recommendations.PracticalSignificanceStatus,
  Record<StringifiedStatisticalDifference, string>
> = {
  [Recommendations.PracticalSignificanceStatus.Yes]: {
    true: 'Deploy {{ variation }} with confidence. {{ Variation }} is winning and there is high certainty that the change is statistically and practically significant.',
    false: 'There is high certainty that the change is practically significant.',
  },
  [Recommendations.PracticalSignificanceStatus.Uncertain]: {
    true: 'Deploy {{ variation }}  cautiously. {{ Variation }} is ahead and is statistically different, but there is not enough certainty to say the change is practically significant.',
    false: 'There is not enough certainty to draw a conclusion at this time.',
  },
  [Recommendations.PracticalSignificanceStatus.No]: {
    true: "Deploy {{ variation }}  cautiously. {{ Variation }} is barely ahead and is statistically different, but there is high certainty that the change isn't practically significant.",
    false:
      'Deploy either variation. There is high certainty that difference in performance is not practically significant',
  },
}

function getOverviewMessage(experiment: ExperimentFull, recommendation: Recommendations.Recommendation) {
  const message =
    differenceOverviewMessages[recommendation.practicallySignificant as Recommendations.PracticalSignificanceStatus][
      String(recommendation.statisticallySignificant) as StringifiedStatisticalDifference
    ]
  const variationName = recommendation.chosenVariationId
    ? getChosenVariation(experiment, recommendation).name
    : 'variant'

  const mapReplaceObject: Record<string, string> = {
    variation: variationName,
    Variation: capitalize(variationName),
  }

  _.templateSettings.interpolate = /{{([\s\S]+?)}}/g
  return _.template(message)(mapReplaceObject)
}

const explanationLine2: Record<Recommendations.PracticalSignificanceStatus, string> = {
  [Recommendations.PracticalSignificanceStatus
    .Yes]: `With high certainty, there is a practical difference between the variations because the absolute change is outside the minimum difference of `,
  [Recommendations.PracticalSignificanceStatus
    .Uncertain]: `Uncertainty is too high because the absolute change overlaps with the specified minimum practical difference between `,
  [Recommendations.PracticalSignificanceStatus
    .No]: `With high certainty, there is no practical difference between the variations because the absolute change is inside the specified minimum difference between `,
}

function MissingAnalysisMessage() {
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <Typography variant='h5' gutterBottom>
        {' '}
        No Analysis Data Found:{' '}
      </Typography>
      <ul>
        <Typography variant='body1' component='li'>
          {' '}
          It can take 24-48 hours for analysis data to be generated.{' '}
        </Typography>
        <Typography variant='body1' component='li'>
          {' '}
          Analysis data can also be missing if the event or billing-product isn&apos;t being hit.
        </Typography>
      </ul>
    </div>
  )
}

function WarningAsterisk() {
  const classes = useStyles()
  return <span className={classes.warningAsterisk}>*</span>
}

interface CredibleIntervalLine {
  name: string
  distributionStats?: DistributionStats
  intervalName: string
  unit: UnitInfo
}

/**
 * Display results for a MetricAssignment
 */
export default function MetricAssignmentResults({
  strategy,
  metricAssignment,
  metric,
  analysesByStrategyDateAsc,
  experiment,
  recommendation,
  variationDiffKey,
  impactIntervalInMonths,
}: {
  strategy: AnalysisStrategy
  metricAssignment: MetricAssignment
  metric: Metric
  analysesByStrategyDateAsc: Record<AnalysisStrategy, Analysis[]>
  experiment: ExperimentFull
  recommendation: Recommendations.Recommendation
  variationDiffKey: string
  impactIntervalInMonths: number
}): JSX.Element | null {
  const classes = useStyles()

  const [isShowObservedData, setIsShowObservedData] = useState<boolean>(false)
  const toggleIsShowObservedData = () => {
    setIsShowObservedData((isShowObservedData) => !isShowObservedData)
  }

  const [isShowAllCredibleIntervals, setIsShowAllCredibleIntervals] = useState<boolean>(false)
  const toggleIsShowAllCredibleIntervals = () => {
    setIsShowAllCredibleIntervals((isShowAllCredibleIntervals) => !isShowAllCredibleIntervals)
  }

  let estimateTransform: (estimate: number | null) => number | null = identity
  let unitName = ''
  let countName = ''
  let metricValuePlotTitle = ''
  let metricValueAbsoluteDifferencePlotTitle = ''
  // Some of the information here should eventually be moved to UnitInfo
  switch (getUnitInfo(metric).unitType) {
    case UnitType.Ratio:
      estimateTransform = (estimate: number | null) => estimate && estimate * 100
      unitName = 'conversion rate'
      countName = 'Conversions'
      metricValuePlotTitle = `Conversion rate estimates by variation (%)`
      metricValueAbsoluteDifferencePlotTitle = `Conversion rate difference estimates (percentage points)`
      break
    case UnitType.Usd:
      unitName = 'average cash per user (ACPU)'
      countName = 'Cash Sales'
      metricValuePlotTitle = `Cash sales estimates by variation (USD)`
      metricValueAbsoluteDifferencePlotTitle = `Cash sales difference estimates (USD)`
      break
    // istanbul ignore next; shouldn't occur
    default:
      throw new Error('Unknown unitType')
  }

  const analyses = analysesByStrategyDateAsc[strategy]
  const latestAnalysis = _.last(analyses)
  const latestEstimates = latestAnalysis?.metricEstimates
  if (!latestAnalysis || !latestEstimates) {
    return <MissingAnalysisMessage />
  }

  const [changeVariationId, baseVariationId] = variationDiffKey.split('_').map((x) => parseInt(x, 10))
  const variations = [
    experiment.variations.find((v) => v.variationId === baseVariationId),
    experiment.variations.find((v) => v.variationId === changeVariationId),
  ] as unknown as [Variation, Variation]
  // istanbul ignore next; Shouldn't occur
  if (!variations[0] || !variations[1]) {
    throw new Error('Missing variations matching base/change')
  }
  const isMultivariation = experiment.variations.length > 2

  const dates = analyses.map(({ analysisDatetime }) => analysisDatetime.toISOString())

  const plotlyDataVariationGraph: Array<Partial<PlotData>> = [
    ..._.flatMap(variations, (variation, index) => {
      return [
        {
          name: `${variation.name}: lower bound`,
          x: dates,
          y: analyses
            .map(
              ({ metricEstimates }) => metricEstimates && metricEstimates.variations[variation.variationId].bottom_95,
            )
            .map(estimateTransform),
          line: {
            color: Visualizations.variantColors[index],
          },
          mode: 'lines' as const,
          type: 'scatter' as const,
        },
        {
          name: `${variation.name}: upper bound`,
          x: dates,
          y: analyses
            .map(({ metricEstimates }) => metricEstimates && metricEstimates.variations[variation.variationId].top_95)
            .map(estimateTransform),
          line: {
            color: Visualizations.variantColors[index],
          },
          fill: 'tonexty' as const,
          fillcolor: Visualizations.variantColors[index],
          mode: 'lines' as const,
          type: 'scatter' as const,
        },
      ]
    }),
  ]

  const plotlyDataDifferenceGraph: Array<Partial<PlotData>> = [
    {
      name: `difference: 99% lower bound`,
      x: dates,
      y: analyses
        .map(({ metricEstimates }) => metricEstimates && metricEstimates.diffs[variationDiffKey].bottom_99)
        .map(estimateTransform),
      line: { width: 0 },
      marker: { color: '444' },
      mode: 'lines' as const,
      type: 'scatter' as const,
    },
    {
      name: `difference: 99% upper bound`,
      x: dates,
      y: analyses
        .map(({ metricEstimates }) => metricEstimates && metricEstimates.diffs[variationDiffKey].top_99)
        .map(estimateTransform),
      fill: 'tonexty',
      fillcolor: 'rgba(0,0,0,.2)',
      line: { width: 0 },
      marker: { color: '444' },
      mode: 'lines' as const,
      type: 'scatter' as const,
    },
    {
      name: `difference: 95% lower bound`,
      x: dates,
      y: analyses
        .map(({ metricEstimates }) => metricEstimates && metricEstimates.diffs[variationDiffKey].bottom_95)
        .map(estimateTransform),
      line: { width: 0 },
      marker: { color: '444' },
      mode: 'lines' as const,
      type: 'scatter' as const,
    },
    {
      name: `difference: 95% upper bound`,
      x: dates,
      y: analyses
        .map(({ metricEstimates }) => metricEstimates && metricEstimates.diffs[variationDiffKey].top_95)
        .map(estimateTransform),
      fill: 'tonexty',
      fillcolor: 'rgba(0,0,0,.2)',
      line: { width: 0 },
      marker: { color: '444' },
      mode: 'lines' as const,
      type: 'scatter' as const,
    },
    {
      name: `difference: 50% lower bound`,
      x: dates,
      y: analyses
        .map(({ metricEstimates }) => metricEstimates && metricEstimates.diffs[variationDiffKey].bottom_50)
        .map(estimateTransform),
      line: { width: 0 },
      marker: { color: '444' },
      mode: 'lines' as const,
      type: 'scatter' as const,
    },
    {
      name: `difference: 50% upper bound`,
      x: dates,
      y: analyses
        .map(({ metricEstimates }) => metricEstimates && metricEstimates.diffs[variationDiffKey].top_50)
        .map(estimateTransform),
      fill: 'tonexty',
      fillcolor: 'rgba(0,0,0,.2)',
      line: { width: 0 },
      marker: { color: '444' },
      mode: 'lines' as const,
      type: 'scatter' as const,
    },
    {
      name: 'ROPE: lower bound',
      x: dates,
      y: analyses.map((_) => -metricAssignment.minDifference).map(estimateTransform),
      line: {
        color: 'rgba(0,0,0,.4)',
        dash: 'dash',
      },
      mode: 'lines' as const,
      type: 'scatter' as const,
    },
    {
      name: 'ROPE: upper bound',
      x: dates,
      y: analyses.map((_) => metricAssignment.minDifference).map(estimateTransform),
      line: {
        color: 'rgba(0,0,0,.4)',
        dash: 'dash',
      },
      mode: 'lines' as const,
      type: 'scatter' as const,
    },
  ]

  const isVariationSelected = (variation: Variation) =>
    [baseVariationId, changeVariationId].includes(variation.variationId)

  const variationsTuples = isMultivariation
    ? cartesianProduct(experiment.variations, experiment.variations)
    : // Need to reverse the A/B variations for the grid (e.g. Treatment - Control):
      [[variations[1], variations[0]]]

  const allCredibleIntervalLines: CredibleIntervalLine[] = [
    // Variations:
    ...experiment.variations.map((variation) => ({
      name: variation.name,
      distributionStats: _.get(latestEstimates, ['variations', variation.variationId]) as DistributionStats | undefined,
      intervalName: 'the metric value',
      unit: getUnitInfo(metric),
    })),

    // Absolute diffs
    ...variationsTuples.map(([variationA, variationB]) => ({
      name: `${variationA.name} - ${variationB.name}`,
      distributionStats: _.get(latestEstimates, ['diffs', `${variationA.variationId}_${variationB.variationId}`]) as
        | DistributionStats
        | undefined,
      intervalName: 'the absolute change between variations',
      unit: getUnitInfo(metric, [UnitDerivationType.AbsoluteDifference]),
    })),

    // Relative diffs
    ...variationsTuples.map(([variationA, variationB]) => {
      const ratios = _.get(latestEstimates, ['ratios', `${variationA.variationId}_${variationB.variationId}`])

      const relDiffs = ratios ? _.mapValues(ratios, Analyses.ratioToDifferenceRatio.bind(null)) : undefined

      return {
        name: `(${variationA.name} - ${variationB.name}) / ${variationB.name}`,
        distributionStats: relDiffs as DistributionStats | undefined,
        intervalName: 'the relative change between variations',
        unit: getUnitInfo(metric, [UnitDerivationType.RelativeDifference]),
      }
    }),
  ]

  const estimatedTotalParticipantsForImpact = Analyses.estimateTotalParticipantsInPeriod(
    latestAnalysis,
    experiment,
    impactIntervalInMonths * 30,
  )

  const changeVariationName = experiment.variations.find((variation) => variation.variationId === changeVariationId)
    ?.name as string

  return (
    <div className={clsx(classes.root, 'analysis-detail-panel')}>
      <Typography className={classes.dataTableHeader}>Summary</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <Typography variant='h5' gutterBottom className={classes.recommendation}>
                  <AnalysisDisplay {...{ experiment, analysis: recommendation }} />
                </Typography>
                {recommendation.decision === Recommendations.Decision.ManualAnalysisRequired && (
                  <Typography variant='body1' gutterBottom>
                    <strong> Different strategies are recommending conflicting variations! </strong>
                  </Typography>
                )}
                <Typography variant='body1'>
                  {getOverviewMessage(experiment, recommendation)}{' '}
                  <PrivateLink underline='always' href={`https://wp.me/PCYsg-Fqg`} target='_blank'>
                    Learn more
                  </PrivateLink>
                  .
                </Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Typography variant='body1' gutterBottom>
                  The absolute change in the {unitName} of{' '}
                  <MetricValueInterval
                    intervalName={'the absolute change'}
                    unit={getUnitInfo(metric, [UnitDerivationType.AbsoluteDifference])}
                    bottomValue={latestEstimates.diffs[variationDiffKey].bottom_95}
                    topValue={latestEstimates.diffs[variationDiffKey].top_95}
                    displayTooltipHint={false}
                  />{' '}
                  is {recommendation.statisticallySignificant ? '' : ' not '}
                  statistically different from zero because the interval
                  {recommendation.statisticallySignificant ? ' excludes ' : ' includes '}
                  zero.{' '}
                  {
                    explanationLine2[
                      recommendation.practicallySignificant as Recommendations.PracticalSignificanceStatus
                    ]
                  }
                  <MetricValueInterval
                    intervalName={'the minimum practical difference interval'}
                    unit={getUnitInfo(metric, [UnitDerivationType.AbsoluteDifference])}
                    bottomValue={-metricAssignment.minDifference}
                    topValue={metricAssignment.minDifference}
                    displayTooltipHint={false}
                  />
                  .
                </Typography>
                {!isOneTimeExperiment(experiment) && (
                  <Typography variant='body1' gutterBottom>
                    Given the relative change (lift) between{' '}
                    <MetricValueInterval
                      intervalName={'the relative change'}
                      unit={getUnitInfo(metric, [UnitDerivationType.RelativeDifference])}
                      bottomValue={Analyses.ratioToDifferenceRatio(latestEstimates.ratios[variationDiffKey].bottom_95)}
                      topValue={Analyses.ratioToDifferenceRatio(latestEstimates.ratios[variationDiffKey].top_95)}
                      displayTooltipHint={false}
                    />{' '}
                    after analyzing{' '}
                    <MetricValue
                      unit={{ unitType: UnitType.Count }}
                      value={latestAnalysis.participantStats['total']}
                      displayUnit={false}
                    />{' '}
                    participants ({Analyses.getTotalAllocatedPercentage(experiment)}% allocation) over an experiment
                    runtime of {_.round(getExperimentRunHours(experiment) / 24, 2)} days, the estimated{' '}
                    {impactIntervalInMonths === 1 ? 'monthly' : 'yearly'} impact of {changeVariationName} is between{' '}
                    <MetricValueInterval
                      intervalName={'the estimated impact'}
                      unit={getUnitInfo(metric, [UnitDerivationType.ImpactScaled])}
                      bottomValue={
                        latestEstimates.diffs[variationDiffKey].bottom_95 * estimatedTotalParticipantsForImpact
                      }
                      topValue={latestEstimates.diffs[variationDiffKey].top_95 * estimatedTotalParticipantsForImpact}
                      formatter={abbreviateNumber}
                      displayTooltipHint={false}
                    />
                    . <strong>This is not a statistical forecast</strong> but a theoretical cumulative effect on the
                    targeted audience, as if the experiment conditions were unchanged for one{' '}
                    {impactIntervalInMonths === 1 ? 'month' : 'year'}.
                  </Typography>
                )}
                <strong>Last analyzed:</strong>{' '}
                <DatetimeText datetime={latestAnalysis.analysisDatetime} excludeTime={true} />.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <strong>Metric description:</strong> {metric.description}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Typography className={classes.dataTableHeader}>Analysis</Typography>
      <TableContainer component={Paper}>
        <Table className={classes.coolTable}>
          <TableHead>
            <TableRow>
              <TableCell>Variant</TableCell>
              <TableCell align='right' className={classes.unitName}>
                {unitName}
              </TableCell>
              <TableCell align='right'>Absolute change</TableCell>
              <TableCell align='right'>Relative change (lift)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {experiment.variations.map((variation) => (
              <React.Fragment key={variation.variationId}>
                <TableRow className={!isVariationSelected(variation) ? classes.rowVariationNotSelected : undefined}>
                  <TableCell
                    component='th'
                    scope='row'
                    variant='head'
                    valign='top'
                    className={clsx(classes.rowHeader, classes.headerCell, classes.credibleIntervalHeader)}
                  >
                    <span className={classes.monospace}>
                      {variation.name}
                      {isMultivariation && <> {variation.variationId === baseVariationId ? '(Base)' : '(Change)'}</>}
                    </span>
                  </TableCell>
                  <TableCell className={classes.monospace} align='right'>
                    <MetricValueInterval
                      intervalName={'the metric value'}
                      unit={getUnitInfo(metric)}
                      bottomValue={latestEstimates.variations[variation.variationId].bottom_95}
                      topValue={latestEstimates.variations[variation.variationId].top_95}
                      displayPositiveSign={false}
                    />
                  </TableCell>
                  <TableCell className={classes.monospace} align='right'>
                    {variation.variationId === baseVariationId ? (
                      'Baseline'
                    ) : (
                      <MetricValueInterval
                        intervalName={'the absolute change between variations'}
                        unit={getUnitInfo(metric, [UnitDerivationType.AbsoluteDifference])}
                        bottomValue={latestEstimates.diffs[`${variation.variationId}_${baseVariationId}`].bottom_95}
                        topValue={latestEstimates.diffs[`${variation.variationId}_${baseVariationId}`].top_95}
                      />
                    )}
                  </TableCell>
                  <TableCell className={classes.monospace} align='right'>
                    {variation.variationId === baseVariationId ? (
                      'Baseline'
                    ) : (
                      <MetricValueInterval
                        intervalName={'the relative change between variations'}
                        unit={getUnitInfo(metric, [UnitDerivationType.RelativeDifference])}
                        bottomValue={Analyses.ratioToDifferenceRatio(
                          latestEstimates.ratios[`${variation.variationId}_${baseVariationId}`].bottom_95,
                        )}
                        topValue={Analyses.ratioToDifferenceRatio(
                          latestEstimates.ratios[`${variation.variationId}_${baseVariationId}`].top_95,
                        )}
                      />
                    )}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography className={classes.analysisFinePrint}>
        95% Credible Intervals (CIs). <strong> Experimenter-set minimum practical difference: </strong>{' '}
        <MetricValue
          value={metricAssignment.minDifference}
          unit={getUnitInfo(metric, [UnitDerivationType.AbsoluteDifference])}
        />
        .
      </Typography>
      {dates.length > 1 ? (
        <div className={classes.metricEstimatePlots}>
          <Plot
            layout={{
              ...Visualizations.plotlyLayoutDefault,
              title: metricValuePlotTitle,
            }}
            data={plotlyDataVariationGraph}
            className={classes.metricEstimatePlot}
          />
          <Plot
            layout={{
              ...Visualizations.plotlyLayoutDefault,
              title: metricValueAbsoluteDifferencePlotTitle,
            }}
            data={plotlyDataDifferenceGraph}
            className={classes.metricEstimatePlot}
          />
        </div>
      ) : (
        <Typography variant='body1' className={classes.noPlotMessage}>
          Past values will be plotted once we have more than one day of results.
        </Typography>
      )}
      <Typography
        className={clsx(classes.dataTableHeader, classes.clickable)}
        onClick={toggleIsShowObservedData}
        role='button'
      >
        {isShowObservedData ? (
          <ExpandMore className={classes.expandCollapseIcon} />
        ) : (
          <ChevronRight className={classes.expandCollapseIcon} />
        )}
        &quot;Observed&quot; data
      </Typography>
      {isShowObservedData && (
        <>
          <TableContainer component={Paper}>
            <Table className={classes.coolTable}>
              <TableHead>
                <TableRow>
                  <TableCell>Variant</TableCell>
                  <TableCell align='right'>Users</TableCell>
                  <TableCell align='right'>
                    {countName}
                    <WarningAsterisk />
                  </TableCell>
                  <TableCell align='right' className={classes.unitName}>
                    {unitName}
                    <WarningAsterisk />
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {experiment.variations.map((variation) => (
                  <React.Fragment key={variation.variationId}>
                    <TableRow className={!isVariationSelected(variation) ? classes.rowVariationNotSelected : undefined}>
                      <TableCell
                        component='th'
                        scope='row'
                        variant='head'
                        valign='top'
                        className={clsx(classes.rowHeader, classes.headerCell, classes.credibleIntervalHeader)}
                      >
                        <span className={classes.monospace}>{variation.name}</span>
                      </TableCell>
                      <TableCell className={classes.monospace} align='right'>
                        <MetricValue
                          value={latestAnalysis.participantStats[`variation_${variation.variationId}`]}
                          unit={{ unitType: UnitType.Count }}
                          displayUnit={false}
                        />
                      </TableCell>
                      <TableCell className={classes.monospace} align='right'>
                        <MetricValue
                          value={
                            latestAnalysis.participantStats[`variation_${variation.variationId}`] *
                            latestEstimates.variations[variation.variationId].mean
                          }
                          unit={{ unitType: UnitType.Count }}
                          displayUnit={false}
                        />
                      </TableCell>
                      <TableCell className={classes.monospace} align='right'>
                        <MetricValue
                          value={latestEstimates.variations[variation.variationId].mean}
                          unit={getUnitInfo(metric)}
                        />
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant='caption' gutterBottom>
            <PrivateLink href='https://wp.me/PCYsg-Fqg/#observed-data-uses-posterior-means' target='_blank'>
              <WarningAsterisk /> &quot;Observed&quot; data as produced from our model, not raw observed data.
            </PrivateLink>{' '}
            For illustrative purposes only.
          </Typography>
        </>
      )}
      <Typography
        className={clsx(classes.dataTableHeader, classes.clickable)}
        onClick={toggleIsShowAllCredibleIntervals}
        role='button'
      >
        {isShowAllCredibleIntervals ? (
          <ExpandMore className={classes.expandCollapseIcon} />
        ) : (
          <ChevronRight className={classes.expandCollapseIcon} />
        )}
        All credible intervals
      </Typography>
      {isShowAllCredibleIntervals && (
        <TableContainer component={Paper}>
          <Table className={classes.coolTable}>
            <TableHead>
              <TableRow>
                <TableCell>Measure</TableCell>
                <TableCell align='right'>99%</TableCell>
                <TableCell align='right'>95%</TableCell>
                <TableCell align='right'>50%</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allCredibleIntervalLines.map(({ name, distributionStats, intervalName, unit }) => (
                <React.Fragment key={name}>
                  {distributionStats && (
                    <TableRow>
                      <TableCell
                        component='th'
                        scope='row'
                        variant='head'
                        valign='top'
                        className={clsx(classes.rowHeader, classes.headerCell, classes.credibleIntervalHeader)}
                      >
                        <span className={classes.monospace}>{name}</span>
                      </TableCell>
                      <TableCell className={classes.monospace} align='right'>
                        <MetricValueInterval
                          intervalName={intervalName}
                          ciPercent={99}
                          unit={unit}
                          bottomValue={distributionStats[`bottom_99`] || NaN}
                          topValue={distributionStats[`top_99`] || NaN}
                          displayPositiveSign={false}
                        />
                      </TableCell>
                      <TableCell className={classes.monospace} align='right'>
                        <MetricValueInterval
                          intervalName={intervalName}
                          ciPercent={95}
                          unit={unit}
                          bottomValue={distributionStats[`bottom_95`] || NaN}
                          topValue={distributionStats[`top_95`] || NaN}
                          displayPositiveSign={false}
                        />
                      </TableCell>
                      <TableCell className={classes.monospace} align='right'>
                        <MetricValueInterval
                          intervalName={intervalName}
                          ciPercent={50}
                          unit={unit}
                          bottomValue={distributionStats[`bottom_50`] || NaN}
                          topValue={distributionStats[`top_50`] || NaN}
                          displayPositiveSign={false}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  )
}
