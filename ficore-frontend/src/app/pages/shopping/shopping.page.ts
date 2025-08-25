// src/app/pages/shopping/shopping.page.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AlertController } from '@ionic/angular';
import { File } from '@ionic-native/file/ngx';

@Component({
  selector: 'app-shopping',
  templateUrl: './shopping.page.html',
  styleUrls: ['./shopping.page.scss'],
})
export class ShoppingPage implements OnInit {
  listData: any = { list_name: '', budget: '', items: [] };
  newItem: any = { name: '', estimated_cost: '', quantity: 1 };
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
      const response = await this.apiService.getShoppingDashboard().toPromise();
      this.dashboard = response;
    } catch (error) {
      this.showError('Failed to load dashboard');
    }
  }

  async createList() {
    try {
      await this.apiService.createShoppingList(this.listData).toPromise();
      this.loadDashboard();
      this.listData = { list_name: '', budget: '', items: [] };
      this.showSuccess('Shopping list created successfully');
    } catch (error) {
      this.showError(error.error?.error || 'Failed to create list');
    }
  }

  async addItem() {
    try {
      const listId = this.dashboard?.latest_list?._id;
      if (!listId) throw new Error('No list selected');
      await this.apiService.addShoppingItem({ list_id: listId, ...this.newItem }).toPromise();
      this.loadDashboard();
      this.newItem = { name: '', estimated_cost: '', quantity: 1 };
      this.showSuccess('Item added successfully');
    } catch (error) {
      this.showError(error.error?.error || 'Failed to add item');
    }
  }

  async toggleItem(listId: string, itemId: string) {
    try {
      await this.apiService.toggleShoppingItem(listId, itemId).toPromise();
      this.loadDashboard();
      this.showSuccess('Item status updated');
    } catch (error) {
      this.showError(error.error?.error || 'Failed to update item status');
    }
  }

  async exportPDF(exportType: string, listId?: string) {
    try {
      const response = await this.apiService.exportShoppingPDF(exportType, listId).toPromise();
      const blob = new Blob([response], { type: 'application/pdf' });
      const fileName = `shopping_${exportType}_${new Date().toISOString().split('T')[0]}.pdf`;
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