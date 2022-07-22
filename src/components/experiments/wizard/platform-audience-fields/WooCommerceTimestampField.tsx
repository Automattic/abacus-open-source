import { FormControl, FormHelperText, FormLabel, Switch, TextField } from '@material-ui/core'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import { FormikProps, useFormikContext } from 'formik'
import React, { useEffect, useState } from 'react'

import { ExperimentFormData } from 'src/lib/form-data'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    row: {
      height: 60,
      minWidth: 280,
      margin: theme.spacing(1, 0, 1, 0),
      display: 'flex',
      alignItems: 'center',
      '&:first-of-type': {
        marginRight: theme.spacing(1),
      },
      [theme.breakpoints.down('xs')]: {
        flexDirection: 'column',
        alignItems: 'normal',
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

const getDateStringFromTimestamp = (timestamp: string) => {
  const date = timestamp ? new Date(parseInt(timestamp, 10) * 1000) : new Date()
  return date.toISOString().split('T')[0]
}

const WooCommerceTimestampField: React.FC = () => {
  const classes = useStyles()
  const formikContext: FormikProps<{ experiment: ExperimentFormData }> = useFormikContext()
  const [checked, setChecked] = useState(
    formikContext.values.experiment.platformSegments?.woocommerce_installed_after_timestamp ? true : false,
  )

  const [creationDate, setCreationDate] = useState(
    getDateStringFromTimestamp(formikContext.values.experiment.platformSegments?.woocommerce_installed_after_timestamp),
  )

  useEffect(() => {
    if (!checked) {
      formikContext.setFieldValue('experiment.platformSegments.woocommerce_installed_after_timestamp', null)
    }
  }, [checked, formikContext])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked)
  }

  const onDateSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(event.target.value)
    const timestamp = Math.floor(date.getTime() / 1000)
    formikContext.setFieldValue(
      'experiment.platformSegments.woocommerce_installed_after_timestamp',
      timestamp.toString(),
    )
    setCreationDate(event.target.value)
  }

  return (
    <FormControl component='fieldset'>
      <FormLabel required>WooCommerce Store Creation Date?</FormLabel>
      <FormHelperText>Only target stores created after a certain date.</FormHelperText>
      <div className={classes.row}>
        <Switch checked={checked} onChange={handleChange} inputProps={{ 'aria-label': 'controlled' }} />
        {checked && (
          <TextField
            className={classes.datePicker}
            label='Store created date'
            type='date'
            variant='outlined'
            required
            value={creationDate}
            onChange={onDateSelected}
            InputLabelProps={{
              shrink: true,
            }}
          />
        )}
      </div>
    </FormControl>
  )
}

export const timestampAudienceField = {
  name: 'woocommerce_installed_after_timestamp',
  field: WooCommerceTimestampField,
}
