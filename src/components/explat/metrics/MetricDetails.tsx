import {
  createStyles,
  LinearProgress,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Theme,
} from '@material-ui/core'
import _ from 'lodash'
import React from 'react'

import { stringifyMetricParams } from 'src/lib/explat/metrics'
import { Metric, MetricParameterType } from 'src/lib/explat/schemas'
import { formatBoolean } from 'src/utils/formatters'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2, 8),
      background: theme.palette.action.hover,
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
  }),
)

export default function MetricDetails({
  isLoading,
  metric,
  isCompact,
}: {
  isLoading?: boolean
  metric?: Metric
  isCompact?: boolean
}): JSX.Element {
  const classes = useStyles()

  return (
    <>
      {isLoading && <LinearProgress />}
      {!isLoading && metric && (
        <TableContainer className={classes.root}>
          <Table>
            <TableBody>
              {!isCompact && (
                <>
                  <TableRow>
                    <TableCell className={classes.headerCell}>Description:</TableCell>
                    <TableCell className={classes.dataCell}>{metric.description}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className={classes.headerCell}>Parameter Type:</TableCell>
                    <TableCell className={classes.dataCell}>
                      {metric.parameterType === MetricParameterType.Revenue
                        ? 'Cash Sales'
                        : _.capitalize(metric.parameterType)}
                    </TableCell>
                  </TableRow>
                </>
              )}
              <TableRow>
                <TableCell className={classes.headerCell}>Higher is Better:</TableCell>
                <TableCell className={classes.dataCell}>{formatBoolean(metric.higherIsBetter)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className={classes.headerCell}>Parameters:</TableCell>
                <TableCell className={classes.dataCell}>
                  <div className={classes.pre}>{stringifyMetricParams(metric)}</div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  )
}
