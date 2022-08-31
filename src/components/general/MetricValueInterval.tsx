import { createStyles, makeStyles, Theme, Tooltip } from '@material-ui/core'
import clsx from 'clsx'
import React from 'react'

import MetricValue, { getMetricValueFormatData } from 'src/components/general/MetricValue'
import { MetricParameterType } from 'src/lib/schemas'
import { useDecorationStyles } from 'src/styles/styles'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    metricValueIntervalCentered: {
      display: 'flex',
      '& > span': {
        flex: 1,
        textAlign: 'left',
        '&:first-child': {
          textAlign: 'right',
          marginRight: theme.spacing(1),
        },
        '&:last-child': {
          marginLeft: theme.spacing(1),
        },
      },
    },
    metricValueWrapper: {
      whiteSpace: 'nowrap',
    },
  }),
)

/**
 * Displays a metric value interval.
 */
export default function MetricValueInterval({
  intervalName,
  metricParameterType,
  isDifference = false,
  bottomValue,
  topValue,
  displayTooltipHint = true,
  displayPositiveSign = true,
  alignToCenter,
}: {
  intervalName: string
  metricParameterType: MetricParameterType
  isDifference?: boolean
  bottomValue: number
  topValue: number
  displayTooltipHint?: boolean
  displayPositiveSign?: boolean
  alignToCenter?: boolean
}): JSX.Element {
  const classes = useStyles()
  const decorationClasses = useDecorationStyles()
  const metricValueFormat = getMetricValueFormatData({ metricParameterType, isDifference })
  return (
    <Tooltip
      title={
        <>
          <strong>Interpretation:</strong>
          <br />
          There is a 95% probability that {intervalName} is between{' '}
          <MetricValue
            value={bottomValue}
            metricParameterType={metricParameterType}
            isDifference={isDifference}
            displayPositiveSign={displayPositiveSign}
          />{' '}
          and{' '}
          <MetricValue
            value={topValue}
            metricParameterType={metricParameterType}
            isDifference={isDifference}
            displayPositiveSign={displayPositiveSign}
          />
          .
        </>
      }
    >
      <span
        className={clsx(
          displayTooltipHint && decorationClasses.tooltipped,
          alignToCenter && classes.metricValueIntervalCentered,
        )}
      >
        <span className={classes.metricValueWrapper}>
          <MetricValue
            value={bottomValue}
            metricParameterType={metricParameterType}
            isDifference={isDifference}
            displayUnit={false}
            displayPositiveSign={displayPositiveSign}
          />
        </span>{' '}
        to{' '}
        <span className={classes.metricValueWrapper}>
          <MetricValue
            value={topValue}
            metricParameterType={metricParameterType}
            isDifference={isDifference}
            displayUnit={false}
            displayPositiveSign={displayPositiveSign}
          />{' '}
          {metricValueFormat.unit}
        </span>
      </span>
    </Tooltip>
  )
}
