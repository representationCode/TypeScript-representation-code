import { VLicenseAgreementPortal } from 'src/app/shared/MediaServiceModel';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CSContractService } from '../../services';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, Observable, Subject } from 'rxjs';
import { CanComponentDeactivate } from 'src/app/shared/guards/can-deactivate-guard.service';
import { DialogRef, DialogService, DialogCloseResult } from '@progress/kendo-angular-dialog';

@Component({
  selector: 'app-contract-active-potreb',
  templateUrl: './contract-active-potreb.component.html',
  styleUrls: ['./contract-active-potreb.component.sass']
})
export class ContractActivePotrebComponent implements OnInit, OnDestroy, CanComponentDeactivate {
  public retCanDeactivate: Observable<boolean>;
  /**setting for grid */
  pageSize = 20;
  skip = 0;
  /**active contracts */
  public licAc: VLicenseAgreementPortal[] = [];
  private subscription: Subscription;
  constructor(
    private csContract: CSContractService,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: DialogService
  ) {
    /**get accepted contracts */
    this.subscription = this.csContract.changeLicAc$.subscribe(res => {
      if (res) {this.licAc = res; }
    });
  }

  ngOnInit() {
    /**hide bottom menu */
    this.csContract.isDocumentMode = false;
  }

  /**get detail information about item of grid */
  cellClickHandler( { dataItem } ) {
    const item = <VLicenseAgreementPortal>dataItem;
    this.csContract.getLicenseAgreement(item.licId).then( () => {
      /**defined type of the selected contract */
      const strRoute = item.usesType === 1 ? 'bragreement' : 'sragreement';
      this.router.navigate(['../' + strRoute], { relativeTo: this.route });
      /**hide top menu */
      this.csContract.isDocumentMode = true;
    });
  }

  public canDeactivate(): Observable<boolean> | boolean {
    if (this.csContract.isUpdated !== true) {
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
        this.csContract.isUpdated = false;
        subject.next(true);
      }

      subject.next(false);
    });

    return this.retCanDeactivate;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
