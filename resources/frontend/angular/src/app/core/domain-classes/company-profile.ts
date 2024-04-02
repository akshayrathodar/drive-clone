import { LanguageFlag } from "./language-flag";

export class CompanyProfile {
  id?: string;
  title: string;
  address: string;
  logoUrl?: string;
  bannerUrl?: string;
  imageData?: string;
  phone?: string;
  email?: string;
  currencyCode?: string;
  languages?: LanguageFlag[];
}
