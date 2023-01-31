import { createStyles, Dialog, DialogContent, DialogTitle, IconButton, makeStyles, Typography } from '@material-ui/core'
import { Close } from '@material-ui/icons'
import _ from 'lodash'
import React from 'react'

import { Metric } from 'src/lib/explat/schemas'

import MetricDetails from '../MetricDetails'

const useStyles = makeStyles(() =>
  createStyles({
    metricDetailsDialogClose: {
      position: 'absolute',
      top: 0,
      right: 0,
    },
  }),
)

export default function MetricDetailsModal({ metric, onClose }: { metric: Metric; onClose: () => void }): JSX.Element {
  const classes = useStyles()

  return (
    <Dialog maxWidth='md' open onClose={onClose}>
      <DialogTitle>
        <Typography variant='h5'>
          <strong>Metric:</strong> {metric.name}
        </Typography>
        <IconButton aria-label='Close metric details' className={classes.metricDetailsDialogClose} onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <MetricDetails metric={metric} />
      </DialogContent>
    </Dialog>
  )
}
