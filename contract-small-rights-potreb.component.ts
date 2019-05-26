import { AgrLicenseType, CSAgreeUpdateData, Period, LicenseAgrParam } from './../../../../shared/MediaServiceModel';
import { CSContractService } from './../../services/cscontract.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, Observable, Subject } from 'rxjs';
import { DictionaryService } from 'src/app/shared';
import { Location } from '@angular/common';
import { convertToDate } from '../../../../shared/utils';
import { combineLatest } from 'rxjs';
import { DialogRef, DialogCloseResult, DialogService } from '@progress/kendo-angular-dialog';
import { CanComponentDeactivate } from 'src/app/shared/guards/can-deactivate-guard.service';

/**for comfortable save states of: licCode, bussinessPlaces */
interface ISimpleState {
  code: number;
  bussinessPlaces: boolean[];
}

enum DialogText {

}
@Component({
  selector: 'app-contract-small-rights-potreb',
  templateUrl: './contract-small-rights-potreb.component.html',
  styleUrls: ['./contract-small-rights-potreb.component.sass']
})

export class ContractSmallRightsPotrebComponent implements OnDestroy, OnInit, CanComponentDeactivate {
  private isUpdateContract = false;
  public retCanDeactivate: Observable<boolean>;
  /**save initial value for 'licCode' and 'businessPlaces'*/
  private stateBuf: ISimpleState;
  /**settings for grid */
  pageSize = 20;
  skip = 0;
  /**selected item for custom dictionary */
  public defaultItem = 0;
  /**period for SmallRight */
  public period: Period[] = [];
  /**data of current SmallRight */
  public mapLicenseData: CSAgreeUpdateData;
  /**type of license */
  public dictAgrLicType: AgrLicenseType[] = [];
  /**for include edit current data */
  public isReadOnly = false;
  /**saved all dictionaries */
  private agrLicenseType: AgrLicenseType[] = [];
  private subscription: Subscription;
  /**available index detect for edit mode */
  private readonly validStatus = 9;
  /**custom dictionary */
  public indxInfl: number;
  /**dates */
  public beginDate: Date;
  public endDate: Date;
  public licDate: Date;
  public readonly dictAutoProlong = [
        { value: 0, text: 'з підвищенням гарантованого платежу, згідно індексу інфляції'},
        { value: 1 , text: 'з підвищенням гарантованого платежу на'}
      ];
  /**for control current contract on type - theatre */
  public readonly changeForm = 28;
  constructor(
    private csContractService: CSContractService,
    private dicService: DictionaryService,
    private location: Location,
    private dialogService: DialogService) {
    /**back to agreements if data is empty */
    if ( this.csContractService.currentLicAgrParamIsNull ) {
      this.location.back();
    }

    this.subscription = combineLatest(
      this.csContractService.currentLicAgrParam$,
      this.dicService.getDictionary()).subscribe(([lic, dictionaries]) => {
        if (lic && dictionaries) {
          this.mapLicenseData = lic;
          /**for detect something 'unsaved changes' */
          this.stateBuf = this.StatesBuffered(lic);
          this.InitDates(this.mapLicenseData.agreement);
          /**control default item for custom dictionary */
          const isExist: boolean = !this.mapLicenseData.agreement.indxInfl
                                && !this.mapLicenseData.agreement.addRate;
          this.defaultItem = isExist || this.mapLicenseData.agreement.indxInfl ? 0 : 1;
          /**show indxInfl - if indxInfl is undefined then set 0 */
          this.indxInfl = isExist || this.mapLicenseData.agreement.indxInfl ? this.mapLicenseData.agreement.indxInfl : 0;

          /**set empty massive if data is lose */
          this.period = dictionaries.period ? dictionaries.period : [];
          /**set empty massive if data is lose */
          this.agrLicenseType = dictionaries.agrLicenseType ? dictionaries.agrLicenseType : [];
          /**right sequence type of smallRight */
          this.dictAgrLicType = this.filteredAgrLicType(this.agrLicenseType);
        }
      });
  }

  ngOnInit() {
    /**hide top menu */
    this.csContractService.isDocumentMode = true;
  }

  /**initialize dates */
  private InitDates(agreement: LicenseAgrParam) {
    if (agreement) {
      this.beginDate = convertToDate(agreement.dateBegin);
      this.endDate = convertToDate(agreement.dateEnd);
      this.licDate = convertToDate(agreement.licDate);
      this.DefineActiveMode(agreement.licStatus);
    }
  }

  /**status current SmallRight */
  private DefineActiveMode(licStatus: number) {
    /**defined active/notactive edit mode */
    this.isReadOnly = licStatus !== this.validStatus;
  }

