import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Event, Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { CompanyProfile } from '@core/domain-classes/company-profile';
import { SecurityService } from '@core/security/security.service';
import { TranslationService } from '@core/services/translation.service';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  currentUrl!: string;
  constructor(public _router: Router,
    public translate: TranslateService,
    private translationService: TranslationService,
    private route: ActivatedRoute,
    private securityService: SecurityService,
    private titleService: Title) {
    this.setProfile();
    this.companyProfileSubscription();
    translate.addLangs(['en']);
    translate.setDefaultLang('en');
    this.setLanguage();

    this._router.events.subscribe((routerEvent: Event) => {
      if (routerEvent instanceof NavigationStart) {
        this.currentUrl = routerEvent.url.substring(
          routerEvent.url.lastIndexOf('/') + 1
        );
      }
      if (routerEvent instanceof NavigationEnd) {
        /* empty */
      }
      window.scrollTo(0, 0);
    });
  }

  setProfile() {
    this.route.data.subscribe((data: { profile: CompanyProfile }) => {
      if (data.profile) {
        this.securityService.updateProfile(data.profile);
      }
    });
  }

  companyProfileSubscription() {
    this.securityService.companyProfile.subscribe((profile) => {
      if (profile) {
        this.titleService.setTitle(profile.title);
      }
    });
  }

  setLanguage() {
    const currentLang = this.translationService.getSelectedLanguage();
    if (currentLang) {
      this.translationService
        .setLanguage(currentLang)
        .subscribe(() => { });
    } else {
      const browserLang = this.translate.getBrowserLang();
      const lang = browserLang.match(/en|es|ar|ru|cn|ja|ko|fr/)
        ? browserLang
        : 'en';
      this.translationService
        .setLanguage(lang)
        .subscribe(() => { });
    }
  }
}
