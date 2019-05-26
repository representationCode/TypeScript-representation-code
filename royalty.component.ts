import { RHAgreeUpdateData } from 'src/app/shared/MediaServiceModel';
import { Component, OnDestroy } from '@angular/core';
import { RightholderService } from '../../services/rightholder.service';
import { DictionaryService } from 'src/app/shared/services/dictionary.service';
import { IDictionary } from 'src/app/shared/dictionaryModel';
import { combineLatest, Subscription } from 'rxjs';

@Component({
  selector: 'app-royalty',
  templateUrl: './royalty.component.html',
  styleUrls: ['./royalty.component.sass']
})
export class RoyaltyComponent implements OnDestroy {
  private subscription: Subscription;
  /**list of receiving method */
  public dictionary: IDictionary;
  public rightHolder: RHAgreeUpdateData;
  /**active/notactive license */
  public isReadOnly = true;
  /**check current license by index */
  private readonly noReadonlyStates = 9;
  /**check on disabled variable */
  public agrStatus: boolean;
  constructor(
    private dicService: DictionaryService,
    public rightHolderService: RightholderService) {
    this.subscription = combineLatest(
      this.rightHolderService.changeContract$,
      this.dicService.getDictionary()).subscribe(([rholder, dictionaries]) => {
      if (rholder && dictionaries) {
        this.rightHolder = rholder;
        this.dictionary = dictionaries;
        this.isReadOnly = rholder.dest.agrStatus !== this.noReadonlyStates;
      }
    });
  }

  onChange() {
    // e.preventDefault();
    this.rightHolderService.isUpdated = true;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
