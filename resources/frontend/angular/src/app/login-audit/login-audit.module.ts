import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginAuditListComponent } from './login-audit-list/login-audit-list.component';
import { MatSortModule } from '@angular/material/sort';
import { LoginAuditRoutingModule } from './login-audit-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { PipesModule } from '@shared/pipes/pipes.module';

@NgModule({
  declarations: [LoginAuditListComponent],
  imports: [
    CommonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatPaginatorModule,
    MatInputModule,
    LoginAuditRoutingModule,
    TranslateModule,
    PipesModule
  ],
})
export class LoginAuditModule {}
