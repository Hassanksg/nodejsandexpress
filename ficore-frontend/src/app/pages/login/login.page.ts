import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email: string = '';
  password: string = '';
  displayName: string = '';
  isRegistering: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  toggleMode() {
    this.isRegistering = !this.isRegistering;
    this.email = '';
    this.password = '';
    this.displayName = '';
  }

  async login() {
    try {
      await this.authService.login(this.email, this.password).toPromise();
      this.router.navigate(['/budget']);
    } catch (error) {
      const alert = await this.alertCtrl.create({
        header: 'Login Failed',
        message: error.error?.error || 'Invalid credentials',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  async register() {
    try {
      await this.authService.register(this.displayName, this.email, this.password).toPromise();
      await this.authService.login(this.email, this.password).toPromise(); // Auto-login after registration
      this.router.navigate(['/budget']);
    } catch (error) {
      const alert = await this.alertCtrl.create({
        header: 'Registration Failed',
        message: error.error?.error || 'Could not register user',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }
}