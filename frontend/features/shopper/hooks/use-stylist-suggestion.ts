import { useMutation } from "@tanstack/react-query";

import { requestStylistSuggestion } from "@/api/shopper/stylist";

export function useStylistSuggestion() {
  return useMutation({
    mutationFn: requestStylistSuggestion,
  });
}
