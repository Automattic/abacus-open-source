import { CellClickedEvent, GetRowNodeIdFunc, GridApi, ICellRendererParams } from 'ag-grid-community'
import React from 'react'

import RotatingToggleButton from './RotatingToggleButton'

export const DETAIL_TOGGLE_BUTTON_COLUMN_NAME = '__detail-button-col__'
const DETAIL_ID_SUFFIX = '-detail'

export const detailIdFromDataId = (dataId: string): string => {
  return `${dataId}${DETAIL_ID_SUFFIX}`
}

// Dynamically adjust the height of a detail row to fit.
// Currently, setting autoHeight to true fails if using a fullWidthRow renderer.
// Adapted solution from https://github.com/ag-grid/ag-grid/issues/3160#issuecomment-562024900
export const setHeightOfFullWidthRow = (
  rowIndex: number,
  data: Record<string, unknown>,
  maxRowHeightMap: Record<string, number>,
  gridApiRef: GridApi | null,
  getRowNodeId: GetRowNodeIdFunc,
): void => {
  // Add a timeout to ensure the grid rows are rendered
  setTimeout(() => {
    const fullWidthRows = [...document.getElementsByClassName('ag-full-width-row')]

    const found = fullWidthRows.find((row: Element) => {
      const rowChild = row.firstElementChild
      // istanbul ignore next; trivial and shouldn't occur
      if (!rowChild) {
        return false
      }

      const key = 'row-index'
      // istanbul ignore next; trivial and shouldn't occur
      if (!(key in row.attributes)) {
        return false
      }

      const thisRowIndexAttr = row.attributes[key as keyof typeof row.attributes] as Attr
      const thisRowIndex = parseInt(thisRowIndexAttr.value)
      return thisRowIndex === rowIndex
    })

    // istanbul ignore next; trivial and shouldn't occur
    if (!found || !found.firstElementChild) {
      return
    }

    const rowChild = found.firstElementChild
    const rowHeight = rowChild.clientHeight
    maxRowHeightMap[detailIdFromDataId(getRowNodeId(data))] = rowHeight

    gridApiRef?.resetRowHeights()
    //gridApiRef?.redrawRows()
  }, 100)
}

export const isFullWidth = (data: Record<string, unknown> & { isDetail?: boolean }): boolean => data.isDetail === true

export const getRowHeight = (
  data: Record<string, unknown>,
  { maxRowHeightMap, getRowNodeId }: { maxRowHeightMap: Record<string, number>; getRowNodeId: GetRowNodeIdFunc },
): number | undefined | null => {
  if (isFullWidth(data)) {
    const result = maxRowHeightMap[detailIdFromDataId(getRowNodeId(data))]
    if (typeof result === 'undefined') {
      // a barely visible height as it renders so we can load the true height
      return 1
    } else {
      return result
    }
  }
}

export const onCellClicked = (
  event: CellClickedEvent,
  {
    gridApiRef,
    detailRowToggleMap,
    setDetailRowToggleMap,
    maxRowHeightMap,
    getRowNodeId,
    actionColumnIdSuffix,
  }: {
    gridApiRef: GridApi | null
    detailRowToggleMap: Record<string, boolean>
    setDetailRowToggleMap: (map: Record<string, boolean>) => void
    maxRowHeightMap: Record<string, number>
    getRowNodeId: GetRowNodeIdFunc
    actionColumnIdSuffix?: string | undefined
  },
): void => {
  // istanbul ignore next; trivial
  if (!gridApiRef || isFullWidth(event.data)) {
    return
  }

  // Ignore clicks on cells with 'actions'
  if (actionColumnIdSuffix && event.column.getColId().endsWith(actionColumnIdSuffix)) {
    return
  }

  // Retrieve the HTML element of the detail toggle button
  const target = event.event?.target as HTMLElement
  const params = { columns: [DETAIL_TOGGLE_BUTTON_COLUMN_NAME], rowNodes: [event.node] }
  const instances = gridApiRef?.getCellRendererInstances(params)

  // istanbul ignore next; precautionary check, shouldn't occur
  if (instances.length === 0) {
    return
  }

  const instance = instances[0]
  const instanceGui = instance.getGui()
  const element = instanceGui.firstElementChild as HTMLElement

  // Toggle the detail row if the detail button was clicked
  if (target && (target === element || element?.contains(target))) {
    const rowId = getRowNodeId(event.data)
    const toggledValue = !detailRowToggleMap[rowId]
    setDetailRowToggleMap({
      ...detailRowToggleMap,
      [rowId]: toggledValue,
    })

    if (toggledValue) {
      setHeightOfFullWidthRow(1 + (event.rowIndex as number), event.data, maxRowHeightMap, gridApiRef, getRowNodeId)
    }

    // Note: there appears to be a bug with using gridApiRef.refreshCells() in that it doesn't update the row data params for the cell renderer
    // Thus, must manually refresh the button renderer with explicit params
    instance.refresh({
      data: { ...event.data, isOpen: toggledValue } as keyof ICellRendererParams,
    } as ICellRendererParams)
  }
  // Trigger the detail button if anything else in the row was clicked
  else {
    element.click()
  }
}

export const getRowDataWithDetails = (
  rowData: Record<string, unknown>[],
  detailRowToggleMap: Record<string, boolean>,
  getRowNodeId: GetRowNodeIdFunc,
): Record<string, unknown>[] => {
  const detailRows = rowData
    .filter((row) => {
      return detailRowToggleMap[getRowNodeId(row)]
    })
    .map((row) => {
      return { ...row, isDetail: true }
    })
  const toggledRows = rowData.map((row) => {
    if (detailRowToggleMap[getRowNodeId(row)]) {
      return { ...row, isOpen: true }
    } else {
      return row
    }
  })

  return [...toggledRows, ...detailRows]
}

export const DetailButtonRenderer = ({ data }: { data: Record<string, unknown> }): JSX.Element => {
  const toggled = !!data.isOpen
  return <RotatingToggleButton isOpen={toggled} />
}
