import { useQuery } from "@tanstack/react-query";
import { signedPhotoUrls } from "@/features/devices/api/signed-photo-urls";
import { queryKeys } from "@/lib/queries/keys";

export function useSignedPhotoUrls(paths: string[]) {
  return useQuery({
    queryKey: queryKeys.storage.photoUrls(paths),
    queryFn: () => signedPhotoUrls(paths),
    enabled: paths.length > 0,
    staleTime: 50 * 60_000, // signed URLs live 60 min; refresh comfortably before expiry
  });
}
