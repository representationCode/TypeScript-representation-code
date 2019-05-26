import { SystemConstant } from './../../../../../../../utils/MediaServiceModel';
import { IDictionary } from 'src/app/shared/dictionaryModel';
import { RHAgreeUpdateData, AgreementStatus } from './../../../../shared/MediaServiceModel';
import { Subscription } from 'rxjs';
import { Component, OnDestroy } from '@angular/core';
import { RightholderService } from 'src/app/main-app/Rightholder/services/rightholder.service';
import { DictionaryService } from 'src/app/shared';
import { combineLatest } from 'rxjs';
import { convertToDate } from 'src/app/shared/utils';

@Component({
  selector: 'app-contract-tab',
  templateUrl: './contract-tab.component.html',
  styleUrls: ['./contract-tab.component.sass']
})

export class ContractTabComponent implements OnDestroy {
  public readonlyRates = true;
  private subscription: Subscription;
  /**detial information of contract */
  public customerData: RHAgreeUpdateData;
  /**check on active/notactive current contract */
  public isReadOnly = false;
  /**index for disable edit contract */
  private readonly noReadOnlyStates = 9;
  /**Status contract */
  public statusWord = '';
  /**dates */
  public agrDate: string;
  public dateBegin: string;
  public dateEnd: string;
  public agrNumber: string;
  /**show rates */
  public rateForRight: number;
  public rateByCourt: number;
  constructor(
    public rightHolder: RightholderService,
    public dictService: DictionaryService
  ) {
    this.subscription = combineLatest(
      this.dictService.getDictionary(),
      this.rightHolder.changeContract$).subscribe(([dictionaries, rightH]) => {
      if (dictionaries && rightH) {
        /**update data */
        this.customerData = rightH;
        /**contract number, can have 'undefined' data */
        this.agrNumber = rightH.dest.agrNumber;
        /**handle for show date */
        this.HandleDates(rightH);
        this.InitializeRates();
        this.ControlEditData(rightH, dictionaries, this.noReadOnlyStates);
      }
    });
  }

  /**disbale or allow adit contract data */
  private ControlEditData(right: RHAgreeUpdateData, dictionaries: IDictionary, constant: number) {
    if (right.dest
      && right.dest.agrStatus) {
      const status: number = right.dest.agrStatus;
      this.isReadOnly = status !== constant;
      if (dictionaries.agreementStatus) {
        this.statusWord = this.statusContract(dictionaries.agreementStatus, status);
      }
    }
  }

  /**current status of contract */
  private statusContract(value: AgreementStatus[], status: number): string {
    return value.find(item => item.codeI === status).name;
  }

  /**initialize rates */
  private InitializeRates() {
    this.rateForRight = this.customerData.dest.rateCommiss ;
    this.rateByCourt = this.customerData.dest.rateCourt ;

  }

  /**initialize dates */
  private HandleDates (holder: RHAgreeUpdateData): void {
    this.agrDate = holder.dest.agrDate ? convertToDate(holder.dest.agrDate).toLocaleDateString() : '';
    this.dateBegin = holder.dest.dateBegin ? convertToDate(holder.dest.dateBegin).toLocaleDateString() : '';
    this.dateEnd = new Date(holder.dest.dateEnd).getFullYear() < 3000 ?
            convertToDate(holder.dest.dateEnd).toLocaleDateString() : 'Необмежено';
  }

  Send() {
    this.rightHolder.sendToAccept();
  }

  Save() {
    this.rightHolder.saveDocument( );
  }

  Cancel() {
    this.rightHolder.cancelEdit();
  }

  /**clean unused subscribes */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
