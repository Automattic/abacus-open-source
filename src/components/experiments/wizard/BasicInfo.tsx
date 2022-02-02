import {
  FormControl,
  FormLabel,
  InputAdornment,
  Link,
  MenuItem,
  TextField as MuiTextField,
  Typography,
} from '@material-ui/core'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import { AutocompleteRenderInputParams } from '@material-ui/lab'
import { Field } from 'formik'
import { Select, TextField } from 'formik-material-ui'
import React from 'react'

import AbacusAutocomplete, { autocompleteInputProps } from 'src/components/general/Autocomplete'
import CollapsibleAlert from 'src/components/general/CollapsibleAlert'

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
  }),
)

const BasicInfo = ({
  completionBag: { userCompletionDataSource },
}: {
  completionBag: ExperimentFormCompletionBag
}): JSX.Element => {
  const classes = useStyles()

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
        <FormControl component='fieldset'>
          <FormLabel required>Duration (in weeks)</FormLabel>
          <Field component={Select} name='experiment.duration'>
            <MenuItem value={0} disabled>
              Set the experiment duration
            </MenuItem>
            <MenuItem value={1}>1 week</MenuItem>
            {Array.from({ length: 5 }, (v, k) => k + 2).map((durationInWeeks) => (
              <MenuItem key={durationInWeeks} value={durationInWeeks}>
                {durationInWeeks} weeks
              </MenuItem>
            ))}
          </Field>
        </FormControl>
      </div>

      <CollapsibleAlert
        id='duration-warning-panel'
        severity='info'
        summary='How do I calculate the duration for the experiment?'
      >
        <Link
          underline='always'
          href='https://www.optimizely.com/sample-size-calculator/?conversion=3&effect=20&significance=95'
          target='_blank'
        >
          Use this calculator
        </Link>{' '}
        to determine the required experiment sample size and divide it by the actual weekly volume of the exposure event
        as calculated in{' '}
        <Link underline='always' href='https://mc.a8c.com/tracks/' target='_blank'>
          Tracks
        </Link>
        <br />
      </CollapsibleAlert>

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
