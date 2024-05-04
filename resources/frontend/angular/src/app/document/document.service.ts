import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { DocumentResource } from '@core/domain-classes/document-resource';
import { DocumentVersion } from '@core/domain-classes/documentVersion';
import { CommonError } from '@core/error-handler/common-error';
import { CommonHttpErrorService } from '@core/error-handler/common-http-error.service';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  constructor(
    private httpClient: HttpClient,
    private commonHttpErrorService: CommonHttpErrorService
  ) { }

  updateDocument(
    document: DocumentInfo
  ): Observable<DocumentInfo | CommonError> {
    document.documentMetaDatas = document.documentMetaDatas?.filter(
      (c) => c.metatag
    );

    const url = `document/${document.id}`;
    return this.httpClient
      .put<DocumentInfo>(url, document)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  addDocument(document: DocumentInfo): Observable<DocumentInfo | CommonError> {
    document.documentMetaDatas = document.documentMetaDatas?.filter(
      (c) => c.metatag
    );
    const url = `document`;
    const formData = new FormData();
    formData.append('uploadFile', document.fileData);
    formData.append('name', document.name);
    formData.append('categoryId', document.categoryId);
    formData.append('categoryName', document.categoryName);
    formData.append('description', document.description);
    // formData.append('isAllowDownload', document.isAllowDownload.toString());
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

    if (document.folder_id) {
      formData.append('folder_id', document.folder_id);
    }
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

  getDocuments(
    resource: DocumentResource,
    folderID?: any
  ): Observable<HttpResponse<DocumentInfo[]> | CommonError> {
    const url = 'documents';
    const customParams = new HttpParams()
      .set('fields', resource.fields)
      .set('orderBy', resource.orderBy)
      .set(
        'createDateString',
        resource.createDate ? resource.createDate.toString() : ''
      )
      .set('pageSize', resource.pageSize.toString())
      .set('skip', resource.skip.toString())
      .set('searchQuery', resource.searchQuery)
      .set('categoryId', resource.categoryId)
      .set('name', resource.name)
      .set('metaTags', resource.metaTags)
      .set('id', folderID ? folderID : resource.id.toString());

    return this.httpClient
      .get<DocumentInfo[]>(url, {
        params: customParams,
        observe: 'response',
      })
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  saveNewVersionDocument(document): Observable<DocumentInfo | CommonError> {
    const url = `documentversion`;
    const formData = new FormData();
    formData.append('uploadFile', document.fileData);
    formData.append('documentId', document.documentId);
    return this.httpClient
      .post<DocumentInfo>(url, formData)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getDocumentVersion(id: string) {
    const url = `documentversion/${id}`;
    return this.httpClient
      .get<DocumentVersion[]>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  restoreDocumentVersion(id: string, versionId: string) {
    const url = `documentversion/${id}/restore/${versionId}`;
    return this.httpClient
      .post<boolean>(url, {})
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getdocumentMetadataById(id: string) {
    const url = `document/${id}/getMetatag`;
    return this.httpClient
      .get(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  uploadFolder(payload): Observable<DocumentInfo | CommonError> {
    const url = 'document';
  
    return this.httpClient
      .post<DocumentInfo>(url, payload)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  renameFolder(payload): Observable<DocumentInfo | CommonError> {
    const url = 'document/rename-folder/' + payload.folderId;
    const formData = new FormData();
    formData.append('name', payload.foldername);

    return this.httpClient
      .post<DocumentInfo>(url, formData)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  deleteFolder(payload): Observable<DocumentInfo | CommonError> {
    const url = 'document/folder/delete/' + payload.folderId;

    return this.httpClient
      .post<DocumentInfo>(url, {})
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

}
