import { CSAgreeUpdateData, AgrLicenseType, Period, AgreementAddBr } from './../../../../shared/MediaServiceModel';
import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CSContractService } from './../../services/cscontract.service';
import { convertToDate, DictionaryService } from 'src/app/shared';
import { Location } from '@angular/common';
import { combineLatest } from 'rxjs';
@Component({
  selector: 'app-contract-big-rights-potreb',
  templateUrl: './contract-big-rights-potreb.component.html',
  styleUrls: ['./contract-big-rights-potreb.component.sass']
})

export class ContractBigRightsPotrebComponent implements OnDestroy {
  private subscription: Subscription;
  /**current 'BigRight' data */
  public csAgreeData: CSAgreeUpdateData;
  /**mass of types for current right */
  public dictAgrLicType: AgrLicenseType[] = [];
  /**available period */
  public period: Period[] = [];
  public defaultItem = 0;
  /**for include edit current data */
  public isReadOnly = false;
  /**available index detect for edit mode */
  private readonly validStatus = 9;
  /**dates */
  public beginDate: Date;
  public endDate: Date;
  public licDate: Date;
  /**define const for 'Theater' */
  private readonly theaterConst = 28;
  constructor(
    private csContractService: CSContractService,
    private dicService: DictionaryService,
    private location: Location
  ) {
    /**check if exist data */
    if (this.csContractService.currentLicAgrParamIsNull === true) {
      this.location.back();
    }

    /**define one point for download data */
    this.subscription = combineLatest(
      this.csContractService.currentLicAgrParam$,
      this.dicService.getDictionary()).subscribe(([bright, dictionaries]) => {
        if (bright && dictionaries) {
          this.csAgreeData = bright;
          /**initialize dates */
          this.InitDates(bright.agreement.lic.agr.agreementAddBr[0]);
          this.isReadOnly = this.DefineStatus(bright);
          this.period = dictionaries.period;
          this.dictAgrLicType = this.filteredAgrLicType(dictionaries.agrLicenseType);
        }
      });
  }

  /**initialize dates */
  private InitDates(agreement: AgreementAddBr): void {
    if (agreement) {
      this.beginDate = convertToDate(agreement.dateBegin);
      this.endDate = convertToDate(agreement.dateEnd);
      this.licDate = convertToDate(agreement.agrDate);
    }
  }

  /**status current 'BigRight' */
  private DefineStatus(bright: CSAgreeUpdateData): boolean {
    if (bright.agreement && bright.agreement.licStatus) {
      /**defined active/noactive edit mode */
      return bright.agreement.licStatus !== this.validStatus;
    }
  }

  /**delete NULL dictionaries */
  private filteredAgrLicType(value: AgrLicenseType[]): AgrLicenseType[] {
    if (!value || value.length === 0) {
      return [];
    }
    return value.filter(item => item.series && item.codeI !== this.theaterConst );
  }

  /**back to active/not agreements */
  BackToGrid() {
    this.location.back();
  }

  onChange() {
    this.csContractService.isUpdated = true;
  }

  /**clean exist subscribe */
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
