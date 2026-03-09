import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  template: `
    <div [class]="contentOnly ? 'h-full bg-app-bg text-app-ink' : 'h-screen overflow-hidden bg-app-bg text-app-ink'">
      <div [class]="contentOnly ? 'h-full' : 'flex h-full'">
        @if (!contentOnly) {
          <aside
            class="flex h-full w-[250px] shrink-0 flex-col overflow-hidden border-r border-app-border bg-app-surface px-5 py-6"
          >
            <div class="flex justify-center">
              <div class="skeleton-item h-14 w-14 rounded-full"></div>
            </div>

            <div class="mt-10 space-y-2">
              <div class="skeleton-item h-10 w-full rounded-xl"></div>
              <div class="skeleton-item h-10 w-full rounded-xl"></div>
              <div class="skeleton-item h-10 w-full rounded-xl"></div>
            </div>

            <div class="mt-auto space-y-5">
              <div>
                <div class="skeleton-item mb-2 h-3 w-16 rounded"></div>
                <div class="skeleton-item h-10 w-24 rounded-xl"></div>
              </div>

              <div class="skeleton-item h-10 w-full rounded-xl"></div>
            </div>
          </aside>
        }

        <main [class]="contentOnly ? 'h-full overflow-y-auto overflow-x-hidden' : 'h-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden'">
          <div class="p-4 sm:p-5 lg:p-8">
            <div class="mb-6 flex items-center justify-between gap-4">
              <div class="skeleton-item h-9 w-48 rounded-lg"></div>
              <div class="flex items-center gap-3">
                <div class="skeleton-item h-10 w-10 rounded-full"></div>
                <div class="skeleton-item h-10 w-10 rounded-full"></div>
                <div class="skeleton-item h-11 w-11 rounded-full"></div>
              </div>
            </div>

            @switch (route) {
              @case ('accounts') {
                <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div class="skeleton-item h-32 rounded-3xl"></div>
                  <div class="skeleton-item h-32 rounded-3xl"></div>
                  <div class="skeleton-item h-32 rounded-3xl"></div>
                  <div class="skeleton-item h-32 rounded-3xl"></div>
                </div>

                <div class="grid gap-6 xl:grid-cols-2">
                  <div class="app-card p-6">
                    <div class="skeleton-item mb-4 h-7 w-52 rounded-lg"></div>
                    <div class="space-y-3">
                      <div class="skeleton-item h-20 rounded-2xl"></div>
                      <div class="skeleton-item h-20 rounded-2xl"></div>
                      <div class="skeleton-item h-20 rounded-2xl"></div>
                    </div>
                  </div>

                  <div class="app-card p-6">
                    <div class="skeleton-item mb-4 h-7 w-36 rounded-lg"></div>
                    <div class="skeleton-item h-64 rounded-3xl"></div>
                  </div>

                  <div class="app-card p-6">
                    <div class="skeleton-item mb-4 h-7 w-64 rounded-lg"></div>
                    <div class="skeleton-item h-64 rounded-2xl"></div>
                  </div>

                  <div class="app-card p-6">
                    <div class="skeleton-item mb-4 h-7 w-44 rounded-lg"></div>
                    <div class="space-y-3">
                      <div class="skeleton-item h-16 rounded-2xl"></div>
                      <div class="skeleton-item h-16 rounded-2xl"></div>
                      <div class="skeleton-item h-16 rounded-2xl"></div>
                    </div>
                  </div>
                </div>
              }

              @case ('register') {
                <div class="app-card p-5 sm:p-6 lg:p-8">
                  <div class="mb-8 border-b border-app-border pb-3">
                    <div class="skeleton-item h-7 w-24 rounded-lg"></div>
                  </div>

                  <div class="grid gap-6 sm:gap-8 lg:grid-cols-[170px_1fr] lg:gap-10">
                    <div class="flex justify-center lg:justify-start">
                      <div class="skeleton-item h-28 w-28 rounded-full"></div>
                    </div>

                    <div class="grid gap-4 sm:gap-5 md:grid-cols-2">
                      <div class="skeleton-item h-16 rounded-xl"></div>
                      <div class="skeleton-item h-16 rounded-xl"></div>
                      <div class="skeleton-item h-16 rounded-xl"></div>
                      <div class="skeleton-item h-16 rounded-xl"></div>
                      <div class="skeleton-item h-16 rounded-xl"></div>
                      <div class="skeleton-item h-16 rounded-xl"></div>
                      <div class="skeleton-item h-16 rounded-xl"></div>
                      <div class="skeleton-item h-16 rounded-xl"></div>
                    </div>
                  </div>

                  <div class="mt-10 flex justify-stretch sm:justify-end">
                    <div class="skeleton-item h-11 w-full rounded-xl sm:w-32"></div>
                  </div>
                </div>
              }

              @case ('generic') {
                <div class="grid gap-6 xl:grid-cols-2">
                  <div class="app-card p-6">
                    <div class="skeleton-item mb-4 h-7 w-40 rounded-lg"></div>
                    <div class="skeleton-item h-64 rounded-2xl"></div>
                  </div>
                  <div class="app-card p-6">
                    <div class="skeleton-item mb-4 h-7 w-48 rounded-lg"></div>
                    <div class="skeleton-item h-64 rounded-2xl"></div>
                  </div>
                </div>
              }

              @default {
                <div class="grid gap-6 xl:grid-cols-2">
                  <div class="app-card p-6">
                    <div class="skeleton-item mb-4 h-7 w-44 rounded-lg"></div>
                    <div class="skeleton-item h-64 rounded-2xl"></div>
                  </div>

                  <div class="app-card p-6">
                    <div class="skeleton-item mb-4 h-7 w-52 rounded-lg"></div>
                    <div class="space-y-3">
                      <div class="skeleton-item h-20 rounded-2xl"></div>
                      <div class="skeleton-item h-20 rounded-2xl"></div>
                      <div class="skeleton-item h-20 rounded-2xl"></div>
                    </div>
                  </div>

                  <div class="app-card p-6">
                    <div class="skeleton-item mb-4 h-7 w-40 rounded-lg"></div>
                    <div class="grid gap-4 xl:grid-cols-2">
                      <div class="skeleton-item h-52 rounded-3xl"></div>
                      <div class="skeleton-item h-52 rounded-3xl"></div>
                    </div>
                  </div>

                  <div class="app-card p-6">
                    <div class="skeleton-item mb-4 h-7 w-48 rounded-lg"></div>
                    <div class="skeleton-item h-64 rounded-2xl"></div>
                  </div>
                </div>
              }
            }
          </div>
        </main>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLoadingSkeletonComponent {
  @Input() route: 'dashboard' | 'accounts' | 'register' | 'generic' = 'dashboard';
  @Input() contentOnly = false;
}
