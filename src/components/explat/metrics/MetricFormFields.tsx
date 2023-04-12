import { Chip, FormControl, FormControlLabel, FormLabel, Radio, TextField as MuiTextField } from '@material-ui/core'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import { Field, FormikProps } from 'formik'
import { fieldToTextField, RadioGroup, Switch, TextField, TextFieldProps } from 'formik-material-ui'
import { AutocompleteRenderInputParams } from 'formik-material-ui-lab'
import _ from 'lodash'
import React, { useEffect } from 'react'

import TagsApi from 'src/api/explat/TagsApi'
import AbacusAutocomplete, { autocompleteInputProps } from 'src/components/general/Autocomplete'
import { MetricFormData } from 'src/lib/explat/form-data'
import { metricParameterTypeName } from 'src/lib/explat/metrics'
import { AutocompleteItem, metricParameterTypeToParameterField } from 'src/lib/explat/schemas'
import { DIVISION_METRIC_TAG_NAMESPACES } from 'src/lib/explat/tags'
import { useDataLoadingError, useDataSource } from 'src/utils/data-loading'

import DebugOutput from '../../general/DebugOutput'

const useJsonTextFieldStyles = makeStyles((_theme: Theme) =>
  createStyles({
    root: { width: '100%' },
  }),
)

// This fixes the error state in JSON text fields by removing the error helper text
// as otherwise it throws an exception when the error is an object.
function JsonTextField({ children, helperText = '', ...props }: TextFieldProps) {
  const classes = useJsonTextFieldStyles()

  return (
    <div className={classes.root}>
      <MuiTextField {...fieldToTextField(props)} helperText={helperText}>
        {children}
      </MuiTextField>
    </div>
  )
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {},
    row: {
      margin: theme.spacing(3, 0),
      display: 'flex',
      alignItems: 'center',
      '&:first-of-type': {
        marginTop: 0,
      },
    },
  }),
)

const MetricFormFields = ({ formikProps }: { formikProps: FormikProps<{ metric: MetricFormData }> }): JSX.Element => {
  const classes = useStyles()

  // Here we reset the params field after parameterType changes
  useEffect(() => {
    const paramsField = metricParameterTypeToParameterField[formikProps.values.metric.parameterType]
    const params = formikProps.values.metric[paramsField]
    formikProps.setValues({
      ...formikProps.values,
      metric: {
        ...formikProps.values.metric,
        [metricParameterTypeToParameterField[formikProps.values.metric.parameterType]]: params ?? '',
        // Set the other parameterFields to undefined:
        ...(Object.fromEntries(
          Object.values(_.omit(metricParameterTypeToParameterField, formikProps.values.metric.parameterType)).map(
            (parameterField) => [parameterField, undefined],
          ),
        ) as Partial<MetricFormData>),
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formikProps.values.metric.parameterType])

  const paramsField = metricParameterTypeToParameterField[formikProps.values.metric.parameterType]
  const metricTypeName = metricParameterTypeName[formikProps.values.metric.parameterType]

  const {
    isLoading: tagOptionsLoading,
    data: tagOptions,
    error: tagOptionsError,
  } = useDataSource(async () => {
    const tags = await TagsApi.findAll()
    return tags
      .filter((tag) => DIVISION_METRIC_TAG_NAMESPACES.includes(tag.namespace))
      .map((tag) => ({
        name: tag.name,
        value: tag.tagId,
      }))
  }, [])
  useDataLoadingError(tagOptionsError, 'Tags')

  return (
    <>
      <div className={classes.row}>
        <Field
          component={TextField}
          name='metric.name'
          id='metric.name'
          label='Metric name'
          placeholder='metric_name'
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
          name='metric.description'
          id='metric.description'
          label='Metric description'
          placeholder='Put your Metric description here!'
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
          component={AbacusAutocomplete}
          name='metric.tags'
          id='metric.tags'
          fullWidth
          options={
            // istanbul ignore next; trivial
            tagOptions ?? []
          }
          loading={tagOptionsLoading}
          multiple
          renderOption={(option: AutocompleteItem) => <Chip label={option.name} />}
          renderInput={(params: AutocompleteRenderInputParams) => (
            <MuiTextField
              {...params}
              variant='outlined'
              InputProps={{
                ...autocompleteInputProps(params, tagOptionsLoading),
              }}
              label='Tags'
            />
          )}
          noOptionsText='No tags found'
          openText='Open tags list'
        />
      </div>
      <div className={classes.row}>
        <FormControlLabel
          label='Higher is better'
          control={
            <Field
              component={Switch}
              name='metric.higherIsBetter'
              id='metric.higherIsBetter'
              label='Higher is better'
              type='checkbox'
              aria-label='Higher is better'
              variant='outlined'
            />
          }
        />
      </div>
      <div className={classes.row}>
        <FormControl component='fieldset'>
          <FormLabel required id='metric-form-radio-metric-type-label'>
            Metric Type
          </FormLabel>
          <Field
            component={RadioGroup}
            name='metric.parameterType'
            required
            aria-labelledby='metric-form-radio-metric-type-label'
          >
            {Object.entries(metricParameterTypeName).map(([parameterType, name]) => (
              <FormControlLabel
                key={parameterType}
                value={parameterType}
                label={name}
                aria-label={name}
                control={<Radio disabled={formikProps.isSubmitting} />}
                disabled={formikProps.isSubmitting}
              />
            ))}
          </Field>
        </FormControl>
      </div>
      <div className={classes.row}>
        <Field
          component={JsonTextField}
          name={`metric.${paramsField}`}
          id={`metric.${paramsField}`}
          label={`${metricTypeName} Parameters`}
          variant='outlined'
          fullWidth
          required
          multiline
          rows={8}
          InputLabelProps={{
            shrink: true,
          }}
        />
      </div>
      <DebugOutput label='Validation Errors' content={formikProps.errors} />
    </>
  )
}

export default MetricFormFields
