// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:5000/api'; // Update to your backend URL

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-session-id': Math.random().toString(36).substring(2),
    });
  }

  // Budget API calls
  createBudget(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/budget/new`, data, { headers: this.getHeaders() });
  }

  getBudgetDashboard(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/budget/dashboard?page=${page}&limit=${limit}`, { headers: this.getHeaders() });
  }

  exportBudgetPDF(exportType: string, budgetId?: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/budget/export_pdf/${exportType}${budgetId ? `/${budgetId}` : ''}`, {
      headers: this.getHeaders(),
      responseType: 'blob',
    });
  }

  // Bill API calls
  createBill(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/bill/new`, data, { headers: this.getHeaders() });
  }

  getBillDashboard(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/bill/dashboard?page=${page}&limit=${limit}`, { headers: this.getHeaders() });
  }

  toggleBillStatus(billId: string, status: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/bill/toggle`, { bill_id: billId, status }, { headers: this.getHeaders() });
  }

  exportBillPDF(exportType: string, billId?: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/bill/export_pdf/${exportType}${billId ? `/${billId}` : ''}`, {
      headers: this.getHeaders(),
      responseType: 'blob',
    });
  }

  // Shopping API calls
  createShoppingList(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/shopping/new_list`, data, { headers: this.getHeaders() });
  }

  addShoppingItem(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/shopping/new_item`, data, { headers: this.getHeaders() });
  }

  getShoppingDashboard(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/shopping/dashboard?page=${page}&limit=${limit}`, { headers: this.getHeaders() });
  }

  toggleShoppingItem(listId: string, itemId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/shopping/toggle_item`, { list_id: listId, item_id: itemId }, { headers: this.getHeaders() });
  }

  exportShoppingPDF(exportType: string, listId?: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/shopping/export_pdf/${exportType}${listId ? `/${listId}` : ''}`, {
      headers: this.getHeaders(),
      responseType: 'blob',
    });
  }
}