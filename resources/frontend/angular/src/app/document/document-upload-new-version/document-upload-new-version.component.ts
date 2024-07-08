import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, Inject, OnInit ,ElementRef , ViewChild } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DocumentVersion } from '@core/domain-classes/documentVersion';
import { FileInfo } from '@core/domain-classes/file-info';
import { TranslationService } from '@core/services/translation.service';
import { environment } from '@environments/environment';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from 'src/app/base.component';
import { DocumentService } from '../document.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-document-upload-new-version',
  templateUrl: './document-upload-new-version.component.html',
  styleUrls: ['./document-upload-new-version.component.scss'],
})
export class DocumentUploadNewVersionComponent
  extends BaseComponent
  implements OnInit
{
  documentForm: UntypedFormGroup;
  extension = '';
  isFileUpload = false;
  resumable = null;
  showProgress = false;
  progress = 0;
  fileInfo: FileInfo;
  fileData: any;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('input') input: ElementRef;
  @ViewChild('metatag') metatag: ElementRef;
  @ViewChild('file') btnupload: ElementRef;

  constructor(
    private fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private httpClient: HttpClient,
    private cd: ChangeDetectorRef,
    private dialogRef: MatDialogRef<DocumentUploadNewVersionComponent>,
    private documentService: DocumentService,
    private toastrService: ToastrService,
    private router: Router,
    private route: ActivatedRoute,
    private translationService: TranslationService
  ) {
    super();
  }

  ngOnInit(): void {
    this.createDocumentForm();
    this.injectScript('https://cdn.jsdelivr.net/npm/resumablejs@1.1.0/resumable.min.js')
		.then(() => { console.log('Script loaded!'); this.setupResumable(); })
		.catch(error => { console.log(error); });
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

  setupResumable() {
    const token = localStorage.getItem('bearerToken');
    const baseUrl = environment.apiUrl;

    this.resumable = new Resumable({
      target: baseUrl + 'api/documentversion',
      headers: {
        'Authorization': 'Bearer ' + token,
      },
      // chunkSize: 10*1024*1024, // default is 1*1024*1024, this should be less than your maximum limit in php.ini
      testChunks: false,
      simulataneousUploads : 100,
      throttleProgressCallbacks: 1
    },);

    this.resumable.assignBrowse(this.btnupload.nativeElement);

    this.resumable.on('fileAdded', (e) => {
      this.upload([e.file]);
    })

  }

  createDocumentForm() {
    this.documentForm = this.fb.group({
      url: [''],
      extension: ['', [Validators.required]],
    });
  }

  upload(files) {
    if (files.length === 0) return;
    this.extension = files[0].name.split('.').pop();
    this.showProgress = true;
    if (!this.fileExtesionValidation(this.extension)) {
      this.fileUploadExtensionValidation('');
      this.showProgress = false;
      this.cd.markForCheck();
      return;
    } else {
      this.fileUploadExtensionValidation('valid');
    }
    this.fileData = files[0];
    this.isFileUpload = true;

    document.getElementById("selectedFileName").innerHTML = files[0].name;
  }

  fileUploadValidation(fileName: string) {
    this.documentForm.patchValue({
      url: fileName,
    });
    this.documentForm.get('url').markAsTouched();
    this.documentForm.updateValueAndValidity();
  }

  fileUploadExtensionValidation(extension: string) {
    this.documentForm.patchValue({
      extension: extension,
    });
    this.documentForm.get('extension').markAsTouched();
    this.documentForm.updateValueAndValidity();
  }

  fileExtesionValidation(extesion: string): boolean {
    const allowExtesions = environment.allowExtesions;
    const allowTypeExtenstion = allowExtesions.find((c) =>
      c.extentions.find((ext) => ext === extesion)
    );
    return allowTypeExtenstion ? true : false;
  }

  SaveDocument() {

    if (this.documentForm.invalid) {
      this.documentForm.markAllAsTouched();
      return;
    }

    const documentversion: DocumentVersion = {
      documentId: this.data.id,
      url: this.fileData.fileName,
      fileData: this.fileData,
      extension: this.extension,
      resumable: this.resumable,
    };

    if (documentversion.resumable) {

        const resumable = this.documentService.saveNewVersionDocument(documentversion);

        documentversion.resumable.on('fileSuccess', (file,response) => {
          this.toastrService.success(
            this.translationService.getValue('DOCUMENT_SAVE_SUCCESSFULLY')
          );
          this.dialogRef.close(true);
        })

    }else{

      this.sub$.sink = this.documentService
        .saveNewVersionDocument(documentversion)
        .subscribe(() => {
          this.toastrService.success(
            this.translationService.getValue('DOCUMENT_SAVE_SUCCESSFULLY')
          );
          this.dialogRef.close(true);
        });

    }

  }

  closeDialog() {
    this.dialogRef.close(false);
  }
}
