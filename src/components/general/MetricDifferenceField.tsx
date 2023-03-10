import { createStyles, InputAdornment, makeStyles, Tooltip, Typography } from '@material-ui/core'
import clsx from 'clsx'
import { Field } from 'formik'
import { TextField } from 'formik-material-ui'
import _ from 'lodash'
import React from 'react'

import { getUnitInfo, UnitDerivationType, UnitType } from 'src/lib/explat/metrics'
import { Metric } from 'src/lib/explat/schemas'
import { useDecorationStyles } from 'src/styles/styles'
import { formikFieldTransformer } from 'src/utils/formik'

const ConversionMetricTextField = formikFieldTransformer(
  TextField,
  (outer: string) => String(_.round((Number(outer) || 0) * 100, 2)),
  (inner: string) => String((Number(inner) || 0) / 100),
)

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      minWidth: '7rem',
      '& input': {
        textAlign: 'right',
      },
    },
    adornment: {
      width: '3rem',
    },
  }),
)

export default function MetricDifferenceField(props: {
  name: string
  id: string
  metric?: Metric
  className?: string
}): JSX.Element {
  const classes = useStyles()
  const decorationClasses = useDecorationStyles()

  if (!props.metric) {
    return (
      <Field
        className={clsx(classes.root, props.className)}
        disabled
        id={props.id}
        name={props.name}
        type='number'
        variant='outlined'
      />
    )
  }

  switch (getUnitInfo(props.metric, [UnitDerivationType.AbsoluteDifference]).unitType) {
    case UnitType.RatioPoints:
      return (
        <Field
          className={clsx(classes.root, props.className)}
          component={ConversionMetricTextField}
          name={props.name}
          id={props.id}
          type='number'
          variant='outlined'
          placeholder='0.03'
          inputProps={{
            'aria-label': 'Minimum Difference',
            min: '0',
            max: '100',
            step: '0.01',
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end' className={classes.adornment}>
                <Tooltip title='Percentage Points'>
                  <Typography variant='body1' color='textSecondary' className={decorationClasses.tooltipped}>
                    pp
                  </Typography>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
      )
    case UnitType.Usd:
      return (
        <Field
          className={clsx(classes.root, props.className)}
          component={TextField}
          name={props.name}
          id={props.id}
          type='number'
          variant='outlined'
          placeholder='0.01'
          inputProps={{
            'aria-label': 'Minimum Difference',
            min: '0',
            step: '0.01',
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end' className={classes.adornment}>
                USD
              </InputAdornment>
            ),
          }}
        />
      )
    // istanbul ignore next; shouldn't occur
    default:
      throw new Error('Unknown or missing MetricParameterType')
  }
}
