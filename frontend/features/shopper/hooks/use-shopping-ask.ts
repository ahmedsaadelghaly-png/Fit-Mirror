import { useMutation } from "@tanstack/react-query";

import { askShoppingAssistant } from "@/api/shopper/shopping";

export function useShoppingAsk() {
  return useMutation({
    mutationFn: askShoppingAssistant,
  });
}
