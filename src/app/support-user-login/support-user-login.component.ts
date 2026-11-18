import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthApiService } from '../auth-api.service';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterModule } from '@angular/router';
import { LoginCredentials } from '../model/LoginCredentials';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OtpType, UserRoles } from '../constants/app-constants';

const ROLE_HOME_ROUTES: Record<string, string> = {
  [UserRoles.ADMIN]: 'admin/home',
  [UserRoles.MAINTAINER]: 'maintainer/home',
  [UserRoles.CUSTOMER_CARE]: 'customer-care/home',
};

@Component({
  selector: 'app-support-user-login',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule,CommonModule, RouterModule],
  templateUrl: './support-user-login.component.html',
  styleUrl: './support-user-login.component.scss',
})
export class SupportUserLoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;

  readonly roles = [
    { value: UserRoles.ADMIN, label: 'Admin' },
    { value: UserRoles.CUSTOMER_CARE, label: 'Customer Care' },
    { value: UserRoles.MAINTAINER, label: 'Maintainer' },
  ];

  showTwoFactorModal = false;
  isOtpSending = false;
  otp = '';
  dynamicPassword = '';
  pendingCredentials: LoginCredentials | null = null;

  readonly features = [
    { icon: 'fa-users-cog', title: 'User Management', description: 'Manage users and access permissions' },
    { icon: 'fa-chart-line', title: 'Analytics', description: 'Monitor system insights and reports' },
    { icon: 'fa-file-excel', title: 'Template Control', description: 'Upload and manage excel templates' },
    { icon: 'fa-shield-alt', title: 'Security', description: 'Maintain system integrity and access' },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authApiService: AuthApiService,
    private toastr: ToastrService,
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: [UserRoles.ADMIN, Validators.required],
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goToSignup() {
    this.router.navigate(['/admin/signup']);
  }

  goToForgotPassword() {
    // Add your forgot password navigation or modal logic here
    console.log('Forgot password clicked');
  }

  hasError(controlName: string, error: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!control?.touched && !!control.errors?.[error];
  }

  onSubmit(loginCredentials: LoginCredentials) {
    this.isLoading = true;

    if (loginCredentials.role === UserRoles.MAINTAINER) {
      this.authApiService.verifyCredentialsForTwoFactor(loginCredentials).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res?.data === true) {
            this.pendingCredentials = loginCredentials;
            this.otp = '';
            this.dynamicPassword = '';
            this.showTwoFactorModal = true;
            this.requestOtp(false);
          } else {
            this.toastr.error(res?.message || 'Invalid credentials', 'Login Failed');
          }
        },
        error: (err) => this.handleError(err),
      });
      return;
    }

    this.authApiService.loginApiFunction(loginCredentials).subscribe({
      next: (response) => this.handleLoginSuccess(response),
      error: (err) => this.handleError(err),
    });
  }

  requestOtp(resend: boolean) {
    if (!this.pendingCredentials) return;
    const email = this.pendingCredentials.username;
    this.isOtpSending = true;
    const call = resend
      ? this.authApiService.resendOtp(email, OtpType.TWO_FACTOR_AUTHENTICATION)
      : this.authApiService.getOtp(email, OtpType.TWO_FACTOR_AUTHENTICATION);
    call.subscribe({
      next: (res) => {
        this.isOtpSending = false;
        this.toastr.success(res?.message || 'OTP sent to your email');
      },
      error: (err) => {
        this.isOtpSending = false;
        this.handleError(err);
      },
    });
  }

  submitTwoFactor() {
    const otp = this.otp.trim();
    const dynamicPassword = this.dynamicPassword.trim();
    if (!this.pendingCredentials || (!otp && !dynamicPassword)) {
      this.toastr.error('Enter either OTP or dynamic password');
      return;
    }

    this.isLoading = true;
    this.authApiService
      .twoFactorVerification(this.pendingCredentials, otp || undefined, dynamicPassword || undefined)
      .subscribe({
        next: (res) => {
          if (!res?.data || typeof res.data !== 'object') {
            this.isLoading = false;
            this.toastr.error(res?.message, 'Verification Failed');
            return;
          }
          this.closeTwoFactorModal();
          this.handleLoginSuccess(res.data);
        },
        error: (err) => this.handleError(err),
      });
  }

  closeTwoFactorModal() {
    this.showTwoFactorModal = false;
    this.pendingCredentials = null;
    this.otp = '';
    this.dynamicPassword = '';
  }

  private handleLoginSuccess(response: { [key: string]: string }) {
    const role = Object.keys(response)[0];
    const token = response[role];
    this.isLoading = false;

    const homeRoute = ROLE_HOME_ROUTES[role];
    if (!homeRoute) {
      this.toastr.error('User is not authorized to login');
      return;
    }

    sessionStorage.setItem('moneyfi.auth', token);
    this.toastr.success('Login successful', 'Success', { timeOut: 1500 });
    this.router.navigate([homeRoute]);
  }

  private handleError(err: any) {
    this.isLoading = false;
    try {
      const errorObj =
        typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
      const message =
        errorObj?.message || errorObj?.error || 'Something went wrong';
      this.toastr.error(message, 'Login Failed');
    } catch (e) {
      console.error('Failed to parse error:', err.error);
      this.toastr.error('An error occurred', 'Login Failed');
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
