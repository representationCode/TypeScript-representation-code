import { Component, OnDestroy } from '@angular/core';
import { RightholderService } from 'src/app/main-app/Rightholder/services/rightholder.service';
import { VCustCmService, DictionaryService } from 'src/app/shared';
import { VCommunity, RHAgreeUpdateData } from '../../../../shared/MediaServiceModel';
import { combineLatest, Subscription } from 'rxjs';
export interface IGroupNames {
  crGroupCode: number;
  crGroupName: string;
  items: VCustCmService[];
}
@Component({
  selector: 'app-transmission',
  templateUrl: './transmission.component.html',
  styleUrls: ['./transmission.component.sass']
})
export class TransmissionComponent implements OnDestroy {
  private subscription: Subscription;
  public groupName: IGroupNames[] = [];
  public isReadOnly = true;
  /**index for check license */
  private readonly noReadOnlyStates = 9;
  public communities: VCommunity[] = [];
  public editItem: VCommunity | any;
  public rightHolder: RHAgreeUpdateData;
  private savedComm: VCustCmService;
  public buffer: VCustCmService;
  constructor(
    public serviceRightHolder: RightholderService,
    private dictionaryService: DictionaryService) {
    this.subscription = combineLatest(
      this.serviceRightHolder.changeContract$,
      this.dictionaryService.getCommunity()).subscribe(([listTerm, community]) => {
        if (listTerm && community) {
          this.isReadOnly = listTerm.dest.agrStatus !== this.noReadOnlyStates;
          this.groupName = this.sortGroupName(listTerm.termOfService);
          // this.communities = this.DisableUnusableEl(community);
          this.communities = community;
        }
      });
  }

  private sortGroupName(values: VCustCmService[]): IGroupNames[] {
    const group: IGroupNames[] = [];
    values.forEach( element => {
      const checkOnExist = group.some(x => x.crGroupCode === element.crGroupCode);
      if (!checkOnExist) {
        const newItem = <IGroupNames>{ crGroupCode: element.crGroupCode, crGroupName: element.crGroupName, items: [] };
        newItem.items = values.filter( rec => rec.crGroupCode === element.crGroupCode ).sort( ( a, b ) => a.crKindCode - b.crKindCode );
        group.push(newItem);
      }
    });

    return group.sort( ( a, b ) => a.crGroupCode - b.crGroupCode );
  }

  save(e: Event) {
    e.preventDefault();
    this.serviceRightHolder.saveDocument();
  }

  change(e: Event, obj: VCustCmService) {
    e.preventDefault();
    this.serviceRightHolder.isUpdated = true;
    // save current object data
    this.buffer = obj;
    obj.ourService = !obj.ourService;
    if (obj.ourService === false) {
      this.savedComm = obj;
      this.editItem = { };
    } else {
      // clear field
      obj.cmName = '';
    }
  }

  onCancel() {
    /**find certain element and reset data */
    this.groupName = this.ResetCertainDataElement(this.groupName);
  }

  onSave( data: VCommunity) {
    this.savedComm.cmName = data.cmName;
    this.savedComm.cmCustId = data.cmCustId;
    this.editItem = undefined;
  }

  /**reset certain element data */
  private ResetCertainDataElement(group: IGroupNames[]): IGroupNames[] {
    group.map(el => {
      if (el.crGroupCode === this.buffer.crGroupCode) {
        el.items.map(item => {
          if (item.crKindCode === this.buffer.crKindCode) {
            item.ourService = !item.ourService;
          }});
      }
    });
    return group;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
