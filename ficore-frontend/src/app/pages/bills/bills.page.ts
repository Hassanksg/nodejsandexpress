// src/app/pages/bills/bills.page.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AlertController } from '@ionic/angular';
import { File } from '@ionic-native/file/ngx';

@Component({
  selector: 'app-bills',
  templateUrl: './bills.page.html',
  styleUrls: ['./bills.page.scss'],
})
export class BillsPage implements OnInit {
  billData: any = {
    name: '',
    amount: '',
    due_date: '',
    frequency: 'one-time',
    category: 'Utilities',
    reminder_days: 0,
    notes: '',
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
      const response = await this.apiService.getBillDashboard().toPromise();
      this.dashboard = response;
    } catch (error) {
      this.showError('Failed to load dashboard');
    }
  }

  async createBill() {
    try {
      await this.apiService.createBill(this.billData).toPromise();
      this.loadDashboard();
      this.billData = { name: '', amount: '', due_date: '', frequency: 'one-time', category: 'Utilities', reminder_days: 0, notes: '' };
      this.showSuccess('Bill created successfully');
    } catch (error) {
      this.showError(error.error?.error || 'Failed to create bill');
    }
  }

  async toggleBillStatus(billId: string, status: string) {
    try {
      await this.apiService.toggleBillStatus(billId, status).toPromise();
      this.loadDashboard();
      this.showSuccess('Bill status updated');
    } catch (error) {
      this.showError(error.error?.error || 'Failed to update bill status');
    }
  }

  async exportPDF(exportType: string, billId?: string) {
    try {
      const response = await this.apiService.exportBillPDF(exportType, billId).toPromise();
      const blob = new Blob([response], { type: 'application/pdf' });
      const fileName = `bill_${exportType}_${new Date().toISOString().split('T')[0]}.pdf`;
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