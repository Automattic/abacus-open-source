import { InputAdornment, TextField as MuiTextField, Typography } from '@material-ui/core'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import { Alert, AutocompleteRenderInputParams } from '@material-ui/lab'
import * as dateFns from 'date-fns'
import { Field, useField } from 'formik'
import { TextField } from 'formik-material-ui'
import React from 'react'

import AbacusAutocomplete, { autocompleteInputProps } from 'src/components/general/Autocomplete'
import {
  MAX_DISTANCE_BETWEEN_NOW_AND_START_DATE_IN_MONTHS,
  MAX_DISTANCE_BETWEEN_START_AND_END_DATE_IN_MONTHS,
} from 'src/lib/schemas'
import { formatIsoDate } from 'src/utils/time'

import { ExperimentFormCompletionBag } from './ExperimentForm'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {},
    row: {
      margin: theme.spacing(5, 0, 1, 0),
      display: 'flex',
      alignItems: 'center',
      '&:first-of-type': {
        marginTop: theme.spacing(3),
      },
      [theme.breakpoints.down('xs')]: {
        flexDirection: 'column',
        alignItems: 'stretch',
      },
    },
    through: {
      flex: 0,
      margin: theme.spacing(0, 2),
      color: theme.palette.text.hint,
      [theme.breakpoints.down('xs')]: {
        margin: theme.spacing(2, 2),
      },
    },
    datePicker: {
      flex: 1,
      '& input:invalid': {
        // Fix the native date-picker placeholder text colour
        color: theme.palette.text.hint,
      },
    },
  }),
)

const BasicInfo = ({
  completionBag: { userCompletionDataSource },
}: {
  completionBag: ExperimentFormCompletionBag
}): JSX.Element => {
  const classes = useStyles()

  const [startDateField] = useField('experiment.startDatetime')
  const minStartDate = new Date()
  const maxStartDate = dateFns.addMonths(new Date(), MAX_DISTANCE_BETWEEN_NOW_AND_START_DATE_IN_MONTHS)
  const minEndDate = startDateField.value && new Date(startDateField.value)
  const maxEndDate =
    startDateField.value &&
    dateFns.addMonths(new Date(startDateField.value), MAX_DISTANCE_BETWEEN_START_AND_END_DATE_IN_MONTHS)
  const formatDateForInput = (date: Date) => (date ? formatIsoDate(date) : undefined)

  return (
    <div className={classes.root}>
      <Typography variant='h4' gutterBottom>
        Basic Info
      </Typography>

      <div className={classes.row}>
        <Field
          component={TextField}
          name='experiment.name'
          id='experiment.name'
          label='Experiment name'
          placeholder='experiment_name'
          helperText='Use snake_case.'
          variant='outlined'
          fullWidth
          required
          InputLabelProps={{
            shrink: true,
          }}
        />
      </div>

      <div className={classes.row}>
        <Field
          component={TextField}
          name='experiment.description'
          id='experiment.description'
          label='Experiment description'
          placeholder='Monthly vs. yearly pricing'
          helperText='State your hypothesis.'
          variant='outlined'
          fullWidth
          required
          multiline
          rows={4}
          InputLabelProps={{
            shrink: true,
          }}
        />
      </div>

      <div className={classes.row}>
        <Field
          component={TextField}
          className={classes.datePicker}
          name='experiment.startDatetime'
          id='experiment.startDatetime'
          label='Start date (UTC)'
          type='date'
          variant='outlined'
          required
          InputLabelProps={{
            shrink: true,
          }}
          inputProps={{
            min: formatDateForInput(minStartDate),
            max: formatDateForInput(maxStartDate),
          }}
        />
        <span className={classes.through}> through </span>
        <Field
          component={TextField}
          className={classes.datePicker}
          name='experiment.endDatetime'
          id='experiment.endDatetime'
          label='End date (UTC)'
          type='date'
          variant='outlined'
          required
          InputLabelProps={{
            shrink: true,
          }}
          inputProps={{
            min: formatDateForInput(minEndDate),
            max: formatDateForInput(maxEndDate),
          }}
        />
      </div>
      <Alert severity='info'>
        The experiment will <strong>start and end automatically</strong> around 00:10 UTC on these dates.
      </Alert>

      <div className={classes.row}>
        <Field
          component={AbacusAutocomplete}
          name='experiment.ownerLogin'
          id='experiment.ownerLogin'
          fullWidth
          options={userCompletionDataSource.data ?? []}
          loading={userCompletionDataSource.isLoading}
          noOptionsText='No users found'
          renderInput={(params: AutocompleteRenderInputParams) => (
            <MuiTextField
              {...params}
              label='Owner'
              placeholder='wp_username'
              helperText='Use WordPress.com username.'
              variant='outlined'
              required
              InputProps={{
                ...autocompleteInputProps(params, userCompletionDataSource.isLoading),
                startAdornment: <InputAdornment position='start'>@</InputAdornment>,
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          )}
        />
      </div>
    </div>
  )
}

export default BasicInfo
