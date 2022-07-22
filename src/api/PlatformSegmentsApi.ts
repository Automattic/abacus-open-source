import * as yup from 'yup'

import { fetchApi } from './utils'

/**
 * Finds all the available segments.
 *
 * Note: Be sure to handle any errors that may be thrown.
 *
 * @throws UnauthorizedError
 */
async function getPlatformSegmentFields(): Promise<string[]> {
  const { fields } = await yup
    .object({ fields: yup.array(yup.string().defined()).defined() })
    .defined()
    .validate(await fetchApi('GET', '/platform-segments/fields'), { abortEarly: false })
  return fields
}

const PlatformSegmentsApi = {
  getPlatformSegmentFields,
}

export default PlatformSegmentsApi
