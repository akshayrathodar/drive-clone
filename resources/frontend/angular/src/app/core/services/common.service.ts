import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpEvent,
  HttpParams,
  HttpResponse,
} from '@angular/common/http';
import { CommonError } from '@core/error-handler/common-error';
import { CommonHttpErrorService } from '@core/error-handler/common-http-error.service';
import { Observable, of } from 'rxjs';
import { User } from '@core/domain-classes/user';
import { catchError } from 'rxjs/operators';
import { Role } from '@core/domain-classes/role';
import { DocumentAuditTrail } from '@core/domain-classes/document-audit-trail';
import {
  reminderFrequencies,
  ReminderFrequency,
} from '@core/domain-classes/reminder-frequency';
import { ReminderResourceParameter } from '@core/domain-classes/reminder-resource-parameter';
import { Reminder } from '@core/domain-classes/reminder';

@Injectable({ providedIn: 'root' })
export class CommonService {
  constructor(
    private httpClient: HttpClient,
    private commonHttpErrorService: CommonHttpErrorService
  ) { }

  getUsers(): Observable<User[] | CommonError> {
    const url = `user`;
    return this.httpClient
      .get<User[]>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getUsersForDropdown(): Observable<User[] | CommonError> {
    const url = `user-dropdown`;
    return this.httpClient
      .get<User[]>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getRoles(): Observable<Role[] | CommonError> {
    const url = `role`;
    return this.httpClient
      .get<Role[]>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getRolesForDropdown(): Observable<Role[] | CommonError> {
    const url = 'role-dropdown';
    return this.httpClient
      .get<Role[]>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getMyReminder(id: string): Observable<Reminder | CommonError> {
    const url = `reminder/${id}/myreminder`;
    return this.httpClient
      .get<Reminder>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  getReminder(id: string): Observable<Reminder | CommonError> {
    const url = `reminder/${id}`;
    return this.httpClient
      .get<Reminder>(url)
      .pipe(catchError(this.commonHttpErrorService.handleError));
  }

  addDocumentAuditTrail(
    documentAuditTrail: DocumentAuditTrail
  ): Observable<DocumentAuditTrail | CommonError> {
    const url = `documentAuditTrail`;
    return this.httpClient
      .post<DocumentAuditTrail>(url, documentAuditTrail)
      .pipe(catchError(this.commonHttpErrorService.handleError));
    //return this.httpClient.post<DocumentAuditTrail>('documentAuditTrail',documentAuditTrail);
  }

  downloadDocument(
    documentId: string,
    isVersion: boolean
  ): Observable<HttpEvent<Blob>> {
    const url = `document/${documentId}/download/${isVersion} `;
    return this.httpClient.get(url, {
      reportProgress: true,
      observe: 'events',
      responseType: 'blob',
    });
  }

  isDownloadFlag(
    documentId: string,
    isPermission: boolean
  ): Observable<boolean> {
    const url = `document/${documentId}/isDownloadFlag/isPermission/${isPermission}`;
    return this.httpClient.get<boolean>(url);
  }

  getDocumentToken(documentId: string): Observable<{ [key: string]: string }> {
    const url = `documentToken/${documentId}/token`;
    return this.httpClient.get<{ [key: string]: string }>(url);
  }

  deleteDocumentToken(token: string): Observable<boolean> {
    const url = `documentToken/${token}`;
    return this.httpClient.delete<boolean>(url);
  }

  readDocument(
    documentId: string,
    isVersion: boolean
  ): Observable<{ [key: string]: string[] } | CommonError> {
    const url = `document/${documentId}/readText/${isVersion}`;
    return this.httpClient.get<{ [key: string]: string[] }>(url);
  }

  getReminderFrequency(): Observable<ReminderFrequency[]> {
    return of(reminderFrequencies);
  }

  getAllRemindersForCurrentUser(
    resourceParams: ReminderResourceParameter
  ): Observable<HttpResponse<Reminder[]>> {
    const url = 'reminder/all/currentuser';
    const customParams = new HttpParams()
      .set('fields', resourceParams.fields ? resourceParams.fields : '')
      .set('orderBy', resourceParams.orderBy ? resourceParams.orderBy : '')
      .set('pageSize', resourceParams.pageSize.toString())
      .set('skip', resourceParams.skip.toString())
      .set(
        'searchQuery',
        resourceParams.searchQuery ? resourceParams.searchQuery : ''
      )
      .set('subject', resourceParams.subject ? resourceParams.subject : '')
      .set('message', resourceParams.message ? resourceParams.message : '')
      .set(
        'frequency',
        resourceParams.frequency ? resourceParams.frequency : ''
      );

    return this.httpClient.get<Reminder[]>(url, {
      params: customParams,
      observe: 'response',
    });
  }

  deleteReminderCurrentUser(reminderId: string): Observable<boolean> {
    const url = `reminder/currentuser/${reminderId}`;
    return this.httpClient.delete<boolean>(url);
  }
}
