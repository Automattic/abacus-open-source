import {
  CellClickedEvent,
  ColumnApi,
  GetRowNodeIdFunc,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  RowNode,
} from 'ag-grid-community'
import { AgGridColumnProps, AgGridReact, AgGridReactProps } from 'ag-grid-react'
import React, { forwardRef, ForwardRefRenderFunction, useImperativeHandle, useRef, useState } from 'react'

import {
  DETAIL_TOGGLE_BUTTON_COLUMN_NAME,
  DetailButtonRenderer,
  detailIdFromDataId,
  ExternalRow,
  getDetailRowHeight,
  InternalRow,
  IS_DETAIL_SYM,
  IS_OPEN_SYM,
  isDetailRow,
  onCellClicked,
  setHeightOfFullWidthRow,
} from './AgGridWithDetails.utils'

interface AgGridWithDetailsProps extends AgGridReactProps {
  rowData: ExternalRow[]
  columnDefs: AgGridColumnProps[]
  actionColumnIdSuffix?: string
  detailRowRenderer: ({ data }: { data: ExternalRow }) => JSX.Element
  getRowNodeId: GetRowNodeIdFunc
}

type AgGridWithDetailsHandle = {
  getGridApi: () => GridApi | null
  getGridColumnApi: () => ColumnApi | null
}

const detailButtonColumnDef = {
  headerName: '',
  field: DETAIL_TOGGLE_BUTTON_COLUMN_NAME,
  sortable: false,
  filter: false,
  resizable: false,
  cellStyle: {
    display: 'flex',
    alignItems: 'center',
    color: 'rgba(0, 0, 0, 0.5)',
    paddingLeft: 0,
    paddingRight: 0,
  },
  cellRenderer: 'detailButtonRenderer',
  width: 54,
  minWidth: 54,
}

/**
 * Renders an AgGrid that can display a master/detail component for each row.
 * Forwarding a ref here so that outside components can access the Grid APIs
 */
const AgGridWithDetails: ForwardRefRenderFunction<AgGridWithDetailsHandle, AgGridWithDetailsProps> = (
  { detailRowRenderer, getRowNodeId, actionColumnIdSuffix, ...props }: AgGridWithDetailsProps,
  ref,
) => {
  const { rowData, columnDefs, ...gridOptions } = props

  const gridApiRef = useRef<GridApi | null>(null)
  const gridColumnApiRef = useRef<ColumnApi | null>(null)
  const maxRowHeightMapRef = useRef<Record<string, number>>({})

  // The grid and column API instances are being forwarded through an imperative handle so that parent components can
  // access and manipulate the grid as necessary based on outside state, such as searching, sorting, or filtering.
  // istanbul ignore next; jest can't quite figure out that these 2 lines are covered
  const getGridApi = () => gridApiRef.current
  // istanbul ignore next
  const getGridColumnApi = () => gridColumnApiRef.current
  useImperativeHandle(ref, () => ({
    getGridApi: getGridApi,
    getGridColumnApi: getGridColumnApi,
  }))

  const onGridReady = (event: GridReadyEvent) => {
    gridApiRef.current = event.api
    gridColumnApiRef.current = event.columnApi
  }

  // Maps regular rowId -> whether or not its detail row is open
  const [detailRowToggleMap, setDetailRowToggleMap] = useState<Record<string, boolean>>({})

  // Checks to see if the detail row of rowId is open
  const isDetailRowOpen = (rowId: string) => {
    return !!detailRowToggleMap[rowId]
  }

  const toggleDetailRowState = (rowId: string) => {
    setDetailRowToggleMap({
      ...detailRowToggleMap,
      [rowId]: !isDetailRowOpen(rowId),
    })
  }

  const toggleDetailRowOpen = (rowId: string) => {
    if (!gridApiRef.current) {
      throw new Error('GridApi is null.')
    }

    const rowNode = gridApiRef.current.getRowNode(rowId)
    if (!rowNode) {
      throw new Error(`Could not find row node with row id: ${rowId}`)
    }

    const toggledValue = !isDetailRowOpen(rowId)
    toggleDetailRowState(rowId)

    if (toggledValue) {
      setHeightOfFullWidthRow(1 + (rowNode.rowIndex as number), rowId, maxRowHeightMapRef.current, gridApiRef.current)
    }

    // Toggle the detail button
    // Retrieve the cell renderer instance of the detail button
    const params = { columns: [DETAIL_TOGGLE_BUTTON_COLUMN_NAME], rowNodes: [rowNode] }
    const cellRendererInstances = gridApiRef.current.getCellRendererInstances(params)

    // istanbul ignore next; precautionary check, shouldn't occur
    if (cellRendererInstances.length === 0) {
      throw new Error(`Could not find detail toggle button cellRendererInstance with row id: ${rowId}`)
    }

    const cellRendererInstance = cellRendererInstances[0]

    // Note: there appears to be a bug with using gridApiRef.refreshCells() in that it doesn't update the row data params for the cell renderer
    // Thus, must manually refresh the button renderer with explicit params
    cellRendererInstance.refresh({
      data: { ...rowNode.data, [IS_OPEN_SYM]: toggledValue } as keyof ICellRendererParams,
    } as ICellRendererParams)
  }

  // istanbul ignore next; difficult to test through unit testing, better to test visually
  const onGridSizeChanged = () => {
    if (!gridApiRef.current) {
      throw new Error('GridApi is null.')
    }

    gridApiRef.current.sizeColumnsToFit()
  }

  const rowDataWithDetails = rowData.reduce<ExternalRow[]>((prevValue, currentValue) => {
    if (isDetailRowOpen(getRowNodeId(currentValue))) {
      prevValue.push({ ...currentValue, [IS_OPEN_SYM]: true })
      prevValue.push({ ...currentValue, [IS_DETAIL_SYM]: true })
    } else {
      prevValue.push(currentValue)
    }

    return prevValue
  }, [])

  return (
    <AgGridReact
      containerStyle={{ flex: 1, height: 'auto' }}
      frameworkComponents={{ detailButtonRenderer: DetailButtonRenderer }}
      rowData={rowDataWithDetails}
      columnDefs={[detailButtonColumnDef, ...columnDefs]}
      fullWidthCellRendererFramework={detailRowRenderer}
      getRowNodeId={(data: InternalRow) => {
        return isDetailRow(data) ? detailIdFromDataId(getRowNodeId(data)) : getRowNodeId(data)
      }}
      getRowHeight={(params: { node: { data: InternalRow; id: string } }) => {
        if (isDetailRow(params.node.data)) {
          return getDetailRowHeight(params.node.id, maxRowHeightMapRef.current)
        }
      }}
      isFullWidthCell={(rowNode: RowNode) => isDetailRow(rowNode.data)}
      onCellClicked={(event: CellClickedEvent) => {
        onCellClicked(event, toggleDetailRowOpen, actionColumnIdSuffix)
      }}
      onGridReady={onGridReady}
      onGridSizeChanged={onGridSizeChanged}
      immutableData={true}
      {...gridOptions}
    />
  )
}

export default forwardRef(AgGridWithDetails)
