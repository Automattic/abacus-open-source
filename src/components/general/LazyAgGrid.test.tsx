import { screen } from '@testing-library/react'
import React from 'react'

import { render } from 'src/test-helpers/test-utils'

import LazyAgGrid from './LazyAgGrid'

test('renders progress loading bar', async () => {
  render(<LazyAgGrid />)

  expect(await screen.findByRole('progressbar'))
})

test('renders a grid', async () => {
  const { container } = render(<LazyAgGrid />)

  expect(container).toMatchSnapshot()
})
