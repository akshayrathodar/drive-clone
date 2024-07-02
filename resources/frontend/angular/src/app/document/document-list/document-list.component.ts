import { SelectionModel } from '@angular/cdk/collections';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CommonDialogService } from '@core/common-dialog/common-dialog.service';
import { Category } from '@core/domain-classes/category';
import { DocumentAuditTrail } from '@core/domain-classes/document-audit-trail';
import { DocumentCategory } from '@core/domain-classes/document-category';
import { ResponseHeader } from '@core/domain-classes/document-header';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { DocumentOperation } from '@core/domain-classes/document-operation';
import { DocumentResource } from '@core/domain-classes/document-resource';
import { DocumentView } from '@core/domain-classes/document-view';
import { DocumentVersion } from '@core/domain-classes/documentVersion';
import { CategoryService } from '@core/services/category.service';
import { ClonerService } from '@core/services/clone.service';
import { CommonService } from '@core/services/common.service';
import { TranslationService } from '@core/services/translation.service';
import { BasePreviewComponent } from '@shared/base-preview/base-preview.component';
import { OverlayPanel } from '@shared/overlay-panel/overlay-panel.service';
import { ToastrService } from 'ngx-toastr';
import { fromEvent, merge, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/base.component';
import { DocumentCommentComponent } from '../document-comment/document-comment.component';
import { DocumentEditComponent } from '../document-edit/document-edit.component';
import { DocumentPermissionListComponent } from '../document-permission/document-permission-list/document-permission-list.component';
import { DocumentPermissionMultipleComponent } from '../document-permission/document-permission-multiple/document-permission-multiple.component';
import { DocumentReminderComponent } from '../document-reminder/document-reminder.component';
import { DocumentUploadNewVersionComponent } from '../document-upload-new-version/document-upload-new-version.component';
import { DocumentVersionHistoryComponent } from '../document-version-history/document-version-history.component';
import { DocumentService } from '../document.service';
import { SendEmailComponent } from '../send-email/send-email.component';
import { DocumentDataSource } from './document-datasource';
import { FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { P } from '@angular/cdk/keycodes';
import { RenameFolderComponent } from './dialogs/rename-folder/rename-folder.component';
import { environment } from '@environments/environment';
// import { ManageFolderComponent } from 'src/app/folder/manage-folder/manage-folder.component';

@Component({
  selector: 'app-document-list',
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.scss'],
  viewProviders: [DatePipe],
})
export class DocumentListComponent
  extends BaseComponent
  implements OnInit, AfterViewInit {
  dataSource: DocumentDataSource;
  data = [];
  documents: DocumentInfo[] = [];
  displayedColumns: string[] = [
    'select',
    'action',
    'name',
    'categoryName',
    'createdDate',
    'createdBy',
  ];
  isLoadingResults = true;
  documentResource: DocumentResource;
  categories: Category[] = [];
  allCategories: Category[] = [];
  loading$: Observable<boolean>;
  currentId = null;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('input') input: ElementRef;
  @ViewChild('metatag') metatag: ElementRef;

  createdDate = new FormControl('');

  selection = new SelectionModel<DocumentInfo>(true, []);
  max = new Date();
  breadcrumbs = [];
  totalFiles = 0;
  currentUploadedFiles = 0;
  folderprocessing = false;
  totalProgress = 0;
  @ViewChild('file') btnupload: ElementRef;
  @ViewChild('folderupld') folderUpload: ElementRef;

  constructor(
    private documentService: DocumentService,
    private commonDialogService: CommonDialogService,
    private categoryService: CategoryService,
    private dialog: MatDialog,
    public overlay: OverlayPanel,
    public clonerService: ClonerService,
    private translationService: TranslationService,
    private commonService: CommonService,
    private toastrService: ToastrService,
    private datePipe: DatePipe,
    private route: ActivatedRoute,
    private router: Router
  ) {
    super();
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.documentResource = new DocumentResource();
    this.documentResource.pageSize = 10;
    this.documentResource.orderBy = 'createdDate desc';
    this.route.params.subscribe((param: any) => {
      if (param.id) {
        this.currentId = param.id;
      }
    });
  }

  ngOnInit(): void {
    this.dataSource = new DocumentDataSource(this.documentService);
    this.dataSource.documentsSubject.subscribe((data) => {
      this.data = data;
    });
    this.dataSource.loadDocuments(this.documentResource, this.currentId);
    this.getCategories();
    this.getBreadCrumbs();
    this.getResourceParameter();
    this.injectScript('https://cdn.jsdelivr.net/npm/resumablejs@1.1.0/resumable.min.js')
		.then(() => { console.log('Script loaded!'); this.setupResumable(); })
		.catch(error => { console.log(error); });
  }

  setupResumable() {
    const token = localStorage.getItem('bearerToken');
    const baseUrl = environment.apiUrl;

    const resumable = new Resumable({
      target: baseUrl + 'api/document',
      headers: {
        'Authorization': 'Bearer ' + token,
      },
      query: {
        type : "file",
        id : this.currentId ? this.currentId : ""
      },
      // chunkSize: 10*1024*1024, // default is 1*1024*1024, this should be less than your maximum limit in php.ini
      testChunks: false,
      simulataneousUploads : 100,
      throttleProgressCallbacks: 1
    },);

    resumable.assignBrowse(this.btnupload.nativeElement);

    let totalFile = [];

    resumable.on('fileAdded', (e) => { // trigger when file picked
      totalFile.push(e);

      this.folderprocessing = true;
      this.currentUploadedFiles = 0;
      this.totalFiles = totalFile.length;

      resumable.upload() // to actually start uploading.
    });

    resumable.on('fileSuccess', () => {
      this.currentUploadedFiles ++;

      this.totalProgress = (this.currentUploadedFiles*100)/this.totalFiles;

      if (this.currentUploadedFiles == this.totalFiles) {
        this.toastrService.success("File Uploaded Successfully.");
        this.dataSource.loadDocuments(this.documentResource, this.currentId);
        this.folderprocessing = false;
        this.currentUploadedFiles = 0;
        this.totalFiles = 0;
        this.totalProgress = 0;
        totalFile = [];
      }
    });

    resumable.on('fileError', (file,response) => { // trigger when there is any error
        this.toastrService.error(JSON.parse(response).error);
        this.folderprocessing = false;
        this.totalFiles = 0;
        this.totalProgress = 0;
        totalFile = [];
    });

    const resumableFolder = new Resumable({
        target: baseUrl + 'api/document',
        headers: {
          'Authorization': 'Bearer ' + token,
        },
        query: {
          type : "folder",
          id : this.currentId ? this.currentId : ""
        },
        // chunkSize: 10*1024*1024, // default is 1*1024*1024, this should be less than your maximum limit in php.ini
        testChunks: false,
        simulataneousUploads : 100,
        throttleProgressCallbacks: 1
    },);

    resumableFolder.assignBrowse(this.folderUpload.nativeElement,true);

    resumableFolder.files.length = 0;

    let totalFolderFiles = [];

    resumableFolder.on('fileAdded',(e) =>  { // trigger when file picked
        totalFolderFiles.push(e);

        this.folderprocessing = true;
        this.currentUploadedFiles = 0;
        this.totalFiles = totalFolderFiles.length;

        resumableFolder.upload() // to actually start uploading.
    });

    resumableFolder.on('fileSuccess', () => { // trigger when file upload complete
        this.currentUploadedFiles ++;

        this.totalProgress = (this.currentUploadedFiles*100)/this.totalFiles;

        if (this.currentUploadedFiles == this.totalFiles) {
          this.toastrService.success("Folder Uploaded Successfully.");
          this.dataSource.loadDocuments(this.documentResource, this.currentId);
          this.folderprocessing = false;
          this.currentUploadedFiles = 0;
          this.totalFiles = 0;
          this.totalProgress = 0;
          totalFolderFiles = [];
        }
    });

    resumableFolder.on('fileError', (file,response) => { // trigger when there is any error
        this.toastrService.error(JSON.parse(response).error);
        this.folderprocessing = false;
        this.totalFiles = 0;
        this.totalProgress = 0;
        totalFolderFiles = [];
    });

  }

  injectScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = src;
      script.addEventListener('load', resolve);
      script.addEventListener('error', () => reject('Error loading script.'));
      script.addEventListener('abort', () => reject('Script loading aborted.'));
      document.head.appendChild(script);
    });
  }

  getBreadCrumbs() {
    this.categoryService.getBreadCrumbs(this.currentId).subscribe((c) => {
      if (!Array.isArray(c)) {
        this.breadcrumbs = [c];
      } else {
        this.breadcrumbs = c;
      }
    });
  }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

    this.sub$.sink = merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap((c: any) => {
          this.documentResource.skip =
            this.paginator.pageIndex * this.paginator.pageSize;
          this.documentResource.pageSize = this.paginator.pageSize;
          this.documentResource.orderBy =
            this.sort.active + ' ' + this.sort.direction;
          this.dataSource.loadDocuments(this.documentResource);
          this.selection.clear();
        })
      )
      .subscribe();

    this.sub$.sink = fromEvent(this.input.nativeElement, 'keyup')
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        tap(() => {
          this.paginator.pageIndex = 0;
          this.documentResource.skip = 0;
          this.documentResource.name = this.input.nativeElement.value;
          this.dataSource.loadDocuments(this.documentResource);
          this.selection.clear();
        })
      )
      .subscribe();

    this.sub$.sink = fromEvent(this.metatag.nativeElement, 'keyup')
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        tap(() => {
          this.paginator.pageIndex = 0;
          this.documentResource.skip = 0;
          this.documentResource.metaTags = this.metatag.nativeElement.value;
          this.dataSource.loadDocuments(this.documentResource);
        })
      )
      .subscribe();
    this.sub$.sink = this.createdDate.valueChanges
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        tap((value: any) => {
          this.paginator.pageIndex = 0;
          this.documentResource.skip = 0;
          if (value) {
            this.documentResource.createDate = new Date(value).toISOString();
          } else {
            this.documentResource.createDate = null;
          }
          this.documentResource.skip = 0;
          this.dataSource.loadDocuments(this.documentResource);
        })
      )
      .subscribe();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }
  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  onCategoryChange(filtervalue: any) {
    if (filtervalue.value) {
      this.documentResource.categoryId = filtervalue.value;
    } else {
      this.documentResource.categoryId = '';
    }
    this.documentResource.skip = 0;
    this.dataSource.loadDocuments(this.documentResource);
  }

  getCategories(): void {
    this.categoryService.getAllCategoriesForDropDown().subscribe((c) => {
      this.categories = [...c];
      this.setDeafLevel();
    });
  }

  setDeafLevel(parent?: Category, parentId?: string) {
    const children = this.categories.filter((c) => c.parentId == parentId);
    if (children.length > 0) {
      children.map((c, index) => {
        c.deafLevel = parent ? parent.deafLevel + 1 : 0;
        c.index =
          (parent ? parent.index : 0) + index * Math.pow(0.1, c.deafLevel);
        this.allCategories.push(c);
        this.setDeafLevel(c, c.id);
      });
    }
    return parent;
  }

  getResourceParameter() {
    this.sub$.sink = this.dataSource.responseHeaderSubject$.subscribe(
      (c: ResponseHeader) => {
        if (c) {
          this.documentResource.pageSize = c.pageSize;
          this.documentResource.skip = c.skip;
          this.documentResource.totalCount = c.totalCount;
        }
      }
    );
  }

  deleteDocument(document: DocumentInfo) {
    this.sub$.sink = this.commonDialogService
      .deleteConformationDialog(
        `${this.translationService.getValue(
          'ARE_YOU_SURE_YOU_WANT_TO_DELETE'
        )} ${document.name}`
      )
      .subscribe((isTrue: boolean) => {
        if (isTrue) {
          this.sub$.sink = this.documentService
            .deleteDocument(document.id)
            .subscribe(() => {
              this.addDocumentTrail(
                document.id,
                DocumentOperation.Deleted.toString()
              );
              this.toastrService.success(
                this.translationService.getValue(
                  'DOCUMENT_DELETED_SUCCESSFULLY'
                )
              );
              this.dataSource.loadDocuments(this.documentResource, this.currentId);
            });
        }
      });
  }

  getDocuments(): void {
    this.isLoadingResults = true;

    this.sub$.sink = this.documentService
      .getDocuments(this.documentResource)
      .subscribe(
        (resp: HttpResponse<DocumentInfo[]>) => {
          const paginationParam = JSON.parse(
            resp.headers.get('X-Pagination')
          ) as ResponseHeader;
          this.documentResource.pageSize = paginationParam.pageSize;
          this.documentResource.skip = paginationParam.skip;
          this.documents = [...resp.body];
          this.isLoadingResults = false;
        },
        () => (this.isLoadingResults = false)
      );
  }

  editDocument(documentInfo: DocumentInfo) {
    const documentCategories: DocumentCategory = {
      document: documentInfo,
      categories: this.categories,
    };
    const dialogRef = this.dialog.open(DocumentEditComponent, {
      width: '600px',
      data: Object.assign({}, documentCategories),
    });

    this.sub$.sink = dialogRef.afterClosed().subscribe((result: string) => {
      if (result === 'loaded') {
        this.dataSource.loadDocuments(this.documentResource);
      }
    });
  }

  addComment(document: Document) {
    const dialogRef = this.dialog.open(DocumentCommentComponent, {
      width: '800px',
      maxHeight: '70vh',
      data: Object.assign({}, document),
    });

    this.sub$.sink = dialogRef.afterClosed().subscribe((result: string) => {
      if (result === 'loaded') {
        this.dataSource.loadDocuments(this.documentResource);
      }
    });
  }

  manageDocumentPermission(documentInfo: DocumentInfo) {
    this.dialog.open(DocumentPermissionListComponent, {
      data: documentInfo,
      width: '80vw',
      height: '80vh',
    });
  }
  onSharedSelectDocument() {
    const dialogRef = this.dialog.open(DocumentPermissionMultipleComponent, {
      data: this.selection.selected,
      width: '80vw',
      height: '80vh',
    });
    this.sub$.sink = dialogRef.afterClosed().subscribe((result: boolean) => {
      this.selection.clear();
    });
  }

  uploadNewVersion(document: Document) {
    const dialogRef = this.dialog.open(DocumentUploadNewVersionComponent, {
      width: '800px',
      maxHeight: '70vh',
      data: Object.assign({}, document),
    });

    this.sub$.sink = dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.dataSource.loadDocuments(this.documentResource);
      }
    });
  }

  downloadDocument(documentInfo: DocumentInfo) {
    this.sub$.sink = this.commonService
      .downloadDocument(documentInfo.id, false)
      .subscribe(
        (event) => {
          if (event.type === HttpEventType.Response) {
            this.addDocumentTrail(
              documentInfo.id,
              DocumentOperation.Download.toString()
            );
            this.downloadFile(event, documentInfo);
          }
        },
        (error) => {
          this.toastrService.error(
            this.translationService.getValue('ERROR_WHILE_DOWNLOADING_DOCUMENT')
          );
        }
      );
  }

  addDocumentTrail(id: string, operation: string) {
    const objDocumentAuditTrail: DocumentAuditTrail = {
      documentId: id,
      operationName: operation,
    };
    this.sub$.sink = this.commonService
      .addDocumentAuditTrail(objDocumentAuditTrail)
      .subscribe();
  }

  sendEmail(documentInfo: DocumentInfo) {
    this.dialog.open(SendEmailComponent, {
      data: documentInfo,
      width: '80vw',
      height: '80vh',
    });
  }

  addReminder(documentInfo: DocumentInfo) {
    this.dialog.open(DocumentReminderComponent, {
      data: documentInfo,
      width: '80vw',
      height: '80vh',
    });
  }

  onDocumentView(document: DocumentInfo) {
    const urls = document.name.split('.');
    const extension = urls[1];
    const documentView: DocumentView = {
      documentId: document.id,
      name: document.name,
      extension: extension,
      isRestricted: document.isAllowDownload,
      isVersion: false,
      isFromPreview: true,
    };
    this.overlay.open(BasePreviewComponent, {
      position: 'center',
      origin: 'global',
      panelClass: ['file-preview-overlay-container', 'white-background'],
      data: documentView,
    });
  }

  private downloadFile(data: HttpResponse<Blob>, documentInfo: DocumentInfo) {
    const downloadedFile = new Blob([data.body], { type: data.body.type });
    const a = document.createElement('a');
    a.setAttribute('style', 'display:none;');
    document.body.appendChild(a);
    a.download = documentInfo.name;
    a.href = URL.createObjectURL(downloadedFile);
    a.target = '_blank';
    a.click();
    document.body.removeChild(a);
  }

  onVersionHistoryClick(document: DocumentInfo): void {
    const documentInfo = this.clonerService.deepClone<DocumentInfo>(document);
    this.sub$.sink = this.documentService
      .getDocumentVersion(document.id)
      .subscribe((documentVersions: DocumentVersion[]) => {
        documentInfo.documentVersions = documentVersions;
        const dialogRef = this.dialog.open(DocumentVersionHistoryComponent, {
          width: '800px',
          maxHeight: '70vh',
          panelClass: 'full-width-dialog',
          data: Object.assign({}, documentInfo),
        });
        dialogRef.afterClosed().subscribe((isRestore: boolean) => {
          if (isRestore) {
            this.dataSource.loadDocuments(this.documentResource);
          }
        });
      });
  }

  uploadFolder(event) {
    // WILL REMOVE AFTER CHUNK UPLOAD
    // return;
    if (event.target.files.length == 0) {
      console.log("No file selected!");
      return
    }
    // console.log(event.target.files);

    let file: File = event.target.files;
    let foldername = file[0].webkitRelativePath.split("/")[0];
    let path = [];
    this.folderprocessing = true;
    const baseUrl = environment.apiUrl;
    const token = localStorage.getItem('bearerToken');

    Object.keys(file).forEach((key) => {
      const payload = new FormData();
      if (this.currentId) {
        payload.append("id", this.currentId);
      }
      payload.append("type", "folder");
      payload.append("files", file[key]);
      payload.append("path", file[key]['webkitRelativePath']);

      // this.currentUploadedFiles = 0;
      // this.totalFiles = Object.keys(file).length;
      // this.documentService.uploadFolder(payload).subscribe((data: any) => {
      //   this.currentUploadedFiles++;
      //   this.totalProgress = (this.currentUploadedFiles * 100) / this.totalFiles;
      //   if (this.currentUploadedFiles == this.totalFiles) {
      //     this.toastrService.success("Folder Uploaded Successfully.");
      //     this.dataSource.loadDocuments(this.documentResource, this.currentId);
      //     this.folderprocessing = false;
      //     this.currentUploadedFiles = 0;
      //     this.totalFiles = 0;
      //     this.totalProgress = 0;
      //   }
      // })

    })

  }

  onElementClick(element) {
    if (element.type == "folder") {
      this.router.navigate(['/documents/folder/' + element.id]);
    }
  }

  addDocument() {
    if (this.currentId) {
      this.router.navigate(['/documents/add/' + this.currentId]);
    } else {
      this.router.navigate(['/documents/add/']);
    }
  }

  onCrumbClick(crumb: any) {
    let selectedpath = crumb.path;
    this.breadcrumbs = [];
    if (selectedpath === 'home') {
      this.router.navigate(['/documents/']);
    } else {
      this.router.navigate(['/documents/folder/' + crumb.path]);
    }
    // if (selectedcrumbindex != -1) {
    //   this.driveService.setBreadCrumb(currentCrumb.filter((item, i) => !(i > selectedcrumbindex)));
    //   this.breadcrumbs = currentCrumb.filter((item, i) => !(i > selectedcrumbindex));
    // }
  }

  onRenameFolderClick(document: any) {
    const dialogRef = this.dialog.open(RenameFolderComponent, {
      data: {folder: document.name},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(result);
      if (result && result !== document.name) {
        let payload = {folderId: document.id,foldername: result};
        this.documentService.renameFolder(payload).subscribe((data: any) => {
          this.toastrService.success(data.success);
          this.dataSource.loadDocuments(this.documentResource, this.currentId);
        })
      } else {
        this.toastrService.error(`No changes in Folder Name ${document.name}.`);
      }
      //this.animal = result;
    });
  }

  onDeleteFolder(document: any) {
    this.documentService.deleteFolder({folderId: document.id}).subscribe((data: any) => {
      this.toastrService.success(data.success);
      this.dataSource.loadDocuments(this.documentResource, this.currentId);
    })
  }

}
