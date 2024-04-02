import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonDialogService } from '@core/common-dialog/common-dialog.service';

import { FolderService } from '@core/services/folder.service';
import { TranslationService } from '@core/services/translation.service';
import { BaseComponent } from 'src/app/base.component';
import { ManageFolderComponent } from '../manage-folder/manage-folder.component';
import { Folder } from '@core/domain-classes/folder';

@Component({
  selector: 'app-category-list-presentation',
  templateUrl: './folder-list-presentation.component.html',
  styleUrls: ['./folder-list-presentation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class FolderListPresentationComponent extends BaseComponent {
  @Input() categories: Folder[];
  @Output() addEditCategoryHandler: EventEmitter<Folder> =
    new EventEmitter<Folder>();
  @Output() deleteCategoryHandler: EventEmitter<string> =
    new EventEmitter<string>();
  columnsToDisplay: string[] = ['subcategory', 'action', 'name'];
  subCategoryColumnToDisplay: string[] = ['action', 'name'];
  subCategories: Folder[] = [];
  expandedElement: Folder | null;
  constructor(
    private dialog: MatDialog,
    private commonDialogService: CommonDialogService,
    private cd: ChangeDetectorRef,
    private folderService: FolderService,
    private translationService: TranslationService
  ) {
    super();
  }

  toggleRow(element: Folder) {
    if (element == this.expandedElement) {
      this.expandedElement = null;
      this.cd.detectChanges();
      return;
    }
    this.subCategories = [];
    this.folderService.getSubCategories(element.extra_metadata.id).subscribe((subCat) => {
      this.subCategories = subCat;
      this.expandedElement = this.expandedElement === element ? null : element;
      this.cd.detectChanges();
    });
  }

  deleteCategory(category: Folder): void {
    this.sub$.sink = this.commonDialogService
      .deleteConformationDialog(
        `${this.translationService.getValue(
          'ARE_YOU_SURE_YOU_WANT_TO_DELETE'
        )} ${category.path}`
      )
      .subscribe((isTrue) => {
        if (isTrue) {
          this.deleteCategoryHandler.emit(category.extra_metadata.id);
        }
      });
  }

  manageFolder(category: Folder): void {
    const dialogRef = this.dialog.open(ManageFolderComponent, {
      width: '350px',
      data: Object.assign({}, category),
    });

    this.sub$.sink = dialogRef.afterClosed().subscribe((result: Folder) => {
      if (result) {
        this.addEditCategoryHandler.emit(result);
      }
    });
  }



}
