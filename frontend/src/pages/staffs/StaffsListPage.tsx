import { UserListPage } from '@/pages/lists/UserListPage'

export function StaffsListPage() {
  return (
    <UserListPage
      title="Staffs"
      subtitle="Manage staff members and their role assignments"
      userType="STAFF"
      addLabel="Add Staff"
      viewModalTitle="Detail Staff"
      addModalTitle="Create New Staff"
      addModalSubtitle="Fill in the details below to add a new staff."
      editModalTitle="Edit Staff"
      editModalSubtitle="Fill in the details below to edit staff."
      useStaffLayout
      showStaffActions
      dropdownActiveLabel="Active Staff"
      dropdownInactiveLabel="Inactive Staff"
    />
  )
}
