import { createClient } from "@/lib/supabase/client";
import { DOCUMENT_BUCKET } from "./signed-document-urls";

export async function removeDocumentObject(path: string): Promise<void> {
  if (!path) return;
  const supabase = createClient();
  await supabase.storage.from(DOCUMENT_BUCKET).remove([path]);
}
