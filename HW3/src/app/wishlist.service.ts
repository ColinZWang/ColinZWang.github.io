import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment'; // Ensure this path is correct


@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private BASE_URL = "https://webdev3backend.wm.r.appspot.com"; // Use the environment's apiUrl

  constructor(private http: HttpClient) { }

  addToWishlist(item: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}/wishlist`, item);
  }

  getWishlist(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/wishlist`);
  }

  removeFromWishlist(id: string): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/wishlist/${id}`);
  }
}
