import {
  createStyles,
  IconButton,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Theme,
  Tooltip,
} from '@material-ui/core'
import { ChevronRightRounded as ChevronRightRoundedIcon, Edit as EditIcon } from '@material-ui/icons'
import debugFactory from 'debug'
import React from 'react'

import { MetricDetail } from 'src/components/metrics/MetricsTableAgGrid'
import { formatBoolean } from 'src/utils/formatters'

const debug = debugFactory('abacus:components/MetricDetailRenderer.tsx')

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2, 8),
      background: theme.palette.action.hover,
      height: '100%',
    },
    headerCell: {
      fontWeight: 'bold',
      width: '9rem',
      verticalAlign: 'top',
    },
    dataCell: {
      fontFamily: theme.custom.fonts.monospace,
    },
    pre: {
      whiteSpace: 'pre',
      maxHeight: '15rem',
      overflow: 'scroll',
      padding: theme.spacing(1),
      borderWidth: 1,
      borderColor: theme.palette.divider,
      borderStyle: 'solid',
      background: '#fff',
    },
    metricName: {
      minWidth: 0,
      flex: 1,
      justifyContent: 'flex-start',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  }),
)

export const MetricDetailRenderer = ({ data }: { data: MetricDetail }): JSX.Element => {
  debug('MetricDetailRenderer#render')
  const classes = useStyles()

  return (
    <TableContainer className={classes.root}>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className={classes.headerCell}>Higher is Better:</TableCell>
            <TableCell className={classes.dataCell}>{formatBoolean(data.higherIsBetter)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={classes.headerCell}>Parameters:</TableCell>
            <TableCell className={classes.dataCell}>
              <div className={classes.pre}>
                {JSON.stringify(data.parameterType === 'conversion' ? data.eventParams : data.revenueParams, null, 4)}
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export const MetricDetailToggleButtonRenderer = ({
  data,
  detailRowToggleMap,
}: {
  data: MetricDetail
  detailRowToggleMap: Map<string, boolean>
}): JSX.Element => {
  debug('MetricDetailToggleButtonRenderer#render')
  const detailRowExists = detailRowToggleMap.get(data.name)
  const transform = detailRowExists ? 'rotate(90deg)' : 'none'

  return (
    <Tooltip title='Toggle details'>
      <IconButton
        id={data.name}
        style={{ transition: 'all 200ms ease 0s', transform: transform }}
        aria-label='Toggle Metric Details'
      >
        <ChevronRightRoundedIcon />
      </IconButton>
    </Tooltip>
  )
}

export const MetricNameRenderer = ({ name }: { name: string }): JSX.Element => {
  debug('MetricNameRenderer#render')
  const classes = useStyles()

  return (
    <Tooltip title={name}>
      <div className={classes.metricName}>{name}</div>
    </Tooltip>
  )
}

export const MetricEditButtonRenderer = ({
  data,
  onEditMetric,
}: {
  data: MetricDetail
  onEditMetric: (metricId: number) => void
}): JSX.Element => {
  debug('MetricEditButtonRenderer#render')

  return (
    <IconButton
      onClick={() => {
        onEditMetric(data.metricId)
      }}
      aria-label='Edit Metric'
    >
      <EditIcon />
    </IconButton>
  )
}
