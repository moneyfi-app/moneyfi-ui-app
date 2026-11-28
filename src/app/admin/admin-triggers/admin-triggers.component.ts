import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { AdminUsernameAutocompleteComponent } from '../admin-username-autocomplete/admin-username-autocomplete.component';

@Component({
  selector: 'app-admin-triggers',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminUsernameAutocompleteComponent],
  templateUrl: './admin-triggers.component.html',
  styleUrl: './admin-triggers.component.css',
})
export class AdminTriggersComponent {
  loading = false;
  message = '';

  private readonly today = new Date().toLocaleDateString('en-CA');

  batches = [
    {
      type: 'INCOME',
      label: 'Income',
      recipientType: 'ALL',
      username: '',
      date: this.today,
    },
    {
      type: 'EXPENSE',
      label: 'Expense',
      recipientType: 'ALL',
      username: '',
      date: this.today,
    },
    {
      type: 'GOAL',
      label: 'Goal',
      recipientType: 'ALL',
      username: '',
      date: this.today,
    },
  ];

  baseUrl = environment.BASE_URL;

  triggerBatch(
    type: string,
    recipientType: string,
    username?: string,
    date?: string
  ): void {
    const token = sessionStorage.getItem('moneyfi.auth');

    let url = `${this.baseUrl}/api/v1/transaction/admin/batch-sync?type=${encodeURIComponent(type)}`;

    if (recipientType === 'SPECIFIC' && username) {
      url += `&username=${encodeURIComponent(username)}`;
    }

    if (date) {
      url += `&date=${encodeURIComponent(date)}`;
    }

    this.loading = true;

    fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized');
          }

          if (response.status === 403) {
            throw new Error('Access denied');
          }

          throw new Error('Batch trigger failed');
        }

        this.message = `${type} batch triggered successfully`;
      })
      .catch((error) => {
        this.message = error.message;
      })
      .finally(() => {
        this.loading = false;
      });
  }

}