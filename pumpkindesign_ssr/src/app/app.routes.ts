import { Routes } from '@angular/router';
import { Page } from './components/organisms/page/page';

export const routes: Routes = [{ path: '**', component: Page }];
