import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-definicoes-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './definicoes.view.html',
  styleUrls: ['./definicoes.view.scss'],
})
export class DefinicoesViewComponent {
  currentPassword = '';
  newPassword = '';
  newEmail = '';
  emailPassword = '';
  themeLight = false;
  msgPassword = '';
  msgEmail = '';
  msgPasswordSuccess = false;
  msgEmailSuccess = false;

  onSubmitPassword(): void {
    this.msgPassword = 'Funcionalidade ligada ao backend quando disponível.';
    this.msgPasswordSuccess = false;
  }

  onSubmitEmail(): void {
    this.msgEmail = 'Funcionalidade ligada ao backend quando disponível.';
    this.msgEmailSuccess = false;
  }

  onThemeChange(checked: boolean): void {
    this.themeLight = checked;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', checked ? 'light' : 'dark');
    }
  }
}
