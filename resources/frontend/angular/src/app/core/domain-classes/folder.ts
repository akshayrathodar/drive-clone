// To parse this data:
//
//   import { Convert } from "./file";
//
//   const postCashTariffSearch = Convert.toPostCashTariffSearch(json);

export interface Folder {
  type: string;
  path: string;
  visibility: string;
  last_modified: number;
  extra_metadata: ExtraMetadata;
  file_size?: number;
  mime_type?: string;
}

export interface ExtraMetadata {
  id: string;
  name: string;
  virtual_path: string;
  display_path: string;
  dirname?: string;
  filename?: string;
  extension?: string;
}

// Converts JSON strings to/from your types
export class Convert {
  public static toFolder(json: string): Folder[] {
    return JSON.parse(json);
  }

  public static FolderToJson(value: Folder[]): string {
    return JSON.stringify(value);
  }
}
