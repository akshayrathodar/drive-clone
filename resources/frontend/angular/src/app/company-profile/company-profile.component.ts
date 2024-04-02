import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyProfile } from '@core/domain-classes/company-profile';
import { SecurityService } from '@core/security/security.service';
import { CommonService } from '@core/services/common.service';
import { TranslationService } from '@core/services/translation.service';
import { environment } from '@environments/environment';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from '../base.component';
import { CompanyProfileService } from './company-profile.service';

@Component({
  selector: 'app-company-profile',
  templateUrl: './company-profile.component.html',
  styleUrls: ['./company-profile.component.css']
})
export class CompanyProfileComponent extends BaseComponent implements OnInit {
  companyProfileForm: UntypedFormGroup;
  imgSrc: string | ArrayBuffer = '';
  bannerSrc: string | ArrayBuffer = '';
  isLoading = false;
  //currencies: Currency[] = [];
  constructor(private route: ActivatedRoute,
    private fb: UntypedFormBuilder,
    private companyProfileService: CompanyProfileService,
    private router: Router,
    private toastrService: ToastrService,
    private securityService: SecurityService,
    public translationService: TranslationService,
    private commonService: CommonService) {
    super();
    // this.getLangDir();
  }

  ngOnInit(): void {
    this.createform();
    this.getCurrencies();
    this.route.data.subscribe((data: { profile: CompanyProfile }) => {
      this.companyProfileForm.patchValue(data.profile);
      if (data.profile.logoUrl) {
        this.imgSrc = environment.apiUrl + data.profile.logoUrl;
      }
      if (data.profile.bannerUrl) {
        this.bannerSrc = environment.apiUrl + data.profile.bannerUrl;
      }
    });
  }

  createform() {
    this.companyProfileForm = this.fb.group({
      id: [''],
      title: ['', [Validators.required]],
      logoUrl: [''],
      imageData: [],
      bannerUrl: [''],
      bannerData: ['']
    });
  }

  getCurrencies() {
    // this.commonService.getCurrencies().subscribe(data => this.currencies = data);
  }

  saveCompanyProfile() {
    if (this.companyProfileForm.invalid) {
      this.companyProfileForm.markAllAsTouched();
      return
    }
    const companyProfile: CompanyProfile = this.companyProfileForm.getRawValue();
    this.isLoading = true;
    this.companyProfileService.updateCompanyProfile(companyProfile)
      .subscribe((companyProfile: CompanyProfile) => {
        if (companyProfile.languages) {
          companyProfile.languages.forEach(lan => {
            lan.imageUrl = `${environment.apiUrl}${lan.imageUrl}`;
          })
        }
        this.isLoading = false;
        this.securityService.updateProfile(companyProfile);
        this.toastrService.success(this.translationService.getValue('COMPANY_PROFILE_UPDATED_SUCCESSFULLY'));
        this.router.navigate(['dashboard']);
      }, () => this.isLoading = false);
  }

  onFileSelect($event) {
    const fileSelected: File = $event.target.files[0];
    if (!fileSelected) {
      return;
    }
    const mimeType = fileSelected.type;
    if (mimeType.match(/image\/*/) == null) {
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(fileSelected);
    reader.onload = (_event) => {
      this.imgSrc = reader.result;
      this.companyProfileForm.patchValue({
        imageData: reader.result.toString(),
        logoUrl: fileSelected.name
      })
      $event.target.value = '';
    }
  }

  onBannerChange($event) {
    const fileSelected: File = $event.target.files[0];
    if (!fileSelected) {
      return;
    }
    const mimeType = fileSelected.type;
    if (mimeType.match(/image\/*/) == null) {
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(fileSelected);
    reader.onload = (_event) => {
      this.bannerSrc = reader.result;
      this.companyProfileForm.patchValue({
        bannerData: reader.result.toString(),
        bannerUrl: fileSelected.name
      })
      $event.target.value = '';
    }
  }
}
