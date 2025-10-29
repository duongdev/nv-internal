import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useEffect, useState } from 'react'
import { Platform, TextInput, type TextInputProps, View } from 'react-native'
import { cn } from '@/lib/utils'
import { Label } from './label'
import { Text } from './text'

interface CurrencyInputProps
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value?: number | null
  onValueChange?: (value: number | null) => void
  label?: string
  error?: string
  placeholder?: string
  /**
   * Use BottomSheetTextInput when this input is inside a BottomSheet
   * This ensures proper keyboard handling in bottom sheets
   */
  isInBottomSheet?: boolean
}

/**
 * Format number to currency string with thousand separators
 * Example: 1000000 → "1,000,000"
 */
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return ''
  }
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Parse currency string to number, removing thousand separators
 * Example: "1,000,000" → 1000000
 */
function parseCurrency(value: string): number | null {
  const cleaned = value.replace(/,/g, '')
  if (cleaned === '') {
    return null
  }
  const parsed = Number.parseInt(cleaned, 10)
  return Number.isNaN(parsed) ? null : parsed
}

/**
 * CurrencyInput Component
 * - Auto-format with thousand separators (1,000,000 VNĐ)
 * - Numeric keyboard on mobile
 * - VNĐ suffix display
 * - Integer-only (no decimals)
 * - Max 10 billion VND validation
 */
export function CurrencyInput({
  value,
  onValueChange,
  label,
  error,
  placeholder,
  className,
  editable = true,
  isInBottomSheet = false,
  ...props
}: CurrencyInputProps) {
  // Track the displayed string value (with formatting)
  const [displayValue, setDisplayValue] = useState(() =>
    formatCurrency(value ?? null),
  )

  // Sync displayValue when value prop changes externally
  // This ensures the input updates when parent state changes (e.g., clearing the value)
  useEffect(() => {
    setDisplayValue(formatCurrency(value ?? null))
  }, [value])

  // Use BottomSheetTextInput when inside a BottomSheet for proper keyboard handling
  const InputComponent = isInBottomSheet ? BottomSheetTextInput : TextInput

  const handleChangeText = (text: string) => {
    // Remove all non-digit characters except comma
    const cleanedText = text.replace(/[^\d,]/g, '')

    // Parse to number
    const numericValue = parseCurrency(cleanedText)

    // Validate max amount (10 billion VND)
    if (numericValue !== null && numericValue > 10_000_000_000) {
      return // Reject input that exceeds max
    }

    // Update display value with formatting
    setDisplayValue(formatCurrency(numericValue))

    // Call onValueChange with numeric value
    onValueChange?.(numericValue)
  }

  const handleBlur = () => {
    // Ensure formatting is correct on blur
    setDisplayValue(formatCurrency(value ?? null))
  }

  return (
    <View className="gap-1.5">
      {label && <Label nativeID={`${label}-label`}>{label}</Label>}
      <View className="relative">
        <InputComponent
          className={cn(
            'flex h-10 w-full min-w-0 flex-row items-center rounded-md border border-input bg-background px-3 py-1 pr-12 text-base text-foreground leading-5 sm:h-9 dark:bg-input/30',
            editable === false &&
              cn(
                'opacity-50',
                Platform.select({
                  web: 'disabled:pointer-events-none disabled:cursor-not-allowed',
                }),
              ),
            error && 'border-destructive',
            Platform.select({
              web: cn(
                'outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground md:text-sm',
                'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                error && 'ring-destructive/20 dark:ring-destructive/40',
              ),
              native: 'placeholder:text-muted-foreground/50',
            }),
            className,
          )}
          editable={editable}
          keyboardType="numeric"
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          value={displayValue}
          {...props}
        />
        {/* VNĐ Suffix */}
        <View className="absolute top-0 right-3 h-full items-center justify-center">
          <Text className="text-muted-foreground text-sm">VNĐ</Text>
        </View>
      </View>
      {error && (
        <Text className="text-destructive text-xs leading-tight">{error}</Text>
      )}
    </View>
  )
}

/**
 * Format currency for display with ₫ symbol
 * Uses Vietnamese number format (dots as thousand separators)
 * Example: formatCurrencyDisplay(1000000) → "1.000.000 ₫"
 */
export function formatCurrencyDisplay(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0 ₫'
  }
  return `${new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)} ₫`
}
