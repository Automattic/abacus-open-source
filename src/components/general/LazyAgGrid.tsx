import { LinearProgress } from '@material-ui/core'
import { AgGridReactProps } from 'ag-grid-react'
import React, { Suspense } from 'react'

const AgGrid = React.lazy(() => import('./AgGridReact'))

/**
 * A code-split version of AgGridReact in order to reduce memory usage. Displays a loading bar while it lazily loads ag grid.
 * This should be used instead of importing AgGridReact directly.
 * @param props AgGridReactProps as defined in ag-grid-react
 * @returns An AgGrid component or a loading bar if it is loading.
 */
export default function LazyAgGrid(props: AgGridReactProps): JSX.Element {
  return (
    <Suspense fallback={<LinearProgress />}>
      <AgGrid {...props} />
    </Suspense>
  )
}
