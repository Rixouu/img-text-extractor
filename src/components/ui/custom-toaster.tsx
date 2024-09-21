"use client"

import { Toast, ToastProvider, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { X } from 'lucide-react'

export function CustomToaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props} 
            className="bg-gray-700 text-white border-gray-600 rounded-lg shadow-lg custom-toast-enter w-auto"
          >
            <div className="flex items-start justify-between">
              <div className="pr-8">
                {title && <div className="font-semibold">{title}</div>}
                {description && <div className="text-sm mt-1 text-gray-200">{description}</div>}
              </div>
              <button 
                type="button"
                onClick={() => props.onOpenChange?.(false)}
                aria-label="Close notification"
                className="text-gray-300 hover:text-white transition-colors absolute right-2 top-2"
              >
                <X size={16} />
              </button>
            </div>
            {action}
          </Toast>
        )
      })}
      <ToastViewport className="p-4 md:p-6 lg:p-8 fixed top-0 right-0 flex flex-col gap-2 w-full max-w-sm" />
    </ToastProvider>
  )
}