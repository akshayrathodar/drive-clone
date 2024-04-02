import { Component, OnInit } from '@angular/core';
import { Folder } from '@core/domain-classes/folder';
import { FolderService } from '@core/services/folder.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { BaseComponent } from 'src/app/base.component';

@Component({
  selector: 'app-category-list',
  templateUrl: './folder-list.component.html',
  styleUrls: ['./folder-list.component.scss'],
})
export class FolderListComponent extends BaseComponent implements OnInit {
  categories$: Observable<Folder[]>;
  constructor(
    private folderService: FolderService,
    private toastrService: ToastrService,
    private translationService: TranslationService
  ) {
    super();
  }
  ngOnInit(): void {
    this.getCategories();
  }

  getCategories(): void {
    this.categories$ = this.folderService.getAllFoldersAndFiles();
  }

  deleteFolder(id: string): void {
    this.folderService.delete(id).subscribe((d) => {
      this.toastrService.success(
        this.translationService.getValue(`CATEGORY_DELETED_SUCCESSFULLY`)
      );
      this.getCategories();
    });
  }

  manageCategory(): void {
    this.getCategories();
  }
}
