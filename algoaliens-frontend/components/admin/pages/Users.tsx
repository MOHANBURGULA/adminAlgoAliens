"use client"

import { useEffect, useMemo, useState } from "react"
import { GraduationCap, Shield, Users as UsersIcon } from "lucide-react"
import toast from "react-hot-toast"
import UserDetailsModal from "@/components/admin/modals/UserDetailsModal"
import Badge from "@/components/admin/ui/Badge"
import Button from "@/components/admin/ui/Button"
import FilterBar from "@/components/admin/ui/FilterBar"
import StatsCard from "@/components/admin/ui/StatsCard"
import Table, { type AdminTableColumn } from "@/components/admin/ui/Table"
import {
  buildCourseMap,
  compareByCreatedAtDesc,
  formatAdminDate,
  getRoleMeta,
  type AdminCourseRecord,
  type AdminUserRecord,
} from "@/lib/admin-panel"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"
import { useDebouncedValue } from "@/lib/use-debounced-value"

type SortKey = "name" | "email" | "role" | "createdAt"

export default function UsersAdminPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [courses, setCourses] = useState<AdminCourseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("name")
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const debouncedSearch = useDebouncedValue(search, 250)

  const loadUsers = async () => {
    try {
      const [usersResponse, coursesResponse] = await Promise.all([
        apiClient.get("/api/admin/users"),
        apiClient.get("/api/admin/courses"),
      ])

      setUsers(Array.isArray(usersResponse.data) ? (usersResponse.data as AdminUserRecord[]) : [])
      setCourses(Array.isArray(coursesResponse.data) ? (coursesResponse.data as AdminCourseRecord[]) : [])
      setError("")
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError, "Unable to load users."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()

    return [...users]
      .filter((user) => {
        if (!query) {
          return true
        }

        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query)
        )
      })
      .sort((left, right) => {
        if (sortBy === "createdAt") {
          return compareByCreatedAtDesc(left.createdAt, right.createdAt)
        }

        return left[sortBy].localeCompare(right[sortBy])
      })
  }, [debouncedSearch, sortBy, users])

  const studentCount = useMemo(
    () => users.filter((user) => user.role !== "admin").length,
    [users],
  )
  const adminCount = useMemo(
    () => users.filter((user) => user.role === "admin").length,
    [users],
  )
  const courseMap = useMemo(() => buildCourseMap(courses), [courses])

  const changeRole = async (userId: number, role: string) => {
    try {
      await apiClient.put(`/api/admin/users/${userId}/role`, { role })
      toast.success("Role updated")
      await loadUsers()
    } catch (updateError: unknown) {
      toast.error(getApiErrorMessage(updateError, "Unable to update role."))
    }
  }

  const columns: AdminTableColumn<AdminUserRecord>[] = [
    {
      key: "name",
      header: "Name",
      render: (user) => <span className="text-white">{user.name}</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (user) => user.email,
    },
    {
      key: "role",
      header: "Role",
      render: (user) => {
        const meta = getRoleMeta(user.role)
        return <Badge tone={meta.tone}>{meta.label}</Badge>
      },
    },
    {
      key: "createdAt",
      header: "Created Date",
      render: (user) => formatAdminDate(user.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      className: "min-w-56",
      render: (user) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedUserId(user.id)}>
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void changeRole(user.id, user.role === "admin" ? "student" : "admin")}
          >
            Make {user.role === "admin" ? "Student" : "Admin"}
          </Button>
        </div>
      ),
    },
  ]

  if (loading) {
    return <div className="text-gray-300">Loading users...</div>
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
        {error}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl text-white">Users</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-400">
            Search accounts, sort the roster, and open user-level enrollment, evaluation, and
            certificate details without leaving the table.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Total Users" value={users.length} icon={UsersIcon} />
          <StatsCard label="Students" value={studentCount} icon={GraduationCap} />
          <StatsCard label="Admins" value={adminCount} icon={Shield} />
          <StatsCard
            label="Visible Rows"
            value={filteredUsers.length}
            icon={UsersIcon}
            hint="After current search and sort"
          />
        </section>

        <FilterBar summary={`${filteredUsers.length} of ${users.length} users shown`}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users"
            className="input-ui min-w-full sm:min-w-64 lg:max-w-xs"
          />
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortKey)}
            className="input-ui min-w-full sm:min-w-52 lg:max-w-xs"
          >
            <option value="name">Sort by name</option>
            <option value="email">Sort by email</option>
            <option value="role">Sort by role</option>
            <option value="createdAt">Sort by created date</option>
          </select>
        </FilterBar>

        <Table
          data={filteredUsers}
          columns={columns}
          getRowKey={(user) => user.id}
          emptyState={
            <div className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-6 text-gray-300 shadow-lg shadow-black/20">
              No users match the current search.
            </div>
          }
          renderMobileCard={(user) => {
            const meta = getRoleMeta(user.role)

            return (
              <article className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-5 shadow-lg shadow-black/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base text-white">{user.name}</h3>
                    <p className="mt-1 text-sm text-gray-400">{user.email}</p>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
                <p className="mt-4 text-sm text-gray-400">Created {formatAdminDate(user.createdAt)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedUserId(user.id)}>
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void changeRole(user.id, user.role === "admin" ? "student" : "admin")}
                  >
                    Make {user.role === "admin" ? "Student" : "Admin"}
                  </Button>
                </div>
              </article>
            )
          }}
        />
      </div>

      <UserDetailsModal
        open={selectedUserId !== null}
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        courseMap={courseMap}
      />
    </>
  )
}
