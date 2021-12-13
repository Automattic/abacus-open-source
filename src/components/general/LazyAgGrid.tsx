import { LinearProgress } from '@material-ui/core'
import { AgGridReactProps } from 'ag-grid-react'
import React, { Suspense } from 'react'

const AgGrid = React.lazy(() => import('./AgGridReact'))

export default function LazyAgGrid(props: AgGridReactProps): JSX.Element {
  return (
    <Suspense fallback={<LinearProgress />}>
      <AgGrid {...props} />
    </Suspense>
  )
}
