import { NgModule } from '@angular/core';
import { CompanyProfileComponent } from './company-profile.component';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/security/auth.guard';
import { CompanyProfileResolver } from './company-profile.resolver';

const routes: Routes = [
  {
    path: '',
    component: CompanyProfileComponent,
    data: { claimType: 'SETTING_MANAGE_PROFILE' },
    canActivate: [AuthGuard],
    resolve: {
      profile: CompanyProfileResolver
    },
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompanyProfileRoutingModule { }
