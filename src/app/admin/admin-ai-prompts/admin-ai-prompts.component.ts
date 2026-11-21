import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface AiPrompt {
  promptId: number;
  prompt: string;
  promptType: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

interface PaginatedAiPromptResponse {
  data: AiPrompt[];
  totalCount: number;
}

@Component({
  selector: 'app-admin-ai-prompts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-ai-prompts.component.html',
  styleUrl: './admin-ai-prompts.component.css',
})
export class AdminAiPromptsComponent implements OnInit, OnDestroy {
  readonly baseUrl = environment.BASE_URL;

  prompts: AiPrompt[] = [];
  isLoading = false;
  isSaving = false;
  showModal = false;
  operationType: 'create' | 'update' = 'create';

  search = '';
  searchBy = 'promptType';
  sortBy = 'updatedAt';
  sortOrder = 'DESC';
  offset = 0;
  limit = 10;
  totalCount = 0;

  formPromptId: number | null = null;
  formPrompt = '';
  formPromptType = '';

  readonly limitOptions = [10, 25, 50];
  readonly searchOptions = [
    // { value: 'prompt', label: 'Prompt' },
    { value: 'promptType', label: 'Prompt type' },
    // { value: 'createdBy', label: 'Created by' },
    // { value: 'updatedBy', label: 'Updated by' },
    // { value: 'createdAt', label: 'Created at' },
    // { value: 'updatedAt', label: 'Updated at' },
  ];
  private readonly searchInput = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(
    private httpClient: HttpClient,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.searchSubscription = this.searchInput
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.offset = 0;
        this.loadPrompts();
      });
    this.loadPrompts();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  loadPrompts(): void {
    this.isLoading = true;
    let params = new HttpParams()
      .set('offset', this.offset)
      .set('limit', this.limit)
      .set('sortBy', this.sortBy)
      .set('sortOrder', this.sortOrder);

    if (this.search.trim()) {
      params = params
        .set('search', this.search.trim())
        .set('searchBy', this.searchBy);
    }

    this.httpClient
      .get<PaginatedAiPromptResponse>(
        `${this.baseUrl}/api/v1/user-service/admin/get-ai-prompts`,
        { params },
      )
      .subscribe({
        next: (response) => {
          this.prompts = response?.data ?? [];
          this.totalCount = response?.totalCount ?? 0;
          this.isLoading = false;
        },
        error: (err) => {
          this.prompts = [];
          this.totalCount = 0;
          this.isLoading = false;
          try {
              const errorObj = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
              const message = errorObj?.message || errorObj?.error || 'Something went wrong';
              this.toastr.error(message);
            } catch (e) {
              console.error('Failed to parse error:', err.error);
              this.toastr.error('Failed to load AI prompts');
            }
        },
      });
  }

  onSearch(): void {
    this.offset = 0;
    this.loadPrompts();
  }

  onSearchInputChange(): void {
    this.searchInput.next(this.search);
  }

  onSearchByChange(): void {
    this.offset = 0;
    if (this.search.trim()) {
      this.loadPrompts();
    }
  }

  clearSearch(): void {
    this.search = '';
    this.offset = 0;
    this.loadPrompts();
  }

  changeSort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortOrder = 'ASC';
    }
    this.offset = 0;
    this.loadPrompts();
  }

  changeLimit(): void {
    this.offset = 0;
    this.loadPrompts();
  }

  previousPage(): void {
    if (this.offset === 0) return;
    this.offset = Math.max(0, this.offset - this.limit);
    this.loadPrompts();
  }

  nextPage(): void {
    if (this.offset + this.limit >= this.totalCount) return;
    this.offset += this.limit;
    this.loadPrompts();
  }

  get currentPage(): number {
    return this.limit ? Math.floor(this.offset / this.limit) + 1 : 1;
  }

  get totalPages(): number {
    return this.limit ? Math.max(1, Math.ceil(this.totalCount / this.limit)) : 1;
  }

  openCreateModal(): void {
    this.operationType = 'create';
    this.formPromptId = null;
    this.formPrompt = '';
    this.formPromptType = '';
    this.showModal = true;
  }

  openUpdateModal(prompt: AiPrompt): void {
    this.operationType = 'update';
    this.formPromptId = prompt.promptId;
    this.formPrompt = prompt.prompt;
    this.formPromptType = prompt.promptType;
    this.showModal = true;
  }

  closeModal(): void {
    if (this.isSaving) return;
    this.showModal = false;
  }

  savePrompt(): void {
    const prompt = this.formPrompt.trim();
    const promptType = this.formPromptType.trim();

    if (!prompt) {
      this.toastr.error('Prompt is required');
      return;
    }
    if (!promptType) {
      this.toastr.error('Prompt type is required');
      return;
    }

    this.isSaving = true;
    this.httpClient
      .post(`${this.baseUrl}/api/v1/user-service/admin/save-ai-prompt`, {
        promptId: this.operationType === 'update' ? this.formPromptId : null,
        prompt,
        promptType,
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.showModal = false;
          this.toastr.success(
            this.operationType === 'update'
              ? 'AI prompt updated successfully'
              : 'AI prompt created successfully',
          );
          this.loadPrompts();
        },
        error: (err) => {
          this.isSaving = false;
          try {
              const errorObj = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
              const message = errorObj?.message || errorObj?.error || 'Something went wrong';
              this.toastr.error(message);
            } catch (e) {
              console.error('Failed to parse error:', err.error);
          this.toastr.error('Failed to save AI prompt');
            }
        },
      });
  }
}
