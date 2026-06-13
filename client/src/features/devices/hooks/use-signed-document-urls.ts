import { useQuery } from "@tanstack/react-query";
import { signedDocumentUrls } from "@/features/devices/api/signed-document-urls";
import { queryKeys } from "@/lib/queries/keys";

export function useSignedDocumentUrls(paths: string[]) {
  return useQuery({
    queryKey: queryKeys.storage.documentUrls(paths),
    queryFn: () => signedDocumentUrls(paths),
    enabled: paths.length > 0,
    staleTime: 50 * 60_000,
  });
}
