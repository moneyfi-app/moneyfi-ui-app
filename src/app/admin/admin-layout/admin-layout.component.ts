import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RoleHeaderComponent } from '../../shared/role-header/role-header.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule, RoleHeaderComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {

  isSidebarOpen = true;

  navItems: { label: string; link: string | any[] }[] = [
    { label: 'Dashboard', link: '/admin/home' },
    { label: 'Total Users', link: ['/admin/users', 'All'] },
    { label: 'User Requests', link: ['/admin/requests', 'All'] },
    { label: 'User Issues', link: '/admin/user-defects' },
    { label: 'User Feedbacks', link: '/admin/feedbacks' },
    { label: 'Insights/Charts', link: '/admin/insights' },
    { label: 'Configuration', link: '/admin/configuration' },
    { label: 'Failed Queues', link: '/admin/configuration/failed-queues' },
  ];

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

}
