import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { AccountsPageComponent } from './features/accounts/accounts-page.component';
import { LoginPageComponent } from './features/auth/login-page.component';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { RegisterAccountPageComponent } from './features/register-account/register-account-page.component';

export const routes: Routes = [
	{ path: 'login', component: LoginPageComponent, canActivate: [guestGuard] },
	{
		path: '',
		canActivate: [authGuard],
		children: [
			{ path: '', pathMatch: 'full', redirectTo: 'dashboard' },
			{ path: 'dashboard', component: DashboardPageComponent },
			{ path: 'accounts', component: AccountsPageComponent },
			{ path: 'register-account', component: RegisterAccountPageComponent },
		],
	},
	{ path: '**', redirectTo: '' },
];
