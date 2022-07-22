import React from 'react'

import { Platform } from 'src/lib/schemas'

import { timestampAudienceField } from './WooCommerceTimestampField'

type AudienceField = {
  name: string
  field: React.FunctionComponent
}

export const PlatformAudienceFields: { [key in Platform]?: AudienceField[] } = {
  woocommerce: [timestampAudienceField],
}
