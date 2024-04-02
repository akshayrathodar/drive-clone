import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryRoutingModule } from './folder-routing.module';
import { FolderListComponent } from './folder-list/folder-list.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FolderListPresentationComponent } from './folder-list-presentation/Folder-list-presentation.component';
import { SharedModule } from '@shared/shared.module';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';


@NgModule({
  declarations: [
    FolderListComponent,
    FolderListPresentationComponent],
  imports: [
    CommonModule,
    CategoryRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    SharedModule
  ]
})
export class FolderModule { }
