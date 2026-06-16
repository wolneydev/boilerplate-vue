<template>
  <div class="container">
    <header class="page-head">
      <div>
        <p class="page-kicker">Management</p>
        <h1>Users</h1>
      </div>
      <router-link to="/users/new">
        <button type="button">Add new</button>
      </router-link>
    </header>

    <div class="toolbar">
      <input
        type="text"
        v-model="searchInput"
        @input="onSearchInput"
        placeholder="Search by ID, name or email..."
      />
    </div>

    <div v-if="loading" class="state muted">Loading users...</div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-if="!loading && !error" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.id }}</td>
            <td>{{ u.name }}</td>
            <td>{{ u.email }}</td>
            <td>
              <div class="row-actions">
                <button class="btn btn-ghost btn-sm" @click="viewUser(u)">View</button>
                <button class="btn btn-secondary btn-sm" @click="editUser(u)">Edit</button>
                <button class="btn btn-danger btn-sm" @click="handleDelete(u)">Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="4" class="state muted">No users found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && !error" class="pagination">
      <button class="btn btn-ghost btn-sm" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">
        Previous
      </button>

      <span class="pagination__info muted">Page {{ currentPage }} of {{ lastPage }}</span>

      <button
        class="btn btn-ghost btn-sm"
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage === lastPage"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { debounce } from 'lodash'

const router = useRouter()
const store = useStore()

const users = computed(() => store.getters['users/allUsers'])
const loading = computed(() => store.getters['users/isLoading'])
const error = computed(() => store.getters['users/userError'])
const currentPage = computed(() => store.getters['users/currentPage'])
const lastPage = computed(() => store.getters['users/lastPage'])
const searchTerm = computed(() => store.getters['users/searchTerm'])

const searchInput = ref(searchTerm.value)

const debouncedSearch = debounce((value) => {
  store.dispatch('users/updateSearch', value)
}, 500)

const onSearchInput = () => {
  debouncedSearch(searchInput.value)
}

const fetchUsers = (page) => {
  store.dispatch('users/fetchUsers', page)
}

fetchUsers(currentPage.value)

const editUser = (user) => {
  router.push(`/users/${user.id}/edit`)
}

const viewUser = (user) => {
  alert(`View user details: ${user.name}`)
}

const handleDelete = async (user) => {
  if (!confirm(`Are you sure you want to delete the user ${user.name}?`)) {
    return
  }

  try {
    await store.dispatch('users/deleteUser', user.id)
    alert('User deleted successfully.')

    if (users.value.length === 0 && currentPage.value > 1) {
      fetchUsers(currentPage.value - 1)
    } else {
      fetchUsers(currentPage.value)
    }
  } catch (err) {
    alert(err.message || 'Error deleting user.')
  }
}

const goToPage = (page) => {
  if (page < 1 || page > lastPage.value) return
  fetchUsers(page)
}
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-head h1 {
  margin: 0;
}

.page-kicker {
  margin: 0 0 0.25rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.toolbar {
  margin-bottom: 1.25rem;
}

.table-wrap {
  overflow-x: auto;
}

.col-actions {
  width: 1%;
  white-space: nowrap;
}

.row-actions {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
}

.state {
  padding: 1.5rem;
  text-align: center;
}

.alert {
  margin-bottom: 1rem;
}

.pagination {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.pagination__info {
  font-size: 0.9rem;
  font-weight: 500;
}

@media (max-width: 600px) {
  .page-head {
    flex-direction: column;
    align-items: stretch;
  }
  .row-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
