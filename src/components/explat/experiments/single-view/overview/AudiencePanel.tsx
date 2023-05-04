import { Chip, createStyles, makeStyles, Paper, Toolbar, Tooltip, Typography } from '@material-ui/core'
import { TableCellProps } from '@material-ui/core/TableCell'
import _ from 'lodash'
import React, { useMemo } from 'react'

import SegmentsTable from 'src/components/explat/experiments/single-view/overview/SegmentsTable'
import VariationsTable from 'src/components/explat/experiments/single-view/overview/VariationsTable'
import LabelValueTable from 'src/components/general/LabelValueTable'
import { ExperimentFull, Segment, SegmentAssignment, SegmentType, TagBare } from 'src/lib/explat/schemas'
import theme from 'src/styles/theme'

/**
 * Resolves the segment ID of the segment assignment with the actual segment.
 * If the ID cannot be resolved, then an `Error` will be thrown.
 *
 * @param segmentAssignments - The segment assignments to be resolved.
 * @param segments - The segments to associate with the assignments.
 * @throws {Error} When unable to resolve a segment ID with one of the supplied
 *   segments.
 */
function resolveSegmentAssignments(
  segmentAssignments: SegmentAssignment[],
  segments: Segment[],
): {
  segment: Segment
  isExcluded: boolean
}[] {
  const segmentsById: { [segmentId: string]: Segment } = {}
  segments.forEach((segment) => (segmentsById[segment.segmentId] = segment))

  return segmentAssignments.map((segmentAssignment) => {
    const segment = segmentsById[segmentAssignment.segmentId]

    if (!segment) {
      throw Error(
        `Failed to lookup segment with ID ${segmentAssignment.segmentId} for assignment with ID ${segmentAssignment.segmentAssignmentId}.`,
      )
    }

    return {
      segment,
      isExcluded: segmentAssignment.isExcluded,
    }
  })
}

const useStyles = makeStyles(() =>
  createStyles({
    title: {
      flexGrow: 1,
    },
    monospace: {
      fontFamily: theme.custom.fonts.monospace,
    },
    audienceTable: {
      tableLayout: 'fixed',
      '& > tbody > tr > th': {
        width: '25%',
      },
    },
  }),
)

const eventStyles = makeStyles(() =>
  createStyles({
    entry: {
      display: 'block',
      fontFamily: theme.custom.fonts.monospace,
      color: 'gray',
    },
    eventName: {
      fontFamily: theme.custom.fonts.monospace,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: 'inline-block',
      maxWidth: '100%',
    },
    eventList: {
      '& p:not(:first-child)': {
        paddingTop: theme.spacing(2),
      },
      '& p': {
        paddingBottom: theme.spacing(2),
      },
      '& p:not(:last-child)': {
        borderBottom: '1px solid rgb(224,224,224)',
      },
    },
    monospace: {
      fontFamily: theme.custom.fonts.monospace,
    },
  }),
)

function ExposureEventsTable({ experiment: { exposureEvents } }: { experiment: ExperimentFull }) {
  const classes = eventStyles()

  return (
    <div className={classes.eventList}>
      {exposureEvents && exposureEvents.length ? (
        exposureEvents.map((ev) => (
          <Typography className={classes.monospace} key={ev.event}>
            <Tooltip title={ev.event}>
              <span className={classes.eventName}>{ev.event}</span>
            </Tooltip>
            {ev.props &&
              Object.entries(ev.props).map(([key, val]) => (
                <span key={key} className={classes.entry}>
                  <>
                    {key}: {val}
                  </>
                </span>
              ))}
          </Typography>
        ))
      ) : (
        <span className={classes.monospace}>No exposure events defined</span>
      )}
    </div>
  )
}

/**
 * Renders the audience information of an experiment in a panel component.
 *
 * @param experiment - The experiment with the audience information.
 * @param segments - The segments to look up (aka resolve) the segment IDs
 *   of the experiment's segment assignments.
 */
function AudiencePanel({
  className,
  experiment,
  segments,
  tags,
}: {
  className?: string
  experiment: ExperimentFull
  segments: Segment[]
  tags: TagBare[]
}): JSX.Element {
  const classes = useStyles()

  const segmentsByType = useMemo(
    () => _.groupBy(resolveSegmentAssignments(experiment.segmentAssignments, segments), _.property('segment.type')),
    [experiment.segmentAssignments, segments],
  )

  const exclusionGroupTags = (experiment.exclusionGroupTagIds ?? []).map((tagId) => {
    const tag = tags.find((tag) => tag.tagId === tagId)

    // istanbul ignore next
    if (tag === undefined) {
      throw new Error(`Can't find tag for exclusion group id: ${tagId}`)
    }

    return tag
  })

  const data = [
    { label: 'Platform', value: <span className={classes.monospace}>{experiment.platform}</span> },
    {
      label: 'User Type',
      value: (
        <span className={classes.monospace}>
          {experiment.existingUsersAllowed
            ? 'All users (new + existing + anonymous)'
            : 'Newly signed up users (being also logged in)'}
        </span>
      ),
    },
    {
      label: 'Variations',
      padding: 'none' as TableCellProps['padding'],
      value: <VariationsTable experiment={experiment} />,
    },
    {
      label: 'Segments',
      padding: 'none' as TableCellProps['padding'],
      value: (
        <>
          <SegmentsTable
            resolvedSegmentAssignments={segmentsByType[SegmentType.Locale] ?? []}
            type={SegmentType.Locale}
          />
          <SegmentsTable
            resolvedSegmentAssignments={segmentsByType[SegmentType.Country] ?? []}
            type={SegmentType.Country}
          />
        </>
      ),
    },
    {
      label: 'Exposure Events',
      value: <ExposureEventsTable experiment={experiment} />,
    },
  ]

  if (exclusionGroupTags.length > 0) {
    data.push({
      label: 'Exclusion Groups',
      value: (
        <>
          {exclusionGroupTags.map((tag) => (
            <React.Fragment key={tag.tagId}>
              <Chip label={tag.name} disabled />
              &nbsp;
            </React.Fragment>
          ))}
        </>
      ),
    })
  }

  return (
    <Paper className={className}>
      <Toolbar>
        <Typography className={classes.title} color='textPrimary' variant='h3'>
          Audience
        </Typography>
      </Toolbar>
      <LabelValueTable data={data} className={classes.audienceTable} />
    </Paper>
  )
}

export default AudiencePanel
