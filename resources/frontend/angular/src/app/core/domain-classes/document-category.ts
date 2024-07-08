import { Category } from './category';
import { DocumentInfo } from './document-info';

export interface DocumentCategory {
  document: DocumentInfo;
  folder_id?: any;
  categories: Category[];
}
