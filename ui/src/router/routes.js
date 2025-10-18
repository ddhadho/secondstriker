const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'matches', component: () => import('pages/MatchesPage.vue'), meta: { requiresAuth: true } },
      { path: 'tournaments', name: 'tournaments', component: () => import('pages/TournamentsPage.vue'), meta: { requiresAuth: true } },
      { path: 'leagues', name: 'leagues', component: () => import('pages/LeaguesPage.vue'), meta: { requiresAuth: true } },
      { path: 'profile', name: 'profile', component: () => import('pages/ProfilePage.vue'), meta: { requiresAuth: true } }
    ]
  },
  {
    path: '/:type/:competitionId',
    component: () => import('layouts/MinimalLayout.vue'),
    children: [
      {
        path: '',
        name: 'competition',
        component: () => import('src/pages/CompetitionPage.vue'),
        meta: { requiresAuth: true },
        beforeEnter: (to, from, next) => {
          // Validate competition type
          const validTypes = ['league', 'tournament'];
          if (!validTypes.includes(to.params.type)) {
            console.warn("Invalid competition type:", to.params.type);
            next({ name: 'notFound' });
          } else {
            next();
          }
        },
      },
    ],
  },
  {
    path: '/wallet',
    component: () => import('layouts/MinimalLayout.vue'),
    children: [
      { path: '', name: 'wallet', component: () => import('pages/WalletPage.vue'), meta: { requiresAuth: true } }
    ]
  },
  {
    path: '/login',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: '', name: 'login', component: () => import('pages/LoginPage.vue'), meta: { requiresGuest: true } }
    ]
  },
  {
    path: '/register',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: '', name: 'register', component: () => import('pages/RegisterPage.vue'), meta: { requiresGuest: true } }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    name: 'notFound',
    component: () => import('pages/ErrorNotFound.vue')
  }
];

export default routes;