  /**save states: licCode, bussinesPlaces */
  private StatesBuffered(data: CSAgreeUpdateData): ISimpleState {
    /**save state for licCode */
    const state: ISimpleState = {
      code: data.agreement.lic.licCode,
      bussinessPlaces: []
    };
    /**save state for businessPlaces */
    for (let i = 0; i < data.buisnessPlaces.length; i++) {
      state.bussinessPlaces.push(data.buisnessPlaces[i].inLicense);
    }
    return state;
  }

  valueCatchTheatre() {
    if (!this.ExistChanges(this.mapLicenseData, this.stateBuf)) {
      this.isUpdateContract = true;
    } else {
      this.isUpdateContract = false;
    }
  }

  ChangedLicenseState() {
    if (!this.ExistChanges(this.mapLicenseData, this.stateBuf)) {
      this.isUpdateContract = true;
    } else {
      this.isUpdateContract = false;
    }
  }

  /** filter on NULL field -> series */
  private filteredAgrLicType(value: AgrLicenseType[]): AgrLicenseType[] {
    if ( !value || value.length === 0 ) {
      return [];
    }
    return value.filter( item => item.series !== undefined && item.codeI !== 28);
  }

  public dateChange(value: Date, dest: string) {
    const addHours = value.getTimezoneOffset() / 60;
    value.setHours( value.getHours() - addHours);
    switch (dest) {
      case 'dateBegin':
      (<any>this.mapLicenseData.agreement.dateBegin) = value.toJSON().substring(0, 19);
        break;
      case 'endDate':
      (<any>this.mapLicenseData.agreement.dateEnd) = value.toJSON().substring(0, 19);
        break;

      default:
        break;
    }
  }

  SendNewLicenseData() {
    /**save edited data */
    this.csContractService.putLicenseAgreement(this.mapLicenseData);
    this.isUpdateContract = false;
  }

  /**reset data */
  UpdateLicenseData() {
    this.csContractService.getLicenseAgreement(this.mapLicenseData.agreement.licId)
      .then(res => this.mapLicenseData = res);
    /**changes is not exist */
    this.isUpdateContract = false;
  }

  /**send on accept */
  SendAccept() {
    if (this.BeforeAccept(this.mapLicenseData)) {
      this.csContractService.SendAccept(this.mapLicenseData);
      this.isUpdateContract = false;
    } else {
      /**show dialog */
      this.StateBusinessPlaces();
    }
  }

  /**check on valid state contract before 'Accept' */
  private BeforeAccept(contract: CSAgreeUpdateData): boolean {
    for (let i = 0; i < contract.buisnessPlaces.length; i++) {
      if (contract.buisnessPlaces[i].inLicense) {
        /**if one item is 'true', then all 'ok' */
        return true;
      }
    }
    /**all businessPlace is false, 'Accept' is not allow */
    return false;
  }

  /**back to active/noactive agreements */
  BackToGrid() {
    this.location.back();
  }

  /**show dialog valid state business places*/
  private StateBusinessPlaces(): void {
    const dialog: DialogRef = this.dialogService.open({
      content: 'Ви не обрали жодної бізнес-точки до договору. Будь ласка, оберіть бізнес-точку',
      actions: [{ text: 'Ok', primary: true }],
      width: 450,
      height: 150,
      minWidth: 250
    });
  }

  /**check on changed data */
  private ExistChanges(data: CSAgreeUpdateData, buffer: ISimpleState): boolean {
    /**check licCode */
    let result: boolean = buffer.code === data.agreement.lic.licCode;
    if (!result) {
      return result;
    }
    /**check all businessPlaces */
    for (let i = 0; i < data.buisnessPlaces.length; i++) {
      result = data.buisnessPlaces[i].inLicense === buffer.bussinessPlaces[i];
      if (!result) {
        return result;
      }
    }
    return result;
  }

  public canDeactivate(): Observable<boolean> | boolean {
    if (this.isUpdateContract !== true) {
      return true;
    }
    if (this.retCanDeactivate !== undefined) {
      return this.retCanDeactivate;
    }

    const subject = new Subject<boolean>();
    this.retCanDeactivate = subject.asObservable();

    const dialog: DialogRef = this.dialogService.open({
      content: 'Перейти без збереження змін?',
      actions: [{ text: 'Так', primary: true }, { text: 'Ні' }],
      width: 450,
      height: 150,
      minWidth: 250
    });

    dialog.result.subscribe(res => {
      this.retCanDeactivate = undefined;
      if (res instanceof DialogCloseResult) {
        subject.next(false);
        return false;
      }
      if (res.primary === true) {
        this.isUpdateContract = false;
        subject.next(true);
      }

      subject.next(false);
    });

    return this.retCanDeactivate;
  }

  /**clean exist sinscribes */
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
