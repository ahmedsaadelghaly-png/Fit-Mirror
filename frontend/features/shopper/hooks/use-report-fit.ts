import { useMutation } from "@tanstack/react-query";

import { reportFit } from "@/api/shopper/sizing";

export function useReportFit() {
  return useMutation({ mutationFn: reportFit });
}
