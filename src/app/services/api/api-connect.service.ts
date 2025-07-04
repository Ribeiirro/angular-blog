import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiConnectService {

  httpClient = inject(HttpClient);

  getAll() {
    return this.httpClient.get('/api/products');
  }

  post(payload: any) {
    return this.httpClient.post('/api/products', payload);
  }
  
}
