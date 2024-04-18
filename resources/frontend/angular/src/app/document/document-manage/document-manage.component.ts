import { Component } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { BaseComponent } from 'src/app/base.component';
import { DocumentService } from '../document.service';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentAuditTrail } from '@core/domain-classes/document-audit-trail';
import { DocumentOperation } from '@core/domain-classes/document-operation';
import { CommonService } from '@core/services/common.service';
import { TranslationService } from '@core/services/translation.service';

@Component({
  selector: 'app-document-manage',
  templateUrl: './document-manage.component.html',
  styleUrls: ['./document-manage.component.scss'],
})
export class DocumentManageComponent extends BaseComponent {
  documentForm: UntypedFormGroup;
  loading$: Observable<boolean>;
  documentSource: string;
  isLoading = false;
  folderId = null;

  constructor(
    private toastrService: ToastrService,
    private documentService: DocumentService,
    private router: Router,
    private route: ActivatedRoute,
    private commonService: CommonService,
    private translationService: TranslationService
  ) {
    super();
    this.route.params.subscribe((param: any) => {
      if (param.id) {
        this.folderId = param.id;
      }
    })
  }

  saveDocument(document: DocumentInfo) {
    this.isLoading = true;
    if (this.folderId) {
      document.folder_id = this.folderId;
    }
    this.sub$.sink = this.documentService.addDocument(document).subscribe(
      (documentInfo: DocumentInfo) => {
        this.isLoading = false;
        this.addDocumentTrail(documentInfo);
        this.toastrService.success(
          this.translationService.getValue('DOCUMENT_SAVE_SUCCESSFULLY')
        );
      },
      () => (this.isLoading = false)
    );
  }
  addDocumentTrail(id) {
    const objDocumentAuditTrail: DocumentAuditTrail = {
      documentId: id,
      operationName: DocumentOperation.Created.toString(),
    };
    this.sub$.sink = this.commonService
      .addDocumentAuditTrail(objDocumentAuditTrail)
      .subscribe((c) => {
        if (this.folderId) {
          this.router.navigate(['/documents/folder/'+ this.folderId]);
        } else {
          this.router.navigate(['/documents']);
        }
      });
  }
}
