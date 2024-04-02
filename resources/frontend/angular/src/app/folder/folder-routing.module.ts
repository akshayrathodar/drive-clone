import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@core/security/auth.guard';
import { FolderListComponent } from './folder-list/folder-list.component';

const routes: Routes = [
  {
    path: '',
    component: FolderListComponent,
    data: { claimType: 'DOCUMENT_CATEGORY_MANAGE_DOCUMENT_CATEGORY' },
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CategoryRoutingModule { }
