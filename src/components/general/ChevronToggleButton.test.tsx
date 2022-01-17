import { fireEvent, screen } from '@testing-library/react'
import React from 'react'

import { render } from 'src/test-helpers/test-utils'

import ChevronToggleButton from './ChevronToggleButton'

afterEach(() => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
})

test('calls callback function when clicked', async () => {
  const mockCallback = jest.fn()
  render(<ChevronToggleButton isOpen={false} onClick={mockCallback} />)
  const button = await screen.findByLabelText('Toggle Button')
  fireEvent.click(button)

  expect(mockCallback.mock.calls.length).toBe(1)
})

test('button rotates depending on isOpen prop', async () => {
  const { rerender } = render(<ChevronToggleButton isOpen={true} />)
  let button = await screen.findByLabelText('Toggle Button')

  expect(button.className).toContain('rotated')

  rerender(<ChevronToggleButton isOpen={false} />)

  button = await screen.findByLabelText('Toggle Button')
  expect(button.className).toContain('notRotated')
})
