import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { JwtToken } from './model/JwtToken';
import { LoginCredentials } from './model/LoginCredentials';
import { SignupCredentials } from './model/SignupCredentials';
import { environment } from '../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthApiService {

  constructor(private authClient:HttpClient) { }
  private fbLoginSubject = new Subject<any>();
  fbLogin$ = this.fbLoginSubject.asObservable();

  baseUrl = environment.BASE_URL;
  
  loginApiFunction(loginCredentials:LoginCredentials):Observable<{ [key: string]: string }>{
    return this.authClient.post<{ [key: string]: string }>(`${this.baseUrl}/api/v1/user-service/auth/login`, loginCredentials);
    // console.log(token);
  }

  verifyCredentialsForTwoFactor(credentials: LoginCredentials): Observable<{ data: boolean; other: string; message: string }> {
    return this.authClient.post<{ data: boolean; other: string; message: string }>(
      `${this.baseUrl}/api/v1/user-service/auth/two-factor-auth/verify-password`, credentials);
  }

  getOtp(email: string, type: string): Observable<{ data: boolean; message: string }> {
    return this.authClient.get<{ data: boolean; message: string }>(
      `${this.baseUrl}/api/v1/user-service/auth/get-otp`, { params: { email, type } });
  }

  resendOtp(email: string, type: string): Observable<{ data: boolean; message: string }> {
    return this.authClient.get<{ data: boolean; message: string }>(
      `${this.baseUrl}/api/v1/user-service/auth/resend-otp`, { params: { email, type } });
  }

  twoFactorVerification(credentials: LoginCredentials, otp?: string, dynamicPassword?: string): Observable<{ data: { [key: string]: string }; message: string }> {
    const params: { [key: string]: string } = {};
    if (otp) params['otp'] = otp;
    if (dynamicPassword) params['dynamicPassword'] = dynamicPassword;
    return this.authClient.post<{ data: { [key: string]: string }; message: string }>(
      `${this.baseUrl}/api/v1/user-service/auth/two-factor-auth/verification`, credentials, { params });
  }

  signupApiFunction(signupCredentials:SignupCredentials):Observable<JwtToken>{
    return this.authClient.post<JwtToken>(`${this.baseUrl}/api/v1/user-service/auth/register`, signupCredentials);
  }

  loginWithFacebook(code: string): Observable<any> {
    return this.authClient.post('https://your-backend.com/auth/facebook/exchange', { code });
  }

  setFbLoginData(data: any) {
    this.fbLoginSubject.next(data);
  }


  
}
