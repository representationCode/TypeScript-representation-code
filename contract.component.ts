import { Location } from '@angular/common';
import { RightholderService } from 'src/app/main-app/Rightholder/services/rightholder.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CanComponentDeactivate } from 'src/app/shared/guards/can-deactivate-guard.service';
import { Observable, of, Subject, merge, interval } from 'rxjs';
import { DialogRef, DialogCloseResult, DialogService } from '@progress/kendo-angular-dialog';
import { map, delay, switchMap, mapTo } from 'rxjs/operators';

@Component({
  selector: 'app-contract',
  templateUrl: './contract.component.html',
  styleUrls: ['./contract.component.sass']
})
export class ContractComponent implements OnInit, CanComponentDeactivate, OnDestroy {
  public checkState = false;
  public SideBarIndex = 1;
  private retCanDeactivated: Observable<boolean>;

  // tslint:disable-next-line:max-line-length
  constructor(private serviceHolder: RightholderService,
              private route: ActivatedRoute,
              private dialogService: DialogService,
              private router: Router,
              private location: Location) {
    this.serviceHolder.getRightHolderWithDocument().then(() => {
      this.checkState = true;
    });
  }

  ngOnInit() {
    const url = this.route.firstChild.snapshot.routeConfig.path;
    this.currentUrl(url);
  }

  currentUrl(url: string) {
    switch (url) {
      case 'contract':
        this.SideBarIndex = 1;
        break;
      case 'royalty':
        this.SideBarIndex = 2;
        break;
      case 'transmission':
        this.SideBarIndex = 3;
        break;
      case 'region':
        this.SideBarIndex = 4;
        break;

      default:
        break;
    }
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (this.serviceHolder.isUpdated === false) {
      return true;
    }

    if (this.retCanDeactivated !== undefined) {
      return this.retCanDeactivated;
    }

    const subj = new Subject<boolean>();
    this.retCanDeactivated = subj.asObservable();

    const dialog: DialogRef = this.dialogService.open({
      content: 'Перейти без збереження змін?',
      actions: [{ text: 'Так', primary: true }, { text: 'Ні' }],
      width: 450,
      height: 150,
      minWidth: 250
    });

    dialog.result.subscribe(res => {
      this.retCanDeactivated = undefined;
      if (res instanceof DialogCloseResult) {
        subj.next(false);
        return false;
      }
      if (res.primary === true) {
        subj.next(true);
      }

      subj.next(false);
    });

    return this.retCanDeactivated;
  }
  ngOnDestroy(): void {}
}
