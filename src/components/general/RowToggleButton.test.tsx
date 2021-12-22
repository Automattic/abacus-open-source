import { fireEvent, screen } from '@testing-library/react'
import React from 'react'

import { render } from 'src/test-helpers/test-utils'

import RowToggleButton from './RowToggleButton'

afterEach(() => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
})

test('calls callback function when clicked', async () => {
  const mockCallback = jest.fn()
  render(<RowToggleButton toggled={false} onClick={mockCallback} />)
  const button = await screen.findByLabelText('Toggle Row')
  fireEvent.click(button)

  expect(mockCallback.mock.calls.length).toBe(1)
})

test('button rotates when clicked', async () => {
  render(<RowToggleButton toggled={true} />)
  const button = await screen.findByLabelText('Toggle Row')

  expect(button.className).toContain('rotated')

  fireEvent.click(button)

  expect(button.className).toContain('notRotated')
})
