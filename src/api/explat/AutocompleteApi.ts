import { StatusCodes } from 'http-status-codes'

import { fetchApi } from 'src/api/explat/utils'
import { AutocompleteItem, autocompleteSchema, eventDetailsSchema } from 'src/lib/explat/schemas'

import HttpResponseError from '../HttpResponseError'

async function getCompletion(name: string) {
  return await autocompleteSchema.validate(await fetchApi('GET', `/autocomplete/${name}`), { abortEarly: false })
}

export async function getUserCompletions(): Promise<AutocompleteItem[]> {
  return (await getCompletion('users')).completions
}

export async function getEventNameCompletions(): Promise<AutocompleteItem[]> {
  return (await getCompletion('events')).completions
}

export async function getPropNameCompletions(eventName: string): Promise<AutocompleteItem[] | null> {
  if (!eventName) {
    throw new Error('No eventName to getPropNameCompletions of.')
  }

  try {
    const apiResponse = await eventDetailsSchema.validate(await fetchApi('GET', `/autocomplete/events/${eventName}`))
    return apiResponse.props.map((p) => ({
      name: p.name,
      value: p.name,
    }))
  } catch (error) {
    // istanbul ignore else; Forced to use the else here to prevent two istanbul ignores
    if (error instanceof HttpResponseError && error.status === StatusCodes.NOT_FOUND) {
      return null
    } else {
      throw error
    }
  }
}
