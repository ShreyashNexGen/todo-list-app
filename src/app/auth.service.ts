import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:5000';

    constructor(private http: HttpClient, private router: Router) {
        
    }

    signup(username: string, password: string) {
        return this.http.post(`${this.apiUrl}/signup`, { username, password });
    }

    login(username: string, password: string) {
        return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { username, password })
            .subscribe(response => {
                localStorage.setItem('token', response.token);
                this.router.navigate(['/']);
            });
    }

    logout() {
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
    }

    isLoggedIn() {
        return !!localStorage.getItem('token');
    }
    getUserIdFromToken(token: string | null): string | null {
        if (!token) return null;
        const payload = token.split('.')[1]; // Get the payload part of the JWT
        const decoded = JSON.parse(atob(payload)); // Decode the payload
        return decoded.id; // Return the user ID
    }
} 