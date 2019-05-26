import { TerritoryInclude } from './../../../../shared/MediaServiceModel';
import { DictionaryService } from 'src/app/shared/services/dictionary.service';
import { Component, OnDestroy } from '@angular/core';
import { RightholderService } from 'src/app/main-app/Rightholder/services/rightholder.service';
import { IDictionary } from 'src/app/shared/dictionaryModel';
import { TerritoryExclude, RHAgreeUpdateData } from '../../../../shared/MediaServiceModel';
import { Country } from 'src/app/shared';
import { combineLatest, Subscription } from 'rxjs';

/**variants of title */
const enum Titles {
  ExcludeTer = 'Виключення по території',
  IncludeTer = 'Росповсюджується на території'
}
@Component({
  selector: 'app-region',
  templateUrl: './region.component.html',
  styleUrls: ['./region.component.sass']
})
export class RegionComponent implements OnDestroy {
  private subscription: Subscription;
  public rightHolder: RHAgreeUpdateData;
  public countrySorted: Country[];
  /**list of countries names */
  public dictionary: IDictionary;
  // public countryExclude: Country[];
  /**let change or not state */
  public isReadOnly = true;
  /**const for define active state of data*/
  private readonly noReadOnlyStates = 9;
  public editItem: TerritoryExclude | TerritoryInclude | any;
  /**active title */
  public outMessage = '';
  /**sequence of countries for grid */
  public targetCountries: TerritoryExclude[] | TerritoryInclude[] = [];
  constructor(
    public serviceRightHolder: RightholderService,
    private dicService: DictionaryService) {
      this.subscription = combineLatest(
        this.serviceRightHolder.changeContract$,
        this.dicService.getDictionary()).subscribe(([rholder, dictionaries]) => {
          if (rholder && dictionaries) {
            this.rightHolder = rholder;
            this.dictionary = dictionaries;
            this.ControlCountries(this.serviceRightHolder, rholder);
            this.outMessage = this.ActiveTitle(rholder);
            /**arguments will be changed */
            this.initData(this.rightHolder, this.dictionary);
          }
      });
  }

  /**control countries state */
  private ControlCountries(holder: RightholderService, agree: RHAgreeUpdateData) {
      if (holder.customerDataForSave
        && holder.customerDataForSave.dest
        && holder.customerDataForSave.dest.cust
        && agree.dest && agree.dest.cust && agree.dest.cust.territoryExclude
        && agree.dest.cust.territoryInclude) {
          this.targetCountries = holder.customerDataForSave.dest.cust.aroundWord
                                  ? agree.dest.cust.territoryExclude
                                  : agree.dest.cust.territoryInclude;
        }
  }

  /**define active title */
  private ActiveTitle(rholder: RHAgreeUpdateData): string {
    let message = '';
    if (rholder.dest && rholder.dest.cust) {
      message = rholder.dest.cust.aroundWord ? Titles.ExcludeTer : Titles.IncludeTer;
    }
    return message;
  }

  /**save active country name by countryCode */
  private setCountryName( item: TerritoryExclude | TerritoryInclude | any,
                          dictionary: IDictionary ) {
    const country = dictionary.country.find( rec => rec.countryCode === item.countryCode );
    item.countryName = country.countryName;
  }

  /**handle data for list of countries */
  private initData(rightHolder: RHAgreeUpdateData, dictionary: IDictionary) {
    rightHolder.dest.cust.territoryInclude.forEach( item => this.setCountryName(item, dictionary) );
    rightHolder.dest.cust.territoryExclude.forEach( item => this.setCountryName(item, dictionary) );
    this.countrySorted = dictionary.country.sort( (l, r) => l.countryName.localeCompare(  r.countryName ));
    this.isReadOnly =  rightHolder.dest.agrStatus !== this.noReadOnlyStates;
  }

  removeHandler({dataItem}) {
    const index = this.targetCountries.indexOf( dataItem );
    if ( index >= 0 ) {
      this.targetCountries.splice(index, 1);
      this.serviceRightHolder.isUpdated = true;
    }
  }

  addHandler() {
    this.editItem = { };
    this.serviceRightHolder.isUpdated = true;
  }

  onSave( data: TerritoryExclude | TerritoryInclude ) {
    this.targetCountries.push( data );
    this.editItem = undefined;
  }

  onCancel() {
    // this.edit
  }

  // Service command with document
  sendDoc( event: Event ) {
    event.preventDefault();
    this.serviceRightHolder.sendToAccept();
  }

  saveDoc( event: Event ) {
    event.preventDefault();
    this.serviceRightHolder.saveDocument().then(() => {
    });
  }

  rejectModify( event: Event ) {
    event.preventDefault();
    this.serviceRightHolder.getRightHolderWithDocument();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
