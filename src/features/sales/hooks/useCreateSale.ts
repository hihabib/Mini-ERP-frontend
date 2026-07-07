import { useMutation } from '@tanstack/react-query'

import { createSale } from '../api'

export function useCreateSale() {
  return useMutation({
    mutationFn: createSale,
  })
}
