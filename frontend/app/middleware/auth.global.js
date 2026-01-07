export default defineNuxtRouteMiddleware((to, from) => {
  // composables
  const { isLoggedIn, loadFromLocalStorage } = useAuth()

  // if we are not logged in
  if (!isLoggedIn()) {
    // see if we have an apikey stashed in local storage
    console.log('loading auth from localStorage')
    loadFromLocalStorage()
  }

  // if we're not already on the login page and we're not logged in... go to login page
  if (to.fullPath !== '/login' && !isLoggedIn()) {
    return navigateTo('/login')
  }
})
