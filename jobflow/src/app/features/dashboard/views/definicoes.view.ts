import { Component, inject, ElementRef, afterNextRender, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { animateElementsFrom, createDashboardViewStagger } from '../dashboard.animations';

@Component({
  selector: 'app-definicoes-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './definicoes.view.html',
  styleUrls: ['./definicoes.view.scss'],
})
export class DefinicoesViewComponent implements OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private viewCtx?: ReturnType<typeof createDashboardViewStagger>;

  constructor() {
    afterNextRender(() => {
      requestAnimationFrame(() => {
        const root =
          (this.host.nativeElement.querySelector('.definicoes-view') as HTMLElement) ??
          this.host.nativeElement;
        this.viewCtx = createDashboardViewStagger(root);
        queueMicrotask(() =>
          animateElementsFrom(root, '.settings-section', {
            y: 18,
            opacity: 0,
            duration: 0.4,
            stagger: 0.1,
            ease: 'power3.out',
          }),
        );
      });
    });
  }

  ngOnDestroy(): void {
    this.viewCtx?.revert();
  }
  currentPassword = '';
  newPassword = '';
  newEmail = '';
  emailPassword = '';
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
}
