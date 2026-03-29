import {
  Component,
  ElementRef,
  inject,
  afterNextRender,
  OnDestroy,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import gsap from 'gsap';
import { consumeWelcomeFullPageAnimationFlag } from '../../core/welcome-animation-flag';
import { prefersReducedMotion } from '../../core/motion-prefs';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
})
export class WelcomeComponent implements OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private ctx?: gsap.Context;

  constructor() {
    afterNextRender(() => {
      // Dois frames: garante layout/pintura antes do GSAP (evita animação “presa” até haver interação).
      requestAnimationFrame(() => {
        requestAnimationFrame(() => this.mountWelcomeAnimations());
      });
    });
  }

  private mountWelcomeAnimations(): void {
    const root = this.host.nativeElement;
    const runEntrance = consumeWelcomeFullPageAnimationFlag() && !prefersReducedMotion();

    this.ctx?.revert();
    this.ctx = gsap.context(() => {
      if (runEntrance) {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.from('.welcome__orb', {
          scale: 0,
          opacity: 0,
          duration: 1,
          stagger: 0.12,
          ease: 'back.out(1.4)',
        })
          .from(
            '.welcome__line',
            { scaleX: 0, duration: 0.7, transformOrigin: 'left center' },
            '-=0.5',
          )
          .from(
            '.welcome__badge',
            { y: 24, opacity: 0, duration: 0.55 },
            '-=0.4',
          )
          .from(
            '.welcome__title-word',
            { y: 48, opacity: 0, rotateX: -12, duration: 0.65, stagger: 0.08 },
            '-=0.35',
          )
          .from(
            '.welcome__lead',
            { y: 20, opacity: 0, duration: 0.5 },
            '-=0.25',
          )
          .from(
            '.welcome__actions .welcome__btn',
            { y: 16, opacity: 0, duration: 0.45, stagger: 0.1 },
            '-=0.2',
          );
      } else {
        gsap.set('.welcome__orb', { scale: 1, opacity: 1 });
        gsap.set('.welcome__line', { scaleX: 1, transformOrigin: 'center center' });
        gsap.set('.welcome__badge', { y: 0, opacity: 1 });
        gsap.set('.welcome__title-word', { y: 0, opacity: 1, rotateX: 0 });
        gsap.set('.welcome__lead', { y: 0, opacity: 1 });
        gsap.set('.welcome__actions .welcome__btn', { y: 0, opacity: 1 });
      }

      if (!prefersReducedMotion()) {
        gsap.to('.welcome__orb--a', {
          y: -14,
          duration: 3.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
        gsap.to('.welcome__orb--b', {
          y: 12,
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 0.4,
        });
      }
    }, root);
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
