import {
  createStyles,
  Link,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Theme,
  Tooltip,
  Typography,
} from '@material-ui/core'
import clsx from 'clsx'
import _ from 'lodash'
import React from 'react'

import { HealthIndicationSeverity, HealthIndicator, HealthIndicatorUnit } from 'src/lib/analyses'
import { useDecorationStyles } from 'src/styles/styles'

const indicationSeverityClassSymbol = (severity: HealthIndicationSeverity) => `indicationSeverity${severity}`

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {},
    monospace: {
      fontFamily: theme.custom.fonts.monospace,
    },
    deemphasized: {
      color: theme.palette.grey[600],
    },
    nowrap: {
      whiteSpace: 'nowrap',
    },
    indication: {
      padding: theme.spacing(2),
    },
    [indicationSeverityClassSymbol(HealthIndicationSeverity.Ok)]: {
      background: '#56ff564f',
    },
    [indicationSeverityClassSymbol(HealthIndicationSeverity.Warning)]: {
      background: '#fde799ab',
    },
    [indicationSeverityClassSymbol(HealthIndicationSeverity.Error)]: {
      background: '#ff868661',
    },
  }),
)

const severityEmoji: Record<HealthIndicationSeverity, string> = {
  [HealthIndicationSeverity.Ok]: '',
  [HealthIndicationSeverity.Warning]: 'ℹ️',
  [HealthIndicationSeverity.Error]: '🆘',
}

export default function HealthIndicatorTable({
  className,
  indicators,
}: {
  className?: string
  indicators: HealthIndicator[]
}): JSX.Element {
  const classes = useStyles()
  const decorationClasses = useDecorationStyles()
  return (
    <TableContainer className={className}>
      <Table className={classes.table} aria-label='simple table'>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Value</TableCell>
            <TableCell>{/* Indication Emoji */}</TableCell>
            <TableCell>Indication</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Recommendation</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {indicators.map((indicator) => (
            <TableRow key={indicator.name}>
              <TableCell scope='row'>
                <Link href={indicator.link} target='_blank'>
                  {indicator.name}
                </Link>
              </TableCell>
              <TableCell scope='row' className={clsx(classes.monospace, classes.deemphasized, classes.nowrap)}>
                {indicator.unit === HealthIndicatorUnit.Pvalue ? (
                  <Tooltip title='The smaller the p-value the more likely there is an issue.'>
                    <span className={decorationClasses.tooltipped}>p-value</span>
                  </Tooltip>
                ) : (
                  <span>{indicator.unit}</span>
                )}
              </TableCell>
              <TableCell scope='row' className={clsx(classes.monospace, classes.deemphasized, classes.nowrap)}>
                {indicator.value.toFixed(4)}
              </TableCell>
              <TableCell scope='row'>
                <span>{severityEmoji[indicator.indication.severity]}</span>
              </TableCell>
              <TableCell
                scope='row'
                className={clsx(
                  classes.indication,
                  classes[indicationSeverityClassSymbol(indicator.indication.severity)],
                  classes.monospace,
                  classes.nowrap,
                )}
              >
                <span>{indicator.indication.code}</span>
              </TableCell>
              <TableCell scope='row' className={clsx(classes.monospace, classes.deemphasized, classes.nowrap)}>
                {indicator.indication.reason}
              </TableCell>
              <TableCell scope='row' className={clsx(classes.deemphasized, classes.recommendation)}>
                <Typography variant='body1'>{indicator.indication.recommendation}</Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
