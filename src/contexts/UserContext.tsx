import { useSnackbar } from 'notistack'
import React, { useContext } from 'react'
import * as yup from 'yup'

import { wpRestV1Wretcher } from 'src/api/utils'
import { useDataLoadingError, useDataSource } from 'src/utils/data-loading'

const WpUserSchema = yup
  .object({
    username: yup.string().defined(),
  })
  .defined()
type WpUser = yup.InferType<typeof WpUserSchema>

async function fetchCurrentUser(): Promise<WpUser> {
  return wpRestV1Wretcher.url('/me').get()
}

const UserContext = React.createContext<WpUser | null>(null)

export function UserContextProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const { data, isLoading, error } = useDataSource(fetchCurrentUser, [])
  useDataLoadingError(error, 'User')
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const snackbarKey = 'loading-user-data'
  if (isLoading) {
    enqueueSnackbar('Fetching user data...', { key: snackbarKey })
  } else {
    closeSnackbar(snackbarKey)
  }

  return <UserContext.Provider value={data}>{children}</UserContext.Provider>
}

const reviewerUsernames = [
  // ExPlat
  'scjr',
  'aaronmyan',

  // Reviewers in training
  'isaacsung',
  'isatuncman',
  'ngdeb',
  'jswrks',
  'n1ranjan',
  'kr213',
]

export function useUserPermissions(): { isReviewer: () => boolean } {
  const user = useContext(UserContext)

  return {
    isReviewer: () => !!user && reviewerUsernames.includes(user.username),
  }
}
