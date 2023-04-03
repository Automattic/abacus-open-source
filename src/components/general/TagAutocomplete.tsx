import { TextField, Typography } from '@material-ui/core'
import { Autocomplete, AutocompleteProps, AutocompleteRenderInputParams } from '@material-ui/lab'
import _ from 'lodash'
import React from 'react'

import { autocompleteInputProps } from 'src/components/general/Autocomplete'
import { TagFull } from 'src/lib/explat/schemas'

/**
 * An Autocomplete just for Metrics
 */
export default function TagAutocomplete<
  Multiple extends boolean | undefined = undefined,
  DisableClearable extends boolean | undefined = undefined,
  FreeSolo extends boolean | undefined = undefined,
>(
  props: Omit<AutocompleteProps<TagFull, Multiple, DisableClearable, FreeSolo>, 'renderInput'> & {
    error?: string | false
  },
): ReturnType<typeof Autocomplete> {
  const processedOptions = props.options
    .filter((a) => !a.name.startsWith('archived_'))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
  return (
    <Autocomplete<TagFull, Multiple, DisableClearable, FreeSolo>
      aria-label='Select a tag'
      fullWidth
      options={processedOptions}
      noOptionsText='No tags found'
      getOptionLabel={(tag: TagFull) => tag.name}
      getOptionSelected={(tagA: TagFull, tagB: TagFull) => tagA.tagId === tagB.tagId}
      renderOption={(option: TagFull) => (
        <div>
          <Typography variant='body1'>
            <strong>{option.name}</strong>
          </Typography>
          <Typography variant='body1'>
            <small>{option.description}</small>
          </Typography>
        </div>
      )}
      renderInput={(params: AutocompleteRenderInputParams) => (
        <TextField
          {...params}
          placeholder='Select a tag'
          error={!!props.error}
          helperText={_.isString(props.error) ? props.error : undefined}
          required
          InputProps={{
            ...autocompleteInputProps(params, false),
          }}
          InputLabelProps={{
            shrink: true,
          }}
          variant='outlined'
          size='small'
        />
      )}
      {..._.omit(props, ['options', 'error'])}
    />
  )
}
