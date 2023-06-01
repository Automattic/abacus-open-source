import { grey, red } from '@material-ui/core/colors'
import { createTheme } from '@material-ui/core/styles'
import React from 'react'

declare module '@material-ui/core/styles/createPalette' {
  interface TypeBackground {
    error: React.CSSProperties['color']
    warning: React.CSSProperties['color']
    neutral: React.CSSProperties['color']
    inactionableYellow: React.CSSProperties['color']
    actionableGreen: React.CSSProperties['color']
    pre: React.CSSProperties['color']
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Palette {
    disabled: Palette['primary']
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PaletteOptions {
    disabled: PaletteOptions['primary']
  }
}

declare module '@material-ui/core/styles' {
  interface ThemeOptions {
    custom: {
      fonts: Record<string, React.CSSProperties['fontFamily']>
      fontWeights: Record<string, React.CSSProperties['fontWeight']>
    }
  }
  interface Theme {
    custom: {
      fonts: Record<string, React.CSSProperties['fontFamily']>
      fontWeights: Record<string, React.CSSProperties['fontWeight']>
    }
  }
}

const headingDefaults = {
  fontWeight: 500,
  lineHeight: 1.2,
}

const monospaceFontStack = `'Roboto Mono', monospace`

// The base theme is used to provide defaults for other themes to depend on.
// Idea came from
// https://stackoverflow.com/questions/47977618/accessing-previous-theme-variables-in-createmuitheme.
const baseTheme = createTheme()

const theme = createTheme({
  overrides: {
    MuiInputBase: {
      root: {
        fontFamily: monospaceFontStack,

        // Removes spinners from number inputs
        // From: https://stackoverflow.com/a/4298216
        '& input::-webkit-outer-spin-button, input::-webkit-inner-spin-button': {
          '-webkit-appearance': 'none',
          margin: 0,
        },
        '& input[type=number]': {
          '-moz-appearance': 'textfield',
        },
      },
    },
    MuiCssBaseline: {
      '@global': {
        // Remove the last table cell border of a top-level MuiTable when in MuiPaper.
        // Otherwise the paper's border butts up with the last table cell's border.
        // Note: The child combinators are required to avoid selecting nested tables.
        '.MuiPaper-root > .MuiTable-root > .MuiTableBody-root > .MuiTableRow-root:last-child > .MuiTableCell-root': {
          borderBottom: '0',
        },
        // Remove the last table cell border when in a nested MuiTable. Otherwise the parent
        // table's cell's border butts up with the nested table's last cell border.
        // Note: Only interested in removing the table cell border from the table body and
        // not from the table head.
        // Note: This is a known issue and is scheduled to be addressed in MUI v5. See
        // https://github.com/mui-org/material-ui/pull/20809.
        '.MuiTable-root .MuiTable-root .MuiTableBody-root .MuiTableRow-root:last-child > .MuiTableCell-root': {
          borderBottom: '0',
        },
      },
    },
    MuiContainer: {
      root: {
        // Make the padding smaller at narrow window sizes.
        [baseTheme.breakpoints.down('xs')]: {
          paddingLeft: baseTheme.spacing(1),
          paddingRight: baseTheme.spacing(1),
        },
      },
    },
    MuiTableCell: {
      head: {
        fontWeight: 700,
      },
      root: {
        paddingLeft: baseTheme.spacing(3),
        paddingRight: baseTheme.spacing(3),
        // Make the padding smaller at narrow window sizes.
        [baseTheme.breakpoints.down('xs')]: {
          padding: baseTheme.spacing(1),
        },
      },
    },
  },
  palette: {
    background: {
      warning: '#fedb9d',
      error: red[100],
      inactionableYellow: '#fcb900',
      actionableGreen: '#00d084',
      neutral: grey[200],
      pre: '#f5f5f5',
    },
    primary: {
      main: '#194661',
    },
    secondary: {
      main: '#2e7d32',
      light: '#60ad5e',
      dark: '#005005',
    },
    disabled: {
      main: '#828282',
    },
  },
  typography: {
    h1: {
      ...headingDefaults,
      fontSize: '2.25rem',
    },
    h2: {
      ...headingDefaults,
      fontSize: '2rem',
    },
    h3: {
      ...headingDefaults,
      fontSize: '1.75rem',
    },
    h4: {
      ...headingDefaults,
      fontSize: '1.5rem',
    },
    h5: {
      ...headingDefaults,
      fontSize: '1.25rem',
    },
    h6: {
      ...headingDefaults,
      fontSize: '1rem',
    },
  },
  custom: {
    fonts: {
      monospace: monospaceFontStack,
    },
    fontWeights: {
      monospaceBold: 700,
    },
  },
})

export default theme
