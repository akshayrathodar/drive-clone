import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { Folder } from '@core/domain-classes/folder';
import { CommonError } from '@core/error-handler/common-error';
import { CommonHttpErrorService } from '@core/error-handler/common-http-error.service';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class FolderService {
  constructor(
    private httpClient: HttpClient,
    private commonHttpErrorService: CommonHttpErrorService
  ) { }

  getAllFoldersAndFiles(): Observable<Folder[]> {
    const url = `drive-files`;
    return this.httpClient.get<Folder[]>(url);
  }

  delete(id: String) {
    const url = `drive/delete-file`;
    return this.httpClient.post<void>(url, { "id": id });
  }

  update(folder: Folder) {
    const url = `drive/rename-file`;
    return this.httpClient.post<Folder>(url, { "file_name": folder.path, "id": folder.extra_metadata.id });
  }

  add(name: String) {
    const url = 'drive/create-folder';
    return this.httpClient
      .post<Folder>(url, { "folder_name": name })
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getSubCategories(id: string) {
    const url = `drive/${id}`;
    var list = this.httpClient.get<Folder[]>(url);

    return list;
  }

  getAllCategoriesForDropDown() {
    const url = `folder/dropdown`;
    return this.httpClient.get<Folder[]>(url);
  }
  addDocument(document: DocumentInfo): Observable<DocumentInfo | CommonError> {
    document.documentMetaDatas = document.documentMetaDatas?.filter(
      (c) => c.metatag
    );
    const url = `drive/upload-file`;
    const formData = new FormData();
    formData.append('image', document.fileData);

    formData.append(
      'documentMetaDatas',
      JSON.stringify(document.documentMetaDatas)
    );
    formData.append(
      'documentRolePermissions',
      JSON.stringify(document.documentRolePermissions ?? [])
    );

    formData.append(
      'documentUserPermissions',
      JSON.stringify(document.documentUserPermissions ?? [])
    );

    return this.httpClient
      .post<DocumentInfo>(url, formData)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  deleteDocument(id: string): Observable<void | CommonError> {
    const url = `document/${id}`;
    return this.httpClient
      .delete<void>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getDocument(id: string): Observable<DocumentInfo | CommonError> {
    const url = `document/${id}`;
    return this.httpClient
      .get<DocumentInfo>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }


}
