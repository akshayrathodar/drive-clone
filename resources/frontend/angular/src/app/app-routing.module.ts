import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './layout/app-layout/main-layout/main-layout.component';
import { AuthGuard } from '@core/security/auth.guard';
import { MyProfileComponent } from './user/my-profile/my-profile.component';
import { AppComponent } from './app.component';
import { CompanyProfileResolver } from './company-profile/company-profile.resolver';

const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    resolve: { profile: CompanyProfileResolver },
    children: [
      {
        path: 'login',
        loadChildren: () =>
          import('./login/login.module').then((m) => m.LoginModule),
      },
      {
        path: '',
        component: LayoutComponent,
        children: [
          {
            path: '',
            canLoad: [AuthGuard],
            loadChildren: () =>
              import('./document-library/document-library.module').then(
                (m) => m.DocumentLibraryModule
              ),
          },
          {
            path: 'my-profile',
            component: MyProfileComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'dashboard',
            canLoad: [AuthGuard],
            loadChildren: () =>
              import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
          },
          {
            path: 'pages',
            canLoad: [AuthGuard],
            loadChildren: () =>
              import('./page/page.module').then((m) => m.PageModule),
          },
          {
            path: 'roles',
            canLoad: [AuthGuard],
            loadChildren: () =>
              import('./role/role.module').then((m) => m.RoleModule),
          },
          {
            path: 'users',
            canLoad: [AuthGuard],
            loadChildren: () =>
              import('./user/user.module').then((m) => m.UserModule),
          },
          {
            path: 'categories',
            canLoad: [AuthGuard],
            loadChildren: () =>
              import('./category/category.module').then((m) => m.CategoryModule),
          },
          {
            path: 'documents',
            canLoad: [AuthGuard],
            loadChildren: () =>
              import('./document/document.module').then((m) => m.DocumentModule),
          },
          {
            path: 'document-audit-trails',
            canLoad: [AuthGuard],
            loadChildren: () =>
              import('./document-audit-trail/document-audit-trail.module').then(
                (m) => m.DocumentAuditTrailModule
              ),
          },
          {
            path: 'login-audit',
            canLoad: [AuthGuard],
            loadChildren: () =>
              import('./login-audit/login-audit.module').then(
                (m) => m.LoginAuditModule
              ),
          },
          {
            path: 'notifications',
            canLoad: [AuthGuard],
            loadChildren: () =>
              import('./notification/notification.module').then(
                (m) => m.NotificationModule
              ),
          },
          {
            path: 'reminders',
            loadChildren: () =>
              import('./reminder/reminder.module').then((m) => m.ReminderModule),
          },
          {
            path: 'email-smtp',
            loadChildren: () =>
              import('./email-smtp-setting/email-smtp-setting.module').then(
                (m) => m.EmailSmtpSettingModule
              ),
          },
          {
            path: 'company-profile',
            loadChildren: () =>
              import('./company-profile/company-profile.module').then(
                (m) => m.CompanyProfileModule
              ),
          },
          {
            path: 'languages',
            loadChildren: () =>
              import('./languages/languages.module').then((m) => m.LanguagesModule),
          },
          {
            path: '**',
            redirectTo: '/',
          },
        ],
      }]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'top',
      useHash: false,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
