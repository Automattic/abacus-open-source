import { CellClickedEvent, GetRowNodeIdFunc, GridApi } from 'ag-grid-community'
import React from 'react'

import RowToggleButton from './RowToggleButton'

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
  maxRowHeightMap: Map<string, number>,
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
    maxRowHeightMap.set(detailIdFromDataId(getRowNodeId(data)), rowHeight)

    gridApiRef?.resetRowHeights()
    //gridApiRef?.redrawRows()
  }, 100)
}

export const isFullWidth = (data: Record<string, unknown> & { isDetail?: boolean }): boolean => data.isDetail === true

export const addDetailRow = (
  data: Record<string, unknown>,
  rowData: Record<string, unknown>[],
  getRowNodeId: GetRowNodeIdFunc,
): Record<string, unknown>[] => {
  const newMetrics = [...rowData]
  const index = newMetrics.findIndex((element) => getRowNodeId(element) === getRowNodeId(data))
  newMetrics.splice(index + 1, 0, { ...data, isDetail: true })
  return newMetrics
}

export const removeDetailRow = (
  data: Record<string, unknown>,
  rowData: Record<string, unknown>[],
  getRowNodeId: GetRowNodeIdFunc,
): Record<string, unknown>[] => {
  const newMetrics = [...rowData]
  const index = newMetrics.findIndex(
    (element) => getRowNodeId(element) === getRowNodeId(data) && element.isDetail === true,
  )

  // istanbul ignore next; trivial and shouldn't occur
  if (index >= 0) {
    newMetrics.splice(index, 1)
  }
  return newMetrics
}

export const toggleDetailRow = (
  data: Record<string, unknown>,
  rowData: Record<string, unknown>[],
  detailRowToggleMap: Map<string, boolean>,
  getRowNodeId: GetRowNodeIdFunc,
): Record<string, unknown>[] => {
  const detailRowExists = !!detailRowToggleMap.get(getRowNodeId(data))
  let newRows
  if (detailRowExists) {
    newRows = removeDetailRow(data, rowData, getRowNodeId)
  } else {
    newRows = addDetailRow(data, rowData, getRowNodeId)
  }

  detailRowToggleMap.set(getRowNodeId(data), !detailRowExists)
  return newRows
}

export const getRowHeight = (
  data: Record<string, unknown>,
  { maxRowHeightMap, getRowNodeId }: { maxRowHeightMap: Map<string, number>; getRowNodeId: GetRowNodeIdFunc },
): number | undefined | null => {
  if (isFullWidth(data)) {
    const result = maxRowHeightMap.get(detailIdFromDataId(getRowNodeId(data))) as number
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
    rowData,
    setRowData,
    detailRowToggleMap,
    maxRowHeightMap,
    getRowNodeId,
    actionColumnIdSuffix,
  }: {
    gridApiRef: GridApi | null
    rowData: Record<string, unknown>[]
    setRowData: (rowData: Record<string, unknown>[]) => void
    detailRowToggleMap: Map<string, boolean>
    maxRowHeightMap: Map<string, number>
    getRowNodeId: GetRowNodeIdFunc
    actionColumnIdSuffix?: string | undefined
  },
): void => {
  // Ignore clicks on cells with 'actions'
  if (actionColumnIdSuffix && event.column.getColId().endsWith(actionColumnIdSuffix)) {
    return
  }

  // istanbul ignore else
  if (!isFullWidth(event.data) && getRowNodeId && gridApiRef) {
    const target = event.event?.target as HTMLElement

    // Retrieve the HTML element of the detail toggle button
    const params = { columns: [DETAIL_TOGGLE_BUTTON_COLUMN_NAME], rowNodes: [event.node] }
    const instances = gridApiRef?.getCellRendererInstances(params)

    // istanbul ignore else
    if (instances.length > 0) {
      const instance = instances[0].getGui()
      const button = instance.firstElementChild

      // Toggle the detail row if the detail button was clicked
      if (target && (target === button || button?.contains(target))) {
        setRowData(toggleDetailRow(event.data, rowData, detailRowToggleMap, getRowNodeId))

        // istanbul ignore else
        if (detailRowToggleMap.get(getRowNodeId(event.data))) {
          setHeightOfFullWidthRow(1 + (event.rowIndex as number), event.data, maxRowHeightMap, gridApiRef, getRowNodeId)
        }
      }
      // Trigger the detail button if anything else in the row was clicked
      else {
        const element = instance.firstElementChild as HTMLElement
        element.click()
      }
    }
  }
}

export const DetailToggleButtonRenderer = ({
  data,
  getRowNodeId,
  detailRowToggleMap,
}: {
  data: Record<string, unknown>
  getRowNodeId: GetRowNodeIdFunc
  detailRowToggleMap: Map<string, boolean>
}): JSX.Element => {
  const toggled = !!detailRowToggleMap.get(getRowNodeId(data))

  return <RowToggleButton toggled={toggled} />
}
