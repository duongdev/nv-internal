import {
  toast as $toast,
  type DefaultToastOptions,
  Toasts as RNToasts,
  type ToastOptions,
  ToastPosition,
  type ValueOrFunction,
} from '@backpackapp-io/react-native-toast'
import type { FC } from 'react'
import { FONT_FAMILY } from '@/lib/theme'

export { ToastPosition }

const DEFAULT_TOAST_OPTIONS: ToastOptions = {
  duration: 3000,
  position: ToastPosition.BOTTOM,
}

// const promise = <T>() => {}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    $toast.success(message, {
      ...DEFAULT_TOAST_OPTIONS,
      ...options,
    }),
  error: (message: string, options?: ToastOptions) =>
    $toast.error(message, {
      ...DEFAULT_TOAST_OPTIONS,
      ...options,
    }),
  loading: (message: string, options?: ToastOptions) =>
    $toast.loading(message, {
      ...DEFAULT_TOAST_OPTIONS,
      ...options,
    }),
  promise<T>(
    promise: Promise<T>,
    msgs: {
      loading: Element
      success: ValueOrFunction<Element, T>
      // biome-ignore lint/suspicious/noExplicitAny: <just any>
      error: ValueOrFunction<Element, any>
    },
    opts?: DefaultToastOptions,
  ) {
    return $toast.promise(promise, msgs, {
      ...DEFAULT_TOAST_OPTIONS,
      ...opts,
    })
  },
}

export type ToastsProps = (typeof RNToasts extends FC<infer P> ? P : never) & {
  isInModal?: boolean
}

export const Toasts: FC<ToastsProps> = ({ isInModal, ...props }) => {
  return (
    <RNToasts
      defaultStyle={{
        text: {
          fontFamily: FONT_FAMILY.regular,
        },
      }}
      extraInsets={{ top: isInModal ? -60 : 0, bottom: isInModal ? 64 : 0 }}
      providerKey={isInModal ? ':modal:' : undefined}
      {...props}
    />
  )
}
