import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { AdminCommonServiceService } from '../admin-common-service.service';

@Component({
  selector: 'app-admin-username-autocomplete',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-username-autocomplete.component.html',
  styleUrl: './admin-username-autocomplete.component.css',
})
export class AdminUsernameAutocompleteComponent implements OnDestroy {
  private readonly pageSize = 10;

  @Input() value = '';
  @Input() placeholder = 'Enter username';
  @Input() disabled = false;
  @Input() clearOnSelect = false;
  @Input() excludedUsernames: string[] = [];
  @Output() valueChange = new EventEmitter<string>();
  @Output() usernameSelected = new EventEmitter<string>();

  suggestions: string[] = [];
  showSuggestions = false;
  isLoading = false;

  private isFocused = false;
  private searchTerm = '';
  private nextOffset = 0;
  private hasMoreResults = false;
  private activeRequest?: Subscription;

  constructor(
    private readonly adminCommonService: AdminCommonServiceService,
    private readonly toastr: ToastrService,
  ) {}

  ngOnDestroy(): void {
    this.hasMoreResults = false;
    this.isFocused = false;
    this.activeRequest?.unsubscribe();
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = value.trim();
    this.hasMoreResults = false;
    this.activeRequest?.unsubscribe();
    this.isLoading = false;
    this.value = value;
    this.valueChange.emit(value);
    this.nextOffset = 0;
    this.hasMoreResults = this.searchTerm.length >= 2;
    this.suggestions = [];
    this.showSuggestions = false;
    if (this.hasMoreResults) {
      this.loadNextPage();
    }
  }

  loadNextPage(): void {
    if (this.isLoading || !this.hasMoreResults || this.searchTerm.length < 2) return;

    const query = this.searchTerm;
    const offset = this.nextOffset;
    let loadAnotherPage = false;
    this.isLoading = true;

    this.activeRequest = this.adminCommonService
      .getUsernames(offset, this.pageSize, query)
      .pipe(
        finalize(() => {
          if (query !== this.searchTerm) return;
          this.isLoading = false;
          if (loadAnotherPage) {
            this.loadNextPage();
          }
        }),
      )
      .subscribe({
        next: (usernames) => {
          if (query !== this.searchTerm) return;

          const page = usernames.slice(0, this.pageSize);
          this.nextOffset += page.length;
          this.hasMoreResults = page.length === this.pageSize;

          const seenUsernames = new Set(this.suggestions);
          const newSuggestions: string[] = [];
          for (const username of page) {
            if (this.excludedUsernames.includes(username) || seenUsernames.has(username)) {
              continue;
            }
            seenUsernames.add(username);
            newSuggestions.push(username);
          }
          this.suggestions = [...this.suggestions, ...newSuggestions];
          this.showSuggestions = this.isFocused && this.suggestions.length > 0;
          loadAnotherPage =
            this.isFocused && this.hasMoreResults && this.suggestions.length === 0;
        },
        error: () => {
          if (query === this.searchTerm) {
            this.toastr.error('Failed to search usernames');
          }
        },
      });
  }

  onSuggestionsScroll(event: Event): void {
    const element = event.target as HTMLElement;
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 16) {
      this.loadNextPage();
    }
  }

  onFocus(): void {
    this.isFocused = true;
    this.showSuggestions = this.suggestions.length > 0;
  }

  onBlur(): void {
    this.isFocused = false;
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  selectUsername(event: MouseEvent, username: string): void {
    event.preventDefault();
    this.activeRequest?.unsubscribe();
    this.isLoading = false;
    this.value = this.clearOnSelect ? '' : username;
    this.valueChange.emit(this.value);
    this.usernameSelected.emit(username);
    this.suggestions = [];
    this.showSuggestions = false;
    this.hasMoreResults = false;
  }
}
