import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RoleHeaderComponent } from '../../shared/role-header/role-header.component';

@Component({
  selector: 'app-customer-care-layout',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule, RoleHeaderComponent],
  templateUrl: './customer-care-layout.component.html',
  styleUrl: './customer-care-layout.component.css'
})
export class CustomerCareLayoutComponent {

  isSidebarOpen = true;

  navItems: { label: string; link: string | any[] }[] = [
    { label: 'Home', link: '/customer-care/home' },
    { label: 'Conversations', link: '/customer-care/conversations' },
  ];

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

}
