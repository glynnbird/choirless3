<script setup>
// composables
const { logout } = useAuth()

// log out
await logout()
</script>
