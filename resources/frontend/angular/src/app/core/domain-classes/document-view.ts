export interface DocumentView {
  documentId: string;
  isRestricted: boolean;
  extension: string;
  name: string;
  isVersion: boolean;
  isFromPreview?:boolean;
  id?: string;
}
