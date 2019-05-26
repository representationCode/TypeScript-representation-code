import { Component, OnInit, OnDestroy } from '@angular/core';
import { LicenseAgrParam, VLicenseAgreementPortal } from '../../../../shared/MediaServiceModel';
import { CSContractService } from '../../services';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { DialogService } from '@progress/kendo-angular-dialog';

@Component({
  selector: 'app-contract-noactive-potreb',
  templateUrl: './contract-noactive-potreb.component.html',
  styleUrls: ['./contract-noactive-potreb.component.sass']
})
export class ContractNoactivePotrebComponent implements OnInit, OnDestroy {
  /**grid settings */
  pageSize = 20;
  skip = 0;
  value = 0;
  /**current not accepted contracts */
  public notActiveLic: VLicenseAgreementPortal[] = [];
  private subscription: Subscription;
  public readonly showDeleteBag = 9;
  constructor(private csContract: CSContractService,
              private router: Router,
              private route: ActivatedRoute) {
    /**actual data about not accepted contracts */
    this.subscription = this.csContract.changeLicNotAc$.subscribe(res => {
      if (res) {this.notActiveLic = res; }
    });
  }
  ngOnInit() {
    /**hide bottom menu */
    this.csContract.isDocumentMode = false;
  }
  /**detail information of the selected item of grid */
  cellClickHandler( { dataItem } ) {
    const item = <VLicenseAgreementPortal>dataItem;
    this.csContract.getLicenseAgreement( item.licId ).then( () => {
      /**define route by type contract */
      const strRoute = item.usesType === 1 ? 'bragreement' : 'sragreement';
      this.router.navigate(['../' + strRoute], { relativeTo: this.route });
      this.csContract.isDocumentMode = true;
    });
  }

  /**delete item */
  deleteItem(dataItem: LicenseAgrParam) {
    this.csContract.deleteLic(dataItem);
  }

  NewContract(event: Event) {
    event.preventDefault();
    this.csContract.newSRContract().then( res => {
      this.csContract.getLicenseAgreement( res.licId );
      this.router.navigate(['../sragreement'], { relativeTo: this.route });
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
