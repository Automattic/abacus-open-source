import React from 'react'

import { Platform } from 'src/lib/schemas'

import { timestampAudienceField } from './WooCommerceTimestampField'

type AudienceField = {
  // name should match one of the fields coming from /platform-segments/fields
  name: string
  field: React.FunctionComponent
}

export const PlatformAudienceFields: { [key in Platform]?: AudienceField[] } = {
  woocommerce: [timestampAudienceField],
}
