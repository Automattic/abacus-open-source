import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'

import { makeStyles, useTheme } from '@material-ui/core'
import { GetQuickFilterTextParams } from 'ag-grid-community'
import React from 'react'

import { Metric } from 'src/lib/schemas'

import GridContainer from '../general/GridContainer'
import {
  AssignMetricButtonRenderer,
  Data,
  MetricDetailRenderer,
  MetricEditButtonRenderer,
  MetricNameRenderer,
  WizardMetricDetailRenderer,
} from './MetricsTableAgGrid.utils'

const useStyles = makeStyles({
  noLeftPadding: {
    paddingLeft: '0 !important',
  },
})

const ACTION_COLUMN_SUFFIX = '--actions'

/**
 * Renders a table of metrics information with a detail row component.
 */
const MetricsTableAgGrid = ({
  title,
  metrics,
  onEditMetric,
  onAssignMetric,
}: {
  title?: string
  metrics: Metric[]
  onEditMetric?: (metricId: number) => void
  onAssignMetric?: (data: Metric) => void
}): JSX.Element => {
  const theme = useTheme()
  const classes = useStyles()

  const paramsGetQuickFilterText = (params: GetQuickFilterTextParams) => {
    return JSON.stringify(params.value, null, 4)
  }

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      lineHeight: '15px',
      paddingTop: '8px',
      paddingBottom: '8px',
      fontFamily: theme.custom.fonts.monospace,
    },
    wrapText: true,
    autoHeight: true,
  }

  const columnDefs = [
    {
      headerName: 'Name',
      headerClass: classes.noLeftPadding,
      field: 'name',
      cellStyle: {
        fontFamily: theme.custom.fonts.monospace,
        fontWeight: theme.custom.fontWeights.monospaceBold,
        paddingLeft: 0,
      },
      cellRendererFramework: ({ value: name }: { value: string }) => <MetricNameRenderer name={name} />,
      width: 465,
    },
    {
      headerName: 'Description',
      field: 'description',
      cellStyle: {
        fontSize: '12px',
        lineHeight: '15px',
        wordBreak: 'normal',
      },
      width: 550,
    },
    {
      headerName: 'Parameter Type',
      field: 'parameterType',
      hide: !!onAssignMetric,
      width: 200,
    },
    {
      // hidden field to allow searching
      headerName: 'EventParams',
      field: 'eventParams',
      hide: true,
      getQuickFilterText: paramsGetQuickFilterText,
    },
    {
      // hidden field to allow searching
      headerName: 'RevenueParams',
      field: 'revenueParams',
      hide: true,
      getQuickFilterText: paramsGetQuickFilterText,
    },
    // trick for conditionally including this element
    ...(onEditMetric
      ? [
          {
            headerName: 'Actions',
            field: `metrics-edit${ACTION_COLUMN_SUFFIX}`,
            sortable: false,
            filter: false,
            resizable: false,
            cellStyle: {
              display: 'flex',
              justifyContent: 'center',
              color: 'rgba(0, 0, 0, 0.5)',
              paddingLeft: 0,
              paddingRight: 0,
            },
            cellRendererFramework: ({ data }: { data: Metric }) => (
              <MetricEditButtonRenderer data={data} onEditMetric={onEditMetric} />
            ),
            width: 100,
            minWidth: 54,
          },
        ]
      : []),
    ...(onAssignMetric
      ? [
          {
            headerName: 'Actions',
            field: `metrics-assign${ACTION_COLUMN_SUFFIX}`,
            sortable: false,
            filter: false,
            resizable: false,
            cellStyle: {
              justifyContent: 'center',
              padding: '10px 4px',
            },
            cellRendererFramework: ({ data }: { data: Metric }) => (
              <AssignMetricButtonRenderer data={data} onAssignMetric={onAssignMetric} />
            ),
            width: 150,
            minWidth: 150,
          },
        ]
      : []),
  ]

  const getRowNodeId = (data: Metric) => {
    return data.name
  }

  return (
    <GridContainer
      title={title}
      search
      rowData={metrics as Data[]}
      defaultColDef={defaultColDef}
      columnDefs={columnDefs}
      getRowNodeId={getRowNodeId}
      detailRowRenderer={onAssignMetric ? WizardMetricDetailRenderer : MetricDetailRenderer}
      actionColumnIdSuffix={ACTION_COLUMN_SUFFIX}
      defaultSortColumnId='name'
    />
  )
}

export default MetricsTableAgGrid
