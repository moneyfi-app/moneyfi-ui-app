import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AdminUsernameAutocompleteComponent } from '../admin-username-autocomplete/admin-username-autocomplete.component';

interface ServerConfiguration {
  configurationId?: number;
  operationType: string;
  operationValue: string | null;
  valueMeasuredQuantity: string;
  createdBy: string;
  updatedBy: string;
  lastUpdatedAt: string | null;
}

interface ServerConfigurationsResponse {
  data: ServerConfiguration[];
  totalCount: number;
}

type SearchField = 'operationType' | 'createdBy' | 'updatedBy';

@Component({
  selector: 'app-admin-server-configurations',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, AdminUsernameAutocompleteComponent],
  templateUrl: './admin-server-configurations.component.html',
  styleUrl: './admin-server-configurations.component.css',
})
export class AdminServerConfigurationsComponent implements OnInit, OnDestroy {
  readonly baseUrl = environment.BASE_URL;
  readonly limitOptions = [10, 25, 50];
  readonly searchOptions: { value: SearchField; label: string }[] = [
    { value: 'operationType', label: 'Configuration' },
    { value: 'createdBy', label: 'Created by' },
    { value: 'updatedBy', label: 'Updated by' },
  ];

  configurations: ServerConfiguration[] = [];
  isLoading = false;
  isSaving = false;
  showModal = false;

  search = '';
  searchBy: SearchField = 'operationType';
  offset = 0;
  limit = 10;
  totalCount = 0;

  private allConfigurations: ServerConfiguration[] = [];
  formConfigurationId: number | null = null;
  formOperationType = '';
  formOperationValue = '';
  formTargetUsers: 'ALL' | 'SPECIFIC' = 'ALL';
  formUsername = '';
  private isUsernameSelected = false;

  private readonly searchInput = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.searchSubscription = this.searchInput
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.offset = 0;
        this.applyLocalView();
      });
    this.loadConfigurations();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  loadConfigurations(): void {
    this.isLoading = true;
    this.httpClient
      .get<ServerConfigurationsResponse>(
        `${this.baseUrl}/api/v1/user-service/admin/get-user-configurations`,
      )
      .subscribe({
        next: (response) => {
          this.allConfigurations = response?.data ?? [];
          this.applyLocalView();
          this.isLoading = false;
        },
        error: () => {
          this.allConfigurations = [];
          this.configurations = [];
          this.totalCount = 0;
          this.isLoading = false;
          this.toastr.error('Failed to load server configurations');
        },
      });
  }

  onSearchInputChange(): void {
    this.searchInput.next(this.search);
  }

  onSearch(): void {
    this.offset = 0;
    this.applyLocalView();
  }

  onSearchByChange(): void {
    this.offset = 0;
    this.applyLocalView();
  }

  clearSearch(): void {
    this.search = '';
    this.offset = 0;
    this.applyLocalView();
  }

  changeLimit(): void {
    this.offset = 0;
    this.applyLocalView();
  }

  previousPage(): void {
    if (this.offset === 0) return;
    this.offset = Math.max(0, this.offset - this.limit);
    this.applyLocalView();
  }

  nextPage(): void {
    if (this.offset + this.limit >= this.totalCount) return;
    this.offset += this.limit;
    this.applyLocalView();
  }

  get currentPage(): number {
    return this.limit ? Math.floor(this.offset / this.limit) + 1 : 1;
  }

  get totalPages(): number {
    return this.limit ? Math.max(1, Math.ceil(this.totalCount / this.limit)) : 1;
  }

  openUpdateModal(configuration: ServerConfiguration): void {
    this.formConfigurationId = configuration.configurationId ?? null;
    this.formOperationType = configuration.operationType;
    this.formOperationValue = configuration.operationValue ?? '';
    this.formTargetUsers = 'ALL';
    this.formUsername = '';
    this.isUsernameSelected = false;
    this.showModal = true;
  }

  closeModal(): void {
    if (this.isSaving) return;
    this.showModal = false;
  }

  onTargetUsersChange(): void {
    this.formUsername = '';
    this.isUsernameSelected = false;
  }

  onUsernameValueChange(username: string): void {
    this.formUsername = username;
    this.isUsernameSelected = false;
  }

  selectUsername(username: string): void {
    this.formUsername = username;
    this.isUsernameSelected = true;
  }

  saveConfiguration(): void {
    const operationValue = this.formOperationValue.trim();
    if (!operationValue) {
      this.toastr.error('Configuration value is required');
      return;
    }
    const username = this.formUsername.trim();
    if (this.formTargetUsers === 'SPECIFIC' && (!username || !this.isUsernameSelected)) {
      this.toastr.error('Select a username for the specific user configuration');
      return;
    }

    let params = new HttpParams()
      .set('operationType', this.formOperationType)
      .set('operationValue', operationValue)
      .set('targetUsers', this.formTargetUsers);
    if (this.formConfigurationId !== null) {
      params = params.set('configurationId', this.formConfigurationId);
    }
    if (this.formTargetUsers === 'SPECIFIC') {
      params = params.set('username', username);
    }

    this.isSaving = true;
    this.httpClient
      .get(`${this.baseUrl}/api/v1/user-service/admin/save-user-configuration`, { params })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.showModal = false;
          this.toastr.success('Server configuration updated successfully');
          this.loadConfigurations();
        },
        error: () => {
          this.isSaving = false;
          this.toastr.error('Failed to save server configuration');
        },
      });
  }

  private applyLocalView(): void {
    const searchTerm = this.search.trim().toLocaleLowerCase();
    const filteredConfigurations = this.allConfigurations.filter((configuration) => {
      if (!searchTerm) return true;
      const valuesToSearch =
        this.searchBy === 'operationType'
          ? [configuration.operationType, configuration.operationValue]
          : [configuration[this.searchBy]];
      return valuesToSearch.some((value) =>
        value?.toLocaleLowerCase().includes(searchTerm),
      );
    });

    this.totalCount = filteredConfigurations.length;
    const lastPageOffset = Math.max(
      0,
      Math.floor((this.totalCount - 1) / this.limit) * this.limit,
    );
    this.offset = Math.min(this.offset, lastPageOffset);
    this.configurations = filteredConfigurations.slice(this.offset, this.offset + this.limit);
  }
}
