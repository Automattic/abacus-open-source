import { createStyles, makeStyles, Theme, Tooltip } from '@material-ui/core'
import clsx from 'clsx'
import React from 'react'

import { Decision, Recommendation } from 'src/lib/recommendations'
import { ExperimentFull } from 'src/lib/schemas'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    tooltipped: {
      borderBottomWidth: 1,
      borderBottomStyle: 'dashed',
      borderBottomColor: theme.palette.grey[500],
    },
  }),
)

/**
 * Displays a Recommendation.
 */
export default function RecommendationDisplay({
  className,
  recommendation,
  experiment,
}: {
  className?: string
  recommendation: Recommendation
  experiment: ExperimentFull
}): JSX.Element {
  const classes = useStyles()
  switch (recommendation.decision) {
    case Decision.ManualAnalysisRequired:
      return (
        <Tooltip title='Contact @experimentation-review on #a8c-experiments'>
          <span className={clsx(className, classes.tooltipped)}>Manual analysis required</span>
        </Tooltip>
      )
    case Decision.MissingAnalysis:
      return <span className={className}>Not analyzed yet</span>
    case Decision.Inconclusive:
      return <span className={className}>Inconclusive</span>
    case Decision.DeployAnyVariation:
      return <span className={className}>Deploy either variation</span>
    case Decision.DeployChosenVariation: {
      const chosenVariation = experiment.variations.find(
        (variation) => variation.variationId === recommendation.chosenVariationId,
      )
      if (!chosenVariation) {
        throw new Error('No match for chosenVariationId among variations in experiment.')
      }

      return <span className={className}>Deploy {chosenVariation.name}</span>
    }
    default:
      throw new Error('Missing Decision.')
  }
}
