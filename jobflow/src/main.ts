import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { redirectFullReloadToWelcome } from './app/core/full-reload-welcome-redirect';
import { markWelcomeAnimationForFullPageLoad } from './app/core/welcome-animation-flag';

if (!redirectFullReloadToWelcome()) {
  markWelcomeAnimationForFullPageLoad();
  bootstrapApplication(App, appConfig).catch(() => undefined);
}
