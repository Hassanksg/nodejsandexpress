// src/app/pages/budget/budget.page.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AlertController } from '@ionic/angular';
import { File } from '@ionic-native/file/ngx';

@Component({
  selector: 'app-budget',
  templateUrl: './budget.page.html',
  styleUrls: ['./budget.page.scss'],
})
export class BudgetPage implements OnInit {
  budgetData: any = {
    income: '',
    housing: '',
    food: '',
    transport: '',
    dependents: 0,
    miscellaneous: '',
    others: '',
    savings_goal: '',
    custom_categories: [],
  };
  dashboard: any = null;

  constructor(
    private apiService: ApiService,
    private alertCtrl: AlertController,
    private file: File
  ) {}

  ngOnInit() {
    this.loadDashboard();
  }

  async loadDashboard() {
    try {
      const response = await this.apiService.getBudgetDashboard().toPromise();
      this.dashboard = response;
    } catch (error) {
      this.showError('Failed to load dashboard');
    }
  }

  async createBudget() {
    try {
      await this.apiService.createBudget(this.budgetData).toPromise();
      this.loadDashboard();
      this.budgetData = { income: '', housing: '', food: '', transport: '', dependents: 0, miscellaneous: '', others: '', savings_goal: '', custom_categories: [] };
      this.showSuccess('Budget created successfully');
    } catch (error) {
      this.showError(error.error?.error || 'Failed to create budget');
    }
  }

  async exportPDF(exportType: string, budgetId?: string) {
    try {
      const response = await this.apiService.exportBudgetPDF(exportType, budgetId).toPromise();
      const blob = new Blob([response], { type: 'application/pdf' });
      const fileName = `budget_${exportType}_${new Date().toISOString().split('T')[0]}.pdf`;
      await this.file.writeFile(this.file.dataDirectory, fileName, blob, { replace: true });
      this.showSuccess(`PDF saved to ${fileName}`);
    } catch (error) {
      this.showError(error.error?.error || 'Failed to export PDF');
    }
  }

  async showError(message: string) {
    const alert = await this.alertCtrl.create({ header: 'Error', message, buttons: ['OK'] });
    await alert.present();
  }

  async showSuccess(message: string) {
    const alert = await this.alertCtrl.create({ header: 'Success', message, buttons: ['OK'] });
    await alert.present();
  }
}