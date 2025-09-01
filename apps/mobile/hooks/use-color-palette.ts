import { useColorScheme } from 'nativewind'
import { type ColorKey, THEME } from '@/lib/theme'

// import { FeatureFlag, useFeatureFlag } from './use-feature-flag'

type GetColorOptions = {
  alpha?: number
}

/**
 * Not able to use feature flag in burndown-chart somehow
 */
export function useColorPalette() {
  const { colorScheme } = useColorScheme()
  // const isDynamicColorPaletteEnabled = useFeatureFlag(
  //   FeatureFlag.DynamicColorPalette,
  // )

  const colorPalette =
    // isDynamicColorPaletteEnabled ? preferredPalette : Palette.Default
    // biome-ignore lint/suspicious/noExplicitAny: <just any>
    THEME[colorScheme ?? 'light'] as any

  const getColor = (colorKey: ColorKey, options?: GetColorOptions) => {
    const { alpha = 1 } = options ?? {}
    return `hsla(${colorPalette[colorKey]?.replaceAll(' ', ', ')}, ${alpha})`
  }

  return {
    colorPalette,
    getColor,
  }
}
