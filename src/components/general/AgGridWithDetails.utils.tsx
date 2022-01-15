import { CellClickedEvent, GridApi } from 'ag-grid-community'
import React from 'react'

import RotatingToggleButton from './RotatingToggleButton'

export const DETAIL_TOGGLE_BUTTON_COLUMN_NAME = '__detail-button-col__'
const DETAIL_ID_SUFFIX = '-detail'

export const IS_DETAIL_SYM = Symbol('AgGridWithDetails-isDetail')
export const IS_OPEN_SYM = Symbol('AgGridWithDetails-isOpen')
export type ExternalRow = Record<string, unknown>
export type InternalRow = ExternalRow & {
  [IS_DETAIL_SYM]: boolean
  [IS_OPEN_SYM]: boolean
}

export const detailIdFromDataId = (dataId: string): string => {
  return `${dataId}${DETAIL_ID_SUFFIX}`
}

// Dynamically adjust the height of a detail row to fit.
// Currently, setting autoHeight to true fails if using a fullWidthRow renderer.
// Adapted solution from https://github.com/ag-grid/ag-grid/issues/3160#issuecomment-562024900
export const setHeightOfFullWidthRow = (
  rowIndex: number,
  rowId: string,
  maxRowHeightMap: Record<string, number>,
  gridApiRef: GridApi | null,
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

    // istanbul ignore next; row just might not be loaded yet
    if (!found || !found.firstElementChild) {
      return
    }

    const rowChild = found.firstElementChild
    const rowHeight = rowChild.clientHeight
    // istanbul ignore else; difficult to get jest to recognize this branch
    if (maxRowHeightMap[detailIdFromDataId(rowId)] !== rowHeight) {
      maxRowHeightMap[detailIdFromDataId(rowId)] = rowHeight
      gridApiRef?.resetRowHeights()
      gridApiRef?.redrawRows()
    }
  }, 100)
}
export const isDetailRow = (data: InternalRow): boolean => !!data[IS_DETAIL_SYM]

export const getDetailRowHeight = (
  rowId: string,
  maxRowHeightMap: Record<string, number>,
): number | undefined | null => {
  const result = maxRowHeightMap[rowId]
  if (typeof result === 'undefined') {
    // a barely visible height as it renders so we can load the true height
    return 1
  } else {
    return result
  }
}

export const onCellClicked = (
  event: CellClickedEvent,
  toggleDetailRowOpen: (rowId: string) => void,
  actionColumnIdSuffix?: string | undefined,
): void => {
  // istanbul ignore next; trivial
  if (isDetailRow(event.data)) {
    return
  }

  // Ignore clicks on cells with 'actions'
  if (actionColumnIdSuffix && event.column.getColId().endsWith(actionColumnIdSuffix)) {
    return
  }

  // Toggle the detail row
  const rowId = event.node.id as string
  toggleDetailRowOpen(rowId)
}

export const DetailButtonRenderer = ({ data }: { data: InternalRow }): JSX.Element => {
  const toggled = !!data[IS_OPEN_SYM]
  return <RotatingToggleButton isOpen={toggled} />
}
