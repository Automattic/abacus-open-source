import {
  Button,
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
  withStyles,
} from '@material-ui/core'
import { Add as AddIcon, Edit as EditIcon } from '@material-ui/icons'
import React from 'react'

import { Metric } from 'src/lib/schemas'
import { formatBoolean } from 'src/utils/formatters'

export type Data = Partial<Metric & Record<string, unknown>>

const useMetricDetailStyles = makeStyles((theme: Theme) =>
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
  }),
)

const useMetricNameStyles = makeStyles({
  metricName: {
    minWidth: 0,
    flex: 1,
    justifyContent: 'flex-start',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
})

const useAssignMetricButtonStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    '& .MuiButton-containedSizeSmall': {
      padding: '5px 15px',
      fontSize: '14px',
      lineHeight: 1.75,
    },
    '& .MuiButton-label': {
      fontSize: '0.875rem',
      marginRight: 4,
    },
    '& .MuiButton-startIcon': {
      marginLeft: 0,
      marginRight: 2,
    },
  },
  noWrap: {
    whiteSpace: 'nowrap',
  },
})

export const MetricDetailRenderer = ({ data }: { data: Data }): JSX.Element => {
  const classes = useMetricDetailStyles()

  return (
    <TableContainer className={classes.root}>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className={classes.headerCell}>Higher is Better:</TableCell>
            <TableCell className={classes.dataCell}>{formatBoolean(data.higherIsBetter as boolean)}</TableCell>
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

export const WizardMetricDetailRenderer = ({ data }: { data: Data }): JSX.Element => {
  const classes = useMetricDetailStyles()

  return (
    <TableContainer className={classes.root}>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className={classes.headerCell}>Name:</TableCell>
            <TableCell className={classes.dataCell}>{data.name}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={classes.headerCell}>Parameter Type:</TableCell>
            <TableCell className={classes.dataCell}>{data.parameterType}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={classes.headerCell}>Higher is Better:</TableCell>
            <TableCell className={classes.dataCell}>{formatBoolean(data.higherIsBetter as boolean)}</TableCell>
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

export const MetricNameRenderer = ({ name }: { name: string }): JSX.Element => {
  const classes = useMetricNameStyles()

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
  data: Metric
  onEditMetric: (metricId: number) => void
}): JSX.Element => {
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

export const AssignMetricButtonRenderer = ({
  data,
  onAssignMetric,
}: {
  data: Metric
  onAssignMetric: (data: Metric) => void
}): JSX.Element => {
  const classes = useAssignMetricButtonStyles()

  const ColorButton = withStyles((theme: Theme) => ({
    root: {
      color: theme.palette.primary.contrastText,
      backgroundColor: theme.palette.primary.light,
      '&:hover': {
        backgroundColor: theme.palette.primary.main,
      },
    },
  }))(Button)

  return (
    <div className={classes.root}>
      <ColorButton
        variant='contained'
        color='primary'
        disableElevation
        size='small'
        onClick={() => onAssignMetric(data)}
        startIcon={<AddIcon />}
        className={classes.noWrap}
        aria-label='Assign metric'
      >
        Assign Metric
      </ColorButton>
    </div>
  )
}
