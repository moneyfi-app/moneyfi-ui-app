import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { ConfirmLogoutDialogComponent } from '../../confirm-logout-dialog/confirm-logout-dialog.component';
import { ChangePasswordDialogComponent } from '../../change-password-dialog/change-password-dialog.component';

@Component({
  selector: 'app-role-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-header.component.html',
  styleUrl: './role-header.component.css'
})
export class RoleHeaderComponent implements OnInit {
  @Input() title = '';
  @Input() logoutRoute = '/support-user/login';
  @Input() theme: 'admin' | 'customer-care' = 'admin';

  username = '';
  isLogoutLoading = false;
  private readonly baseUrl = environment.BASE_URL;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.httpClient.get(`${this.baseUrl}/api/v1/user-service/common/get-username`, { responseType: 'text' }).subscribe({
      next: (username: string) => {
        this.username = username;
      },
      error: (error) => {
        console.error('Error fetching username', error);
      }
    });
  }

  changePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '400px'
    });
  }

  logoutUser(): void {
    const dialogRef = this.dialog.open(ConfirmLogoutDialogComponent, {
      width: '400px',
      panelClass: 'custom-dialog-container',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      this.isLogoutLoading = true;
      this.httpClient.post(`${this.baseUrl}/api/v1/user-service/common/logout`, {}, { responseType: 'text' }).subscribe({
        next: (response) => {
          this.isLogoutLoading = false;
          const jsonResponse = JSON.parse(response);
          if (jsonResponse.message === 'Logged out successfully') {
            this.toastr.success(jsonResponse.message, '', { timeOut: 1500 });
            sessionStorage.removeItem('moneyfi.auth');
            sessionStorage.clear();
            this.router.navigateByUrl(this.logoutRoute);
          } else {
            this.toastr.error('Failed to logout');
          }
        },
        error: (error) => {
          this.isLogoutLoading = false;
          console.error(error);
          this.toastr.error('Failed to logout');
        }
      });
    });
  }
}
